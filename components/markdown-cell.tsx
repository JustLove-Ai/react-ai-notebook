'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Trash2, Edit, Check, GripVertical, Copy, ArrowUp, ArrowDown } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell } from '@/lib/actions/notebooks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface MarkdownCellProps {
  cell: {
    id: string
    content: string
    order: number
  }
  tabId: string
  notebookId: string
  isSelected: boolean
  onSelect: () => void
  onCellDeleted: (cellId: string) => void
  onCellsChanged: (selectCellId?: string) => void
  onContentChange: (cellId: string, content: string) => void
}

function MarkdownCellComponent({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: MarkdownCellProps) {
  const [content, setContent] = useState(cell.content)
  const [isEditing, setIsEditing] = useState(false)

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
    setContent(cell.content)
  }, [cell.content])

  // Debounce content sync to parent to prevent focus issues
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== cell.content) {
        onContentChange(cell.id, content)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [content, cell.content, cell.id, onContentChange])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    // Don't sync to parent on every keystroke to prevent focus issues
  }

  const handleSave = async () => {
    onContentChange(cell.id, content)
    await updateCell(cell.id, { content })
    setIsEditing(false)
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

  const handleInsertBefore = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'markdown', cell.order)
    // Refresh cells and auto-select the new cell
    onCellsChanged(newCell.id)
  }

  const handleInsertAfter = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'markdown', cell.order + 1)
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

      {/* Empty space for execution number alignment */}
      <div className="w-12 flex-shrink-0" />

      {/* Cell Content */}
      <div className="flex-1 min-w-0 py-2 relative">
        {/* Content */}
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[80px] font-mono text-sm border-neutral-200 dark:border-neutral-800 w-full px-4 py-3"
            placeholder="# Write markdown here..."
            autoFocus
          />
        ) : (
          <div
            className="prose prose-sm prose-neutral dark:prose-invert max-w-none min-h-[40px] cursor-text"
            onDoubleClick={() => setIsEditing(true)}
          >
            {!content || content.trim() === '' ? (
              <p className="text-neutral-400 dark:text-neutral-600 italic text-sm">
                Double-click to edit markdown...
              </p>
            ) : (
              content.split('\n').map((line, i) => {
                const trimmedLine = line.trim()
                // Match headers with or without space after #
                if (trimmedLine.match(/^###\s+/)) {
                  return <h3 key={i} className="text-base font-semibold mb-1 mt-2 text-neutral-900 dark:text-neutral-100">{trimmedLine.replace(/^###\s+/, '')}</h3>
                } else if (trimmedLine.match(/^##\s+/)) {
                  return <h2 key={i} className="text-lg font-bold mb-2 mt-3 text-neutral-900 dark:text-neutral-100">{trimmedLine.replace(/^##\s+/, '')}</h2>
                } else if (trimmedLine.match(/^#\s+/)) {
                  return <h1 key={i} className="text-2xl font-bold mb-3 mt-4 text-neutral-900 dark:text-neutral-100">{trimmedLine.replace(/^#\s+/, '')}</h1>
                } else if (trimmedLine.match(/^-\s+/) || trimmedLine.match(/^\*\s+/)) {
                  return <li key={i} className="ml-4 text-sm text-neutral-700 dark:text-neutral-300 list-disc">{trimmedLine.replace(/^[-*]\s+/, '')}</li>
                } else if (trimmedLine.match(/^\d+\.\s+/)) {
                  return <li key={i} className="ml-4 text-sm text-neutral-700 dark:text-neutral-300 list-decimal">{trimmedLine.replace(/^\d+\.\s+/, '')}</li>
                } else if (trimmedLine.startsWith('```')) {
                  return <code key={i} className="block bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-xs font-mono">{trimmedLine.replace(/```.*/, '')}</code>
                } else if (trimmedLine) {
                  // Bold text **text** or __text__
                  let processedLine = line
                  processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  processedLine = processedLine.replace(/__(.*?)__/g, '<strong>$1</strong>')
                  // Italic text *text* or _text_
                  processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
                  processedLine = processedLine.replace(/_(.*?)_/g, '<em>$1</em>')
                  // Inline code `code`
                  processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-xs font-mono">$1</code>')

                  return <p key={i} className="mb-2 text-sm text-neutral-700 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: processedLine }} />
                }
                return <br key={i} />
              })
            )}
          </div>
        )}

        {/* Right-side cell actions - Only visible when selected */}
        <div className={`absolute top-3 right-2 flex flex-row gap-1 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
          {isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              title="Save"
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
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
      </div>
    </div>
  )
}

// Export memoized version to prevent unnecessary re-renders
export const MarkdownCell = memo(MarkdownCellComponent)
