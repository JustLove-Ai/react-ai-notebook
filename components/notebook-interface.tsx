'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { CodeCell } from './code-cell'
import { MarkdownCell } from './markdown-cell'
import { Plus, Code2, FileText } from 'lucide-react'
import { createCell } from '@/lib/actions/notebooks'
import { motion, AnimatePresence } from 'framer-motion'

interface Notebook {
  id: string
  title: string
  description: string | null
  cells: Array<{
    id: string
    type: string
    content: string
    output: string | null
    language: string
    order: number
  }>
}

export function NotebookInterface({ notebook }: { notebook: Notebook }) {
  const [cells, setCells] = useState(notebook.cells)

  const handleAddCell = async (type: 'code' | 'markdown') => {
    const newOrder = cells.length
    const newCell = await createCell(notebook.id, type, newOrder)
    setCells([...cells, newCell as any])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {notebook.title}
            </h2>
            {notebook.description && (
              <p className="text-slate-600 dark:text-slate-300">
                {notebook.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAddCell('code')}
              variant="outline"
              size="sm"
            >
              <Code2 className="mr-2 h-4 w-4" />
              Add Code
            </Button>
            <Button
              onClick={() => handleAddCell('markdown')}
              variant="outline"
              size="sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              Add Text
            </Button>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="popLayout">
        {cells.map((cell, index) => (
          <motion.div
            key={cell.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {cell.type === 'code' ? (
              <CodeCell cell={cell} notebookId={notebook.id} />
            ) : (
              <MarkdownCell cell={cell} notebookId={notebook.id} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {cells.length === 0 && (
        <Card className="p-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm text-center">
          <Plus className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
            Empty Notebook
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Add your first cell to start coding or writing
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => handleAddCell('code')}
              className="bg-gradient-to-r from-amber-600 to-rose-600 text-white"
            >
              <Code2 className="mr-2 h-4 w-4" />
              Add Code Cell
            </Button>
            <Button onClick={() => handleAddCell('markdown')} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Add Text Cell
            </Button>
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          onClick={() => handleAddCell('code')}
          variant="outline"
          size="lg"
          className="rounded-full"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Cell
        </Button>
      </div>
    </div>
  )
}
