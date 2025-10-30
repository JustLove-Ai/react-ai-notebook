'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { CodeCell } from './code-cell'
import { MarkdownCell } from './markdown-cell'
import { Plus, Play, Square, RotateCw, ChevronUp, ChevronDown, Save } from 'lucide-react'
import { createCell } from '@/lib/actions/notebooks'

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

  // Update tabCells when notebook data changes (new tabs added)
  useEffect(() => {
    setTabCells(prev => {
      const updated = { ...prev }
      notebook.tabs.forEach(tab => {
        if (!updated[tab.id]) {
          updated[tab.id] = tab.cells
        }
      })
      return updated
    })
  }, [notebook.tabs])

  // Update selected cell when active tab changes
  useEffect(() => {
    if (activeTab) {
      const cellsForTab = tabCells[activeTab.id] || activeTab.cells
      setSelectedCellId(cellsForTab[0]?.id || null)
    }
  }, [activeTabId, activeTab, tabCells])

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
    // Update cells for the current tab only
    setTabCells(prev => ({
      ...prev,
      [currentTab.id]: (prev[currentTab.id] || []).filter(c => c.id !== cellId)
    }))
    if (selectedCellId === cellId) {
      const remainingCells = (tabCells[currentTab.id] || []).filter(c => c.id !== cellId)
      setSelectedCellId(remainingCells[0]?.id || null)
    }
  }

  const refreshCells = () => {
    if (!currentTab) return
    // Refresh cells for current tab from server
    const tab = notebook.tabs.find(t => t.id === currentTab.id)
    if (tab) {
      setTabCells(prev => ({
        ...prev,
        [currentTab.id]: tab.cells
      }))
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
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Plus className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-neutral-200 dark:border-neutral-800 mx-1" />
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Play className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
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
