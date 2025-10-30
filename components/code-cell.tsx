'use client'

import { useState, useEffect, memo } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Play, Trash2, Bot, GripVertical, Copy, ArrowUp, ArrowDown } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell } from '@/lib/actions/notebooks'
import { useTheme } from 'next-themes'
import { ChartRenderer } from './chart-renderer'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Extend window to store notebook contexts
declare global {
  interface Window {
    __notebookContexts: Record<string, any>
  }
}

interface CodeCellProps {
  cell: {
    id: string
    content: string
    output?: string | null
    language: string
    order: number
  }
  tabId: string
  notebookId: string
  isSelected: boolean
  onSelect: () => void
  onCellDeleted: (cellId: string) => void
  onCellsChanged: (selectCellId?: string) => void
  onContentChange: (cellId: string, content: string, output?: string) => void
}

function CodeCellComponent({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: CodeCellProps) {
  const [code, setCode] = useState(cell.content)
  const [output, setOutput] = useState(cell.output || '')
  const [language, setLanguage] = useState(cell.language)
  const [isRunning, setIsRunning] = useState(false)
  const [isAskingAI, setIsAskingAI] = useState(false)
  const [editorRef, setEditorRef] = useState<any>(null)
  const { theme } = useTheme()

  // Setup drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cell.id })

  // Sync from parent when cell prop changes (e.g., tab switch)
  useEffect(() => {
    setCode(cell.content)
    setOutput(cell.output || '')
    setLanguage(cell.language)
  }, [cell.content, cell.output, cell.language])

  // Auto-focus editor when cell is selected
  useEffect(() => {
    if (isSelected && editorRef) {
      setTimeout(() => {
        editorRef.focus()
      }, 100)
    }
  }, [isSelected, editorRef])

  // Debounce content sync to parent to prevent focus issues
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code !== cell.content || output !== cell.output) {
        onContentChange(cell.id, code, output)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [code, output, cell.content, cell.output, cell.id, onContentChange])

  const handleRun = async () => {
    setIsRunning(true)
    const logs: string[] = []

    // Get or create persistent context for this tab
    if (!window.__notebookContexts) {
      window.__notebookContexts = {}
    }
    if (!window.__notebookContexts[tabId]) {
      window.__notebookContexts[tabId] = {}
    }
    const context = window.__notebookContexts[tabId]

    // Override console to capture output
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
      originalLog(...args)
    }
    console.error = (...args: any[]) => {
      logs.push('[ERROR] ' + args.map(a => String(a)).join(' '))
      originalError(...args)
    }
    console.warn = (...args: any[]) => {
      logs.push('[WARN] ' + args.map(a => String(a)).join(' '))
      originalWarn(...args)
    }

    try {
      // Build function with context variables as parameters
      const contextKeys = Object.keys(context)
      const contextValues = Object.values(context)

      // Create a function that executes the code with context variables and captures the result
      // Pass code as the last parameter to avoid eval string issues
      const func = new Function(...contextKeys, '__code__', `
        "use strict";
        ${contextKeys.map(k => `var ${k} = arguments[${contextKeys.indexOf(k)}];`).join('\n')}
        var __result__ = eval(__code__);
        return __result__;
      `)
      const result = func(...contextValues, code)

      // Capture any new or updated variables by re-evaluating in a wrapper
      // This allows variables to persist across cells
      try {
        const captureFunc = new Function(...contextKeys, '__code__', `
          "use strict";
          ${contextKeys.map(k => `var ${k} = arguments[${contextKeys.indexOf(k)}];`).join('\n')}
          eval(__code__);
          return {${contextKeys.map(k => `${k}: typeof ${k} !== 'undefined' ? ${k} : undefined`).join(', ')}};
        `)
        const capturedVars = captureFunc(...contextValues, code)

        // Also capture any NEW variables declared in this cell
        const allVarsFunc = new Function('__code__', `
          "use strict";
          ${contextKeys.map(k => `var ${k} = undefined;`).join('\n')}
          eval(__code__);
          const result = {};
          for (let key in this) {
            if (this.hasOwnProperty(key)) result[key] = this[key];
          }
          return result;
        `)
        const newVars = allVarsFunc.call({}, code)

        // Merge captured variables
        Object.assign(context, capturedVars, newVars)
      } catch (e) {
        // If capturing fails, that's okay - variable persistence will be limited
        console.warn('Failed to capture variables:', e)
      }

      // Format output
      let output = logs.join('\n')
      if (!output && result !== undefined) {
        output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
      }

      setOutput(output || '(no output)')
      onContentChange(cell.id, code, output || '')
      await updateCell(cell.id, { content: code, output: output || '', language })
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}`
      setOutput(errorMsg)
      onContentChange(cell.id, code, errorMsg)
      await updateCell(cell.id, { content: code, output: errorMsg, language })
    } finally {
      // Always restore console
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      setIsRunning(false)
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ''
    setCode(newCode)
    // Don't sync to parent on every keystroke to prevent focus issues
  }

  const handleAskAI = async () => {
    setIsAskingAI(true)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Explain this code and suggest improvements:\n\n${code}`,
          model: 'claude',
        }),
      })
      const data = await response.json()
      setOutput(data.response)
    } catch (error: any) {
      setOutput(`Error: ${error.message}`)
    }
    setIsAskingAI(false)
  }

  const handleDelete = async () => {
    // Optimistically update UI first
    onCellDeleted(cell.id)
    // Sync with server in background
    deleteCell(cell.id, notebookId).catch(error => {
      console.error('Failed to delete cell:', error)
      // Could add error handling/rollback here if needed
    })
  }

  const handleBlur = async () => {
    if (code !== cell.content) {
      onContentChange(cell.id, code, output)
      await updateCell(cell.id, { content: code })
    }
  }

  const handleInsertBefore = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'code', cell.order)
    // Refresh cells and auto-select the new cell
    onCellsChanged(newCell.id)
  }

  const handleInsertAfter = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'code', cell.order + 1)
    // Refresh cells and auto-select the new cell
    onCellsChanged(newCell.id)
  }

  const handleDuplicate = async () => {
    const newCell = await duplicateCell(cell.id, notebookId)
    if (newCell) {
      // Refresh cells and auto-select the duplicated cell
      onCellsChanged(newCell.id)
    }
  }

  const execNumber = cell.order + 1

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      className={`flex group hover:bg-neutral-50 dark:hover:bg-neutral-900/30 ${
        isSelected ? 'bg-neutral-50 dark:bg-neutral-900/30' : ''
      }`}
    >
      {/* Selection Bar */}
      <div className={`w-1 ${isSelected ? 'bg-blue-500' : ''}`} />

      {/* Execution Number */}
      <div className="w-12 flex-shrink-0 pt-3 pr-2 text-right">
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          [{execNumber}]
        </span>
      </div>

      {/* Cell Content */}
      <div className="flex-1 min-w-0 relative py-2">
        {/* Code Editor */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded">
          <Editor
            height={`${Math.max(code.split('\n').length * 19 + 20, 38)}px`}
            language={language}
            value={code}
            onChange={handleCodeChange}
            onBlur={handleBlur}
            onMount={(editor) => setEditorRef(editor)}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'off',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8, bottom: 8, left: 16, right: 16 },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
              },
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              glyphMargin: false,
              folding: false,
              renderLineHighlight: 'none',
              selectionHighlight: false,
              occurrencesHighlight: false,
            }}
          />
        </div>

        {/* Right-side cell actions - Only visible when selected */}
        <div className={`absolute top-3 right-2 flex flex-row gap-1 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleInsertBefore}
            title="Insert cell above"
            className="h-6 w-6 p-0"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleInsertAfter}
            title="Insert cell below"
            className="h-6 w-6 p-0"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <div
            className="h-6 w-6 p-0 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag to reorder"
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-neutral-500" />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDuplicate}
            title="Duplicate cell"
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            title="Delete cell"
            className="h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Output */}
        {output && (
          <div className="mt-2 flex">
            <div className="w-12 flex-shrink-0 pt-3 pr-2 text-right">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                [{execNumber}]
              </span>
            </div>
            <div className="flex-1 border border-neutral-200 dark:border-neutral-800 rounded p-3 bg-neutral-50 dark:bg-neutral-900/30">
              <ChartRenderer output={output} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export memoized version to prevent unnecessary re-renders
export const CodeCell = memo(CodeCellComponent)
