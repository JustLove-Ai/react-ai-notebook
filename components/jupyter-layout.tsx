'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown, File, Folder, Plus, X, Edit2, Trash2 } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { createNotebook, updateNotebook, createTab, updateTab, deleteNotebook, deleteTab } from '@/lib/actions/notebooks'
import { Button } from './ui/button'
import { NotebookEditor } from './notebook-editor'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'

interface NotebookTab {
  id: string
  title: string
  order: number
  cells: any[]
}

interface Notebook {
  id: string
  title: string
  tabs: NotebookTab[]
}

interface JupyterLayoutProps {
  notebooks: Notebook[]
  currentNotebook?: Notebook
  children?: React.ReactNode
}

export function JupyterLayout({ notebooks: initialNotebooks, currentNotebook, children }: JupyterLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notebooks, setNotebooks] = useState(initialNotebooks)
  const [notebookTabs, setNotebookTabs] = useState<NotebookTab[]>(currentNotebook?.tabs || [])
  const [activeTabId, setActiveTabId] = useState(currentNotebook?.tabs[0]?.id)
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAction, setDeleteAction] = useState<{ type: 'notebook' | 'tab', id: string } | null>(null)
  const router = useRouter()

  const handleCreateTab = async () => {
    if (!currentNotebook) return
    setIsCreating(true)
    try {
      // Await server to create tab with real ID
      const newTab = await createTab(currentNotebook.id, 'Untitled')
      // Add real tab to state
      setNotebookTabs([...notebookTabs, newTab as any])
      setActiveTabId(newTab.id)
    } catch (error) {
      console.error('Failed to create tab:', error)
    }
    setIsCreating(false)
  }

  const handleTabClick = (tabId: string) => {
    if (!currentNotebook) return
    setActiveTabId(tabId)
    // Pure client-side state update - no server requests
  }

  const openNotebook = (notebook: Notebook) => {
    router.push(`/notebooks/${notebook.id}`)
  }

  const handleCreateNotebook = async () => {
    setIsCreating(true)
    try {
      const notebook = await createNotebook('Untitled Notebook')
      // Add to notebooks list
      setNotebooks([notebook as any, ...notebooks])
      router.push(`/notebooks/${notebook.id}`)
    } catch (error) {
      console.error('Failed to create notebook:', error)
    }
    setIsCreating(false)
  }

  const startEditingNotebook = (notebookId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingNotebookId(notebookId)
    setEditingTitle(currentTitle)
  }

  const startEditingTab = (tabId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTabId(tabId)
    setEditingTitle(currentTitle)
  }

  const saveNotebookTitle = async (notebookId: string) => {
    if (editingTitle.trim()) {
      await updateNotebook(notebookId, { title: editingTitle.trim() })
      // Update notebooks list
      const updatedNotebooks = notebooks.map(n =>
        n.id === notebookId ? { ...n, title: editingTitle.trim() } : n
      )
      setNotebooks(updatedNotebooks)
    }
    setEditingNotebookId(null)
    setEditingTitle('')
  }

  const saveTabTitle = async (tabId: string) => {
    if (!currentNotebook || !editingTitle.trim()) return
    await updateTab(tabId, currentNotebook.id, { title: editingTitle.trim() })
    // Update tabs list
    const updatedTabs = notebookTabs.map(t =>
      t.id === tabId ? { ...t, title: editingTitle.trim() } : t
    )
    setNotebookTabs(updatedTabs)
    setEditingTabId(null)
    setEditingTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string, isTab: boolean = false) => {
    if (e.key === 'Enter') {
      if (isTab) {
        saveTabTitle(id)
      } else {
        saveNotebookTitle(id)
      }
    } else if (e.key === 'Escape') {
      setEditingNotebookId(null)
      setEditingTabId(null)
      setEditingTitle('')
    }
  }

  const handleDeleteNotebook = (notebookId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteAction({ type: 'notebook', id: notebookId })
    setDeleteDialogOpen(true)
  }

  const handleDeleteTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentNotebook) return
    if (notebookTabs.length === 1) {
      return // Silently ignore - we'll show better UI feedback later
    }
    setDeleteAction({ type: 'tab', id: tabId })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteAction) return

    if (deleteAction.type === 'notebook') {
      await deleteNotebook(deleteAction.id)
      setNotebooks(notebooks.filter(n => n.id !== deleteAction.id))
      if (currentNotebook?.id === deleteAction.id) {
        router.push('/notebooks')
      }
    } else if (deleteAction.type === 'tab') {
      if (!currentNotebook) return
      // Optimistically update state first
      const updatedTabs = notebookTabs.filter(t => t.id !== deleteAction.id)
      setNotebookTabs(updatedTabs)
      if (activeTabId === deleteAction.id) {
        setActiveTabId(updatedTabs[0]?.id)
      }
      // Then sync with server
      deleteTab(deleteAction.id, currentNotebook.id)
    }

    setDeleteDialogOpen(false)
    setDeleteAction(null)
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={deleteAction?.type === 'notebook' ? 'Delete Notebook' : 'Delete Tab'}
        description={
          deleteAction?.type === 'notebook'
            ? 'Are you sure you want to delete this notebook? All tabs and cells will be permanently deleted.'
            : 'Are you sure you want to delete this tab? All cells will be permanently deleted.'
        }
      />
      {/* Top Bar */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/jupyter-logo.svg" alt="Logo" className="h-6 w-6" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }} />
          <span className="text-sm font-medium text-black dark:text-white">Vibe Codebook</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">Files</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleCreateNotebook}
                disabled={isCreating}
                size="sm"
                className="w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Notebook
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="mb-2">
                <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 px-2 py-1">
                  <ChevronDown className="h-4 w-4" />
                  <Folder className="h-4 w-4" />
                  <span>notebooks</span>
                </div>
              </div>

              <div className="ml-4 space-y-1">
                {notebooks.map((notebook) => (
                  <div
                    key={notebook.id}
                    className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 group ${
                      currentNotebook?.id === notebook.id ? 'bg-neutral-100 dark:bg-neutral-900' : ''
                    }`}
                  >
                    <File className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    {editingNotebookId === notebook.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => saveNotebookTitle(notebook.id)}
                        onKeyDown={(e) => handleKeyDown(e, notebook.id)}
                        autoFocus
                        className="flex-1 bg-white dark:bg-black border border-blue-500 rounded px-1 text-neutral-700 dark:text-neutral-300 text-sm focus:outline-none"
                      />
                    ) : (
                      <>
                        <span
                          onClick={() => openNotebook(notebook)}
                          onDoubleClick={(e) => startEditingNotebook(notebook.id, notebook.title, e)}
                          className="flex-1 text-neutral-700 dark:text-neutral-300 truncate cursor-pointer"
                        >
                          {notebook.title}.ipynb
                        </span>
                        <button
                          onClick={(e) => startEditingNotebook(notebook.id, notebook.title, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
                        >
                          <Edit2 className="h-3 w-3 text-neutral-500" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-neutral-500" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {currentNotebook && (
            <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center bg-neutral-50 dark:bg-neutral-900/30">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-3 py-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {notebookTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-neutral-200 dark:border-neutral-800 group ${
                    activeTabId === tab.id
                      ? 'bg-white dark:bg-black text-black dark:text-white'
                      : 'bg-neutral-50 dark:bg-neutral-900/30 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <File className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => saveTabTitle(tab.id)}
                      onKeyDown={(e) => handleKeyDown(e, tab.id, true)}
                      autoFocus
                      className="flex-1 max-w-[120px] bg-white dark:bg-black border border-blue-500 rounded px-1 text-sm focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span
                        onClick={() => handleTabClick(tab.id)}
                        onDoubleClick={(e) => startEditingTab(tab.id, tab.title, e)}
                        className="max-w-[120px] truncate cursor-pointer"
                      >
                        {tab.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTab(tab.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
                      >
                        <X className="h-3 w-3 text-neutral-500" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              <button
                onClick={handleCreateTab}
                disabled={isCreating}
                className="px-3 py-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                title="Add new tab"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {children ? (
              children
            ) : currentNotebook ? (
              <NotebookEditor
                notebook={currentNotebook}
                activeTabId={activeTabId}
                onTabsChange={setNotebookTabs}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
