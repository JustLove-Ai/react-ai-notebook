'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, GripVertical, Copy, ArrowUp, ArrowDown, Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell } from '@/lib/actions/notebooks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AITextCellProps {
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

const AI_TEXT_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
]

function AITextCellComponent({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: AITextCellProps) {
  const [prompt, setPrompt] = useState(cell.content)
  const [output, setOutput] = useState(cell.output || '')
  const [model, setModel] = useState(cell.language || 'gpt-4o')
  const [isRunning, setIsRunning] = useState(false)
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false)

  // Setup drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cell.id })

  // Sync from parent when cell prop changes
  useEffect(() => {
    setPrompt(cell.content)
    setOutput(cell.output || '')
    setModel(cell.language || 'gpt-4o')
  }, [cell.content, cell.output, cell.language])

  // Debounce content sync to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (prompt !== cell.content || output !== cell.output || model !== cell.language) {
        onContentChange(cell.id, prompt, output)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [prompt, output, model, cell.content, cell.output, cell.language, cell.id, onContentChange])

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
  }

  const handleModelChange = async (newModel: string) => {
    setModel(newModel)
    onContentChange(cell.id, prompt, output)
    await updateCell(cell.id, { content: prompt, language: newModel })
  }

  const handleRun = async () => {
    if (!prompt.trim()) return

    setIsRunning(true)
    setOutput('Thinking...')

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          type: 'text',
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      const aiResponse = data.response || data.content || 'No response from AI'

      setOutput(aiResponse)
      onContentChange(cell.id, prompt, aiResponse)
      await updateCell(cell.id, { content: prompt, output: aiResponse, language: model })
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}`
      setOutput(errorMsg)
      onContentChange(cell.id, prompt, errorMsg)
      await updateCell(cell.id, { content: prompt, output: errorMsg, language: model })
    } finally {
      setIsRunning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  const handleBlur = async () => {
    if (prompt !== cell.content || model !== cell.language) {
      onContentChange(cell.id, prompt, output)
      await updateCell(cell.id, { content: prompt, language: model })
    }
  }

  const handleDelete = async () => {
    onCellDeleted(cell.id)
    deleteCell(cell.id, notebookId).catch(error => {
      console.error('Failed to delete cell:', error)
    })
  }

  const handleInsertBefore = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'ai-text', cell.order)
    onCellsChanged(newCell.id)
  }

  const handleInsertAfter = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'ai-text', cell.order + 1)
    onCellsChanged(newCell.id)
  }

  const handleDuplicate = async () => {
    const newCell = await duplicateCell(cell.id, notebookId)
    if (newCell) {
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
      className={`flex group hover:bg-blue-50 dark:hover:bg-blue-950/20 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''
      }`}
    >
      {/* Selection Bar */}
      <div className={`w-1 ${isSelected ? 'bg-blue-500' : ''}`} />

      {/* Execution Number */}
      <div className="w-12 flex-shrink-0 pt-3 pr-2 text-right">
        <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
          [{execNumber}]
        </span>
      </div>

      {/* Cell Content */}
      <div className="flex-1 min-w-0 relative py-2">
        {/* Prompt Input & Model Selection - Single Line */}
        <div className="flex items-center gap-2 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger className="w-40 h-7 text-xs border-none shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_TEXT_MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRun}
            disabled={isRunning || !prompt.trim()}
            className="h-7 w-7 p-0"
            title="Run (Shift+Enter)"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
          </Button>
          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm font-sans"
            placeholder="Ask the AI anything... (Shift+Enter to run)"
            autoFocus={isSelected}
          />
        </div>

        {/* Cell actions */}
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
            className="h-6 w-6 p-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-neutral-400" />
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

        {/* AI Output */}
        {output && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                className="h-5 w-5 p-0"
                title={isOutputCollapsed ? "Expand output" : "Collapse output"}
              >
                {isOutputCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              <span className="text-xs text-blue-600 dark:text-blue-400">Output</span>
            </div>
            {!isOutputCollapsed && (
              <div className="border border-blue-200 dark:border-blue-800 rounded p-4 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {output}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const AITextCell = memo(AITextCellComponent)
