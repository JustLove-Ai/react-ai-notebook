'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Trash2, Edit, Check, ChevronUp, ChevronDown, Plus, Copy } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell, moveCellUp, moveCellDown } from '@/lib/actions/notebooks'

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
  onCellsChanged: () => void
  onContentChange: (cellId: string, content: string) => void
}

export function MarkdownCell({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: MarkdownCellProps) {
  const [content, setContent] = useState(cell.content)
  const [isEditing, setIsEditing] = useState(false)

  // Sync from parent when cell prop changes (e.g., tab switch)
  useEffect(() => {
    setContent(cell.content)
  }, [cell.content])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange(cell.id, newContent)
  }

  const handleSave = async () => {
    await updateCell(cell.id, { content })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteCell(cell.id, notebookId)
    onCellDeleted(cell.id)
  }

  const handleInsertBefore = async () => {
    await insertCellAt(tabId, notebookId, 'markdown', cell.order)
    onCellsChanged()
  }

  const handleInsertAfter = async () => {
    await insertCellAt(tabId, notebookId, 'markdown', cell.order + 1)
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

  return (
    <div
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
            className="min-h-[80px] font-mono text-sm border-neutral-200 dark:border-neutral-800 w-full"
            placeholder="# Write markdown here..."
          />
        ) : (
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none" onDoubleClick={() => setIsEditing(true)}>
            {content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-xl font-bold mb-2 text-black dark:text-white">{line.slice(2)}</h1>
              } else if (line.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-bold mb-2 text-black dark:text-white">{line.slice(3)}</h2>
              } else if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-semibold mb-1 text-black dark:text-white">{line.slice(4)}</h3>
              } else if (line.startsWith('- ')) {
                return <li key={i} className="ml-4 text-sm text-neutral-700 dark:text-neutral-300">{line.slice(2)}</li>
              } else if (line.trim()) {
                return <p key={i} className="mb-1 text-sm text-neutral-700 dark:text-neutral-300">{line}</p>
              }
              return <br key={i} />
            })}
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
      </div>
    </div>
  )
}
