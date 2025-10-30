'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { ThemeToggle } from './theme-toggle'
import { Plus, Search, Code2 } from 'lucide-react'
import { createNotebook } from '@/lib/actions/notebooks'
import { useRouter } from 'next/navigation'

interface Notebook {
  id: string
  title: string
  description: string | null
  tabs: any[]
  createdAt: Date
  updatedAt: Date
}

interface NotebooksTableProps {
  notebooks: Notebook[]
}

export function NotebooksTable({ notebooks }: NotebooksTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const filteredNotebooks = notebooks.filter((notebook) =>
    notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (notebook.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateNotebook = async () => {
    setIsCreating(true)
    try {
      const notebook = await createNotebook('Untitled Notebook')
      router.push(`/notebooks/${notebook.id}`)
    } catch (error) {
      console.error('Failed to create notebook:', error)
    }
    setIsCreating(false)
  }

  return (
    <div className="h-full bg-white dark:bg-black">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Top Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
          <Button
            onClick={handleCreateNotebook}
            disabled={isCreating}
            className="ml-4 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Notebook
          </Button>
        </div>

        {/* Table */}
        {filteredNotebooks.length > 0 ? (
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Tabs
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredNotebooks.map((notebook) => (
                  <tr
                    key={notebook.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/notebooks/${notebook.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-black dark:text-white">
                        {notebook.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md truncate">
                        {notebook.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {notebook.tabs.length}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(notebook.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(notebook.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <Code2 className="h-12 w-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">
              {searchQuery ? 'No notebooks found' : 'No notebooks yet'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first notebook to get started'}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateNotebook}
                disabled={isCreating}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Notebook
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
