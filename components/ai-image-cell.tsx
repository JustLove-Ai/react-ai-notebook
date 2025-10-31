'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Trash2, GripVertical, Copy, ArrowUp, ArrowDown, Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { updateCell, deleteCell, insertCellAt, duplicateCell } from '@/lib/actions/notebooks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ImageLightbox } from './image-lightbox'

interface AIImageCellProps {
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

const AI_IMAGE_MODELS = [
  { value: 'gpt-image-1', label: 'GPT Image 1' },
  { value: 'dall-e-3', label: 'DALL-E 3' },
  { value: 'dall-e-2', label: 'DALL-E 2' },
]

function AIImageCellComponent({ cell, tabId, notebookId, isSelected, onSelect, onCellDeleted, onCellsChanged, onContentChange }: AIImageCellProps) {
  const [prompt, setPrompt] = useState(cell.content)
  const [output, setOutput] = useState(cell.output || '')
  const [model, setModel] = useState(cell.language || 'gpt-image-1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

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
    setModel(cell.language || 'gpt-image-1')
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setOutput(base64)
      setPrompt(prompt || `Uploaded: ${file.name}`)
      onContentChange(cell.id, prompt || `Uploaded: ${file.name}`, base64)
      await updateCell(cell.id, { content: prompt || `Uploaded: ${file.name}`, output: base64, language: model })
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setOutput('Generating image...')

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          type: 'image',
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      // Expecting image URL or base64 data
      const imageUrl = data.imageUrl || data.url || data.image || ''

      if (!imageUrl) {
        throw new Error('No image URL returned from API')
      }

      setOutput(imageUrl)
      onContentChange(cell.id, prompt, imageUrl)
      await updateCell(cell.id, { content: prompt, output: imageUrl, language: model })
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}`
      setOutput(errorMsg)
      onContentChange(cell.id, prompt, errorMsg)
      await updateCell(cell.id, { content: prompt, output: errorMsg, language: model })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleGenerate()
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
    const newCell = await insertCellAt(tabId, notebookId, 'ai-image', cell.order)
    onCellsChanged(newCell.id)
  }

  const handleInsertAfter = async () => {
    const newCell = await insertCellAt(tabId, notebookId, 'ai-image', cell.order + 1)
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

  const isError = output.startsWith('Error:')
  const isGeneratingText = output === 'Generating image...'

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
          [{execNumber}]
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
                {AI_IMAGE_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="h-7 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Generate
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById(`image-upload-${cell.id}`)?.click()}
              disabled={isGenerating}
              className="h-7"
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
            <input
              id={`image-upload-${cell.id}`}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] font-sans text-sm border-purple-200 dark:border-purple-800 w-full px-4 py-3"
            placeholder="Describe the image you want to generate... (Shift+Enter to generate)"
            autoFocus={isSelected}
          />
        </div>

        {/* Right-side cell actions */}
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

        {/* Image Output - Smaller with lightbox */}
        {output && !isGeneratingText && (
          <div className="mt-2">
            <div className="border border-purple-200 dark:border-purple-800 rounded p-4 bg-purple-50/50 dark:bg-purple-950/20">
              {isError ? (
                <p className="text-red-600 dark:text-red-400 text-sm">{output}</p>
              ) : (
                <img
                  src={output}
                  alt={prompt}
                  className="max-w-md h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowLightbox(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `<p class="text-red-600 dark:text-red-400 text-sm">Failed to load image</p>`
                  }}
                />
              )}
            </div>
          </div>
        )}

        {isGeneratingText && (
          <div className="mt-2">
            <div className="border border-purple-200 dark:border-purple-800 rounded p-4 bg-purple-50/50 dark:bg-purple-950/20">
              <p className="text-purple-600 dark:text-purple-400 text-sm animate-pulse">{output}</p>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {showLightbox && !isError && output && (
          <ImageLightbox
            src={output}
            alt={prompt}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </div>
    </div>
  )
}

export const AIImageCell = memo(AIImageCellComponent)
