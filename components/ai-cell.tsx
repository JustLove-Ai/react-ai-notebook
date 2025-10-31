'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, GripVertical, Copy, ArrowUp, ArrowDown, Sparkles, Loader2 } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell } from '@/lib/actions/notebooks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AICellProps {
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

const AI_MODELS = [
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

function AICellComponent({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: AICellProps) {
  const [prompt, setPrompt] = useState(cell.content)
  const [output, setOutput] = useState(cell.output || '')
  const [model, setModel] = useState(cell.language || 'claude-3.5-sonnet')
  const [isRunning, setIsRunning] = useState(false)

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
    setPrompt(cell.content)
    setOutput(cell.output || '')
    setModel(cell.language || 'claude-3.5-sonnet')
  }, [cell.content, cell.output, cell.language])

  // Debounce content sync to parent to prevent focus issues
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
    // Shift+Enter to run (like Jupyter)
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
    const newCell = await insertCellAt(tabId, notebookId, 'ai', cell.order)
    onCellsChanged(newCell.id)
  }

  const handleInsertAfter = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'ai', cell.order + 1)
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
      className={`flex group hover:bg-purple-50 dark:hover:bg-purple-950/20 ${
        isSelected ? 'bg-purple-50 dark:bg-purple-950/20' : ''
      }`}
    >
      {/* Selection Bar */}
      <div className={`w-1 ${isSelected ? 'bg-purple-500' : ''}`} />

      {/* Execution Number */}
      <div className="w-12 flex-shrink-0 pt-3 pr-2 text-right">
        <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
          AI[{execNumber}]
        </span>
      </div>

      {/* Cell Content */}
      <div className="flex-1 min-w-0 relative py-2">
        {/* Prompt Input & Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-4">
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger className="w-48 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning || !prompt.trim()}
              className="h-7 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Run AI
                </>
              )}
            </Button>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] font-sans text-sm border-purple-200 dark:border-purple-800 w-full px-4 py-3"
            placeholder="Ask the AI anything... (Shift+Enter to run)"
            autoFocus={isSelected}
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
          <div className="mt-2 flex">
            <div className="w-12 flex-shrink-0 pt-3 pr-2 text-right">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                AI[{execNumber}]
              </span>
            </div>
            <div className="flex-1 border border-purple-200 dark:border-purple-800 rounded p-4 bg-purple-50/50 dark:bg-purple-950/20">
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {output}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export memoized version to prevent unnecessary re-renders
export const AICell = memo(AICellComponent)
