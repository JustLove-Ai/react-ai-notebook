'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Play, Trash2, Bot, ChevronUp, ChevronDown, Plus, Copy } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell, moveCellUp, moveCellDown } from '@/lib/actions/notebooks'
import { useTheme } from 'next-themes'

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
  onCellsChanged: () => void
  onContentChange: (cellId: string, content: string, output?: string) => void
}

export function CodeCell({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: CodeCellProps) {
  const [code, setCode] = useState(cell.content)
  const [output, setOutput] = useState(cell.output || '')
  const [language, setLanguage] = useState(cell.language)
  const [isRunning, setIsRunning] = useState(false)
  const [isAskingAI, setIsAskingAI] = useState(false)
  const { theme } = useTheme()

  // Sync from parent when cell prop changes (e.g., tab switch)
  useEffect(() => {
    setCode(cell.content)
    setOutput(cell.output || '')
    setLanguage(cell.language)
  }, [cell.content, cell.output, cell.language])

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      const data = await response.json()
      const result = data.error ? `Error: ${data.error}\n${data.output || ''}` : data.output
      setOutput(result)
      onContentChange(cell.id, code, result)
      await updateCell(cell.id, { content: code, output: result, language })
    } catch (error: any) {
      setOutput(`Error: ${error.message}`)
    }
    setIsRunning(false)
  }

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ''
    setCode(newCode)
    onContentChange(cell.id, newCode, output)
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
    await deleteCell(cell.id, notebookId)
    onCellDeleted(cell.id)
  }

  const handleBlur = async () => {
    if (code !== cell.content) {
      await updateCell(cell.id, { content: code })
    }
  }

  const handleInsertBefore = async () => {
    await insertCellAt(tabId, notebookId, 'code', cell.order)
    onCellsChanged()
  }

  const handleInsertAfter = async () => {
    await insertCellAt(tabId, notebookId, 'code', cell.order + 1)
    onCellsChanged()
  }

  const handleDuplicate = async () => {
    await duplicateCell(cell.id, notebookId)
    onCellsChanged()
  }

  const handleMoveUp = async () => {
    await moveCellUp(cell.id, notebookId)
    onCellsChanged()
  }

  const handleMoveDown = async () => {
    await moveCellDown(cell.id, notebookId)
    onCellsChanged()
  }

  const execNumber = cell.order + 1

  return (
    <div
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
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'off',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 },
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
            title="Insert cell before"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleInsertAfter}
            title="Insert cell after"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3 rotate-180" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleMoveUp}
            title="Move up"
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleMoveDown}
            title="Move down"
            className="h-6 w-6 p-0"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
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
          <div className="mt-2 border border-neutral-200 dark:border-neutral-800 rounded p-3 bg-neutral-50 dark:bg-neutral-900/30">
            <div className="font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
