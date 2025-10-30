'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { CodeCell } from './code-cell'
import { MarkdownCell } from './markdown-cell'
import { Plus, Play, Square, RotateCw, ChevronUp, ChevronDown, Save } from 'lucide-react'
import { createCell, updateCell } from '@/lib/actions/notebooks'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface NotebookTab {
  id: string
  title: string
  order: number
  cells: Array<{
    id: string
    type: string
    content: string
    output: string | null
    language: string
    order: number
  }>
}

interface Notebook {
  id: string
  title: string
  description: string | null
  tabs: NotebookTab[]
}

export function NotebookEditor({
  notebook,
  activeTabId,
  onTabsChange
}: {
  notebook: Notebook
  activeTabId?: string
  onTabsChange?: (tabs: NotebookTab[]) => void
}) {
  const router = useRouter()

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Find the active tab or default to first tab
  const activeTab = notebook.tabs.find(t => t.id === activeTabId) || notebook.tabs[0]

  // Store cells for each tab separately
  const [tabCells, setTabCells] = useState<Record<string, typeof notebook.tabs[0]['cells']>>(() => {
    const initial: Record<string, typeof notebook.tabs[0]['cells']> = {}
    notebook.tabs.forEach(tab => {
      initial[tab.id] = tab.cells
    })
    return initial
  })

  const [selectedCellId, setSelectedCellId] = useState<string | null>(activeTab?.cells[0]?.id || null)

  // Update tabCells when notebook data changes (tabs added/cells reordered/etc)
  useEffect(() => {
    setTabCells(prev => {
      const updated: Record<string, typeof notebook.tabs[0]['cells']> = {}
      notebook.tabs.forEach(tab => {
        // Always use the latest cells from server, but preserve local edits
        updated[tab.id] = tab.cells
      })
      return updated
    })
  }, [notebook.tabs])

  // Update selected cell when active tab changes (but not when cells update)
  useEffect(() => {
    if (activeTab) {
      const cellsForTab = tabCells[activeTab.id] || activeTab.cells
      // Only set selected cell if there isn't one already, or if tab changed
      if (!selectedCellId || !cellsForTab.find(c => c.id === selectedCellId)) {
        setSelectedCellId(cellsForTab[0]?.id || null)
      }
    }
  }, [activeTabId, activeTab])  // Removed tabCells from dependencies!

  const currentTab = activeTab
  const cells = tabCells[activeTab?.id || ''] || []

  const handleAddCell = async (type: 'code' | 'markdown') => {
    if (!currentTab) return
    const newOrder = cells.length
    const newCell = await createCell(currentTab.id, notebook.id, type, newOrder)
    // Update cells for the current tab only
    setTabCells(prev => ({
      ...prev,
      [currentTab.id]: [...(prev[currentTab.id] || []), newCell as any]
    }))
    setSelectedCellId(newCell.id)
  }

  const handleCellContentChange = (cellId: string, content: string, output?: string) => {
    if (!currentTab) return
    // Update the cell content in state immediately
    setTabCells(prev => ({
      ...prev,
      [currentTab.id]: (prev[currentTab.id] || []).map(c =>
        c.id === cellId ? { ...c, content, output: output ?? c.output } : c
      )
    }))
  }

  const handleCellDeleted = (cellId: string) => {
    if (!currentTab) return
    // Optimistically update cells
    const updatedCells = (tabCells[currentTab.id] || [])
      .filter(c => c.id !== cellId)
      .map((c, idx) => ({ ...c, order: idx }))

    setTabCells(prev => ({
      ...prev,
      [currentTab.id]: updatedCells
    }))

    if (selectedCellId === cellId) {
      setSelectedCellId(updatedCells[0]?.id || null)
    }
  }

  const refreshCells = (selectCellId?: string) => {
    if (!currentTab) return
    // Refresh the page data from server to get latest cell order
    router.refresh()
    // If a cell ID is provided, select it after refresh
    if (selectCellId) {
      setTimeout(() => setSelectedCellId(selectCellId), 100)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !currentTab || active.id === over.id) return

    const oldIndex = cells.findIndex(c => c.id === active.id)
    const newIndex = cells.findIndex(c => c.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistically update UI
    const reorderedCells = arrayMove(cells, oldIndex, newIndex).map((cell, idx) => ({
      ...cell,
      order: idx
    }))

    setTabCells(prev => ({
      ...prev,
      [currentTab.id]: reorderedCells
    }))

    // Sync to server in background
    try {
      // Update all affected cells' order
      await Promise.all(
        reorderedCells.map(cell => updateCell(cell.id, { order: cell.order }))
      )
      // Refresh to ensure consistency
      router.refresh()
    } catch (error) {
      console.error('Failed to reorder cells:', error)
      // Revert on error
      router.refresh()
    }
  }

  const handleRunSelectedCell = async () => {
    if (!currentTab || !selectedCellId) return

    const selectedCell = cells.find(c => c.id === selectedCellId)
    if (!selectedCell || selectedCell.type !== 'code') return

    const logs: string[] = []

    // Get or create persistent context for this tab
    if (!(window as any).__notebookContexts) {
      (window as any).__notebookContexts = {}
    }
    if (!(window as any).__notebookContexts[currentTab.id]) {
      (window as any).__notebookContexts[currentTab.id] = {}
    }
    const context = (window as any).__notebookContexts[currentTab.id]

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
      const func = new Function(...contextKeys, '__code__', `
        "use strict";
        ${contextKeys.map(k => `var ${k} = arguments[${contextKeys.indexOf(k)}];`).join('\n')}
        var __result__ = eval(__code__);
        return __result__;
      `)
      const result = func(...contextValues, selectedCell.content)

      // Capture any new or updated variables by re-evaluating in a wrapper
      try {
        const captureFunc = new Function(...contextKeys, '__code__', `
          "use strict";
          ${contextKeys.map(k => `var ${k} = arguments[${contextKeys.indexOf(k)}];`).join('\n')}
          eval(__code__);
          return {${contextKeys.map(k => `${k}: typeof ${k} !== 'undefined' ? ${k} : undefined`).join(', ')}};
        `)
        const capturedVars = captureFunc(...contextValues, selectedCell.content)

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
        const newVars = allVarsFunc.call({}, selectedCell.content)

        // Merge captured variables
        Object.assign(context, capturedVars, newVars)
      } catch (e) {
        // If capturing fails, that's okay
        console.warn('Failed to capture variables:', e)
      }

      // Format output
      let output = logs.join('\n')
      if (!output && result !== undefined) {
        output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
      }

      // Update the cell with output
      handleCellContentChange(selectedCell.id, selectedCell.content, output || '')
      await updateCell(selectedCell.id, { content: selectedCell.content, output: output || '' })
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}`
      handleCellContentChange(selectedCell.id, selectedCell.content, errorMsg)
      await updateCell(selectedCell.id, { content: selectedCell.content, output: errorMsg })
    } finally {
      // Always restore console
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }

  // Show loading state if no tab is available
  if (!currentTab) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-neutral-500">Loading notebook...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Jupyter Toolbar */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2" title="Add cell below">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" title="Add cell above">
            <Plus className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-neutral-200 dark:border-neutral-800 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleRunSelectedCell}
            title="Run selected cell"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" title="Stop">
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" title="Restart kernel">
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-neutral-200 dark:border-neutral-800 mx-1" />
          <Select defaultValue="code">
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notebook Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-8">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cells.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {cells.map((cell) => (
                <div key={cell.id}>
                  {cell.type === 'code' ? (
                    <CodeCell
                      cell={cell}
                      tabId={currentTab?.id || ''}
                      notebookId={notebook.id}
                      isSelected={selectedCellId === cell.id}
                      onSelect={() => setSelectedCellId(cell.id)}
                      onCellDeleted={handleCellDeleted}
                      onCellsChanged={refreshCells}
                      onContentChange={handleCellContentChange}
                    />
                  ) : (
                    <MarkdownCell
                      cell={cell}
                      tabId={currentTab?.id || ''}
                      notebookId={notebook.id}
                      isSelected={selectedCellId === cell.id}
                      onSelect={() => setSelectedCellId(cell.id)}
                      onCellDeleted={handleCellDeleted}
                      onCellsChanged={refreshCells}
                      onContentChange={handleCellContentChange}
                    />
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {/* Click to add cell */}
          <div
            onClick={() => handleAddCell('code')}
            className="flex hover:bg-neutral-50 dark:hover:bg-neutral-900/30 cursor-pointer py-8"
          >
            <div className="w-1" />
            <div className="w-20" />
            <div className="flex-1 text-center text-neutral-400 dark:text-neutral-600 text-sm">
              Click to add a cell
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
