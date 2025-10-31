'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createNotebook(title: string, description?: string) {
  const notebook = await prisma.notebook.create({
    data: {
      title,
      description,
      tabs: {
        create: [
          {
            title: 'Untitled',
            order: 0,
            cells: {
              create: [
                {
                  type: 'code',
                  content: '',
                  language: 'javascript',
                  order: 0
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      tabs: {
        include: {
          cells: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  })
  revalidatePath('/notebooks')
  return notebook
}

export async function getNotebooks() {
  return await prisma.notebook.findMany({
    include: {
      tabs: {
        include: {
          cells: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getNotebook(id: string) {
  const notebook = await prisma.notebook.findUnique({
    where: { id },
    include: {
      tabs: {
        include: {
          cells: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  // Migration: If notebook has no tabs, create a default tab
  if (notebook && notebook.tabs.length === 0) {
    await prisma.notebookTab.create({
      data: {
        notebookId: id,
        title: 'Untitled',
        order: 0,
        cells: {
          create: [
            {
              type: 'code',
              content: '',
              language: 'javascript',
              order: 0
            }
          ]
        }
      }
    })

    // Re-fetch notebook with the new tab
    return await prisma.notebook.findUnique({
      where: { id },
      include: {
        tabs: {
          include: {
            cells: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  return notebook
}

export async function updateNotebook(id: string, data: { title?: string; description?: string }) {
  const notebook = await prisma.notebook.update({
    where: { id },
    data
  })
  revalidatePath(`/notebooks/${id}`)
  return notebook
}

export async function deleteNotebook(id: string) {
  await prisma.notebook.delete({
    where: { id }
  })
  revalidatePath('/notebooks')
}

// Tab management
export async function createTab(notebookId: string, title: string = 'Untitled') {
  const tabs = await prisma.notebookTab.findMany({
    where: { notebookId }
  })

  const tab = await prisma.notebookTab.create({
    data: {
      notebookId,
      title,
      order: tabs.length,
      cells: {
        create: [
          {
            type: 'code',
            content: '',
            language: 'javascript',
            order: 0
          }
        ]
      }
    },
    include: {
      cells: {
        orderBy: { order: 'asc' }
      }
    }
  })
  revalidatePath(`/notebooks/${notebookId}`)
  return tab
}

export async function updateTab(id: string, notebookId: string, data: { title?: string }) {
  const tab = await prisma.notebookTab.update({
    where: { id },
    data
  })
  revalidatePath(`/notebooks/${notebookId}`)
  return tab
}

export async function deleteTab(id: string, notebookId: string) {
  await prisma.notebookTab.delete({
    where: { id }
  })
  revalidatePath(`/notebooks/${notebookId}`)
}

export async function createCell(tabId: string, notebookId: string, type: 'code' | 'markdown', order: number) {
  const cell = await prisma.notebookCell.create({
    data: {
      tabId,
      type,
      content: '',
      language: type === 'code' ? 'javascript' : 'markdown',
      order
    }
  })
  // Don't revalidate here - parent does optimistic update
  // revalidatePath causes refresh that wipes debounced content
  return cell
}

export async function updateCell(id: string, data: { content?: string; output?: string; language?: string }) {
  return await prisma.notebookCell.update({
    where: { id },
    data
  })
}

export async function changeCellType(id: string, type: 'code' | 'markdown') {
  return await prisma.notebookCell.update({
    where: { id },
    data: {
      type,
      language: type === 'code' ? 'javascript' : 'markdown',
      output: type === 'markdown' ? null : undefined // Clear output when converting to markdown
    }
  })
}

export async function deleteCell(id: string, notebookId: string) {
  await prisma.notebookCell.delete({
    where: { id }
  })
  revalidatePath(`/notebooks/${notebookId}`)
}

export async function reorderCells(cellUpdates: { id: string; order: number }[], notebookId: string) {
  await Promise.all(
    cellUpdates.map(({ id, order }) =>
      prisma.notebookCell.update({
        where: { id },
        data: { order }
      })
    )
  )
  revalidatePath(`/notebooks/${notebookId}`)
}

export async function duplicateCell(cellId: string, notebookId: string) {
  const cell = await prisma.notebookCell.findUnique({
    where: { id: cellId }
  })

  if (!cell) return null

  // Get cells with order greater than current cell in same tab
  const cellsToUpdate = await prisma.notebookCell.findMany({
    where: {
      tabId: cell.tabId,
      order: { gt: cell.order }
    }
  })

  // Shift orders down
  await Promise.all(
    cellsToUpdate.map(c =>
      prisma.notebookCell.update({
        where: { id: c.id },
        data: { order: c.order + 1 }
      })
    )
  )

  // Create duplicate
  const newCell = await prisma.notebookCell.create({
    data: {
      tabId: cell.tabId,
      type: cell.type,
      content: cell.content,
      language: cell.language,
      order: cell.order + 1
    }
  })

  // Don't revalidate here - component handles refresh via router.refresh()
  // revalidatePath causes double refresh that wipes debounced content
  return newCell
}

export async function insertCellAt(tabId: string, notebookId: string, type: 'code' | 'markdown', order: number) {
  // Get cells with order >= new order
  const cellsToUpdate = await prisma.notebookCell.findMany({
    where: {
      tabId,
      order: { gte: order }
    }
  })

  // Shift orders down
  await Promise.all(
    cellsToUpdate.map(c =>
      prisma.notebookCell.update({
        where: { id: c.id },
        data: { order: c.order + 1 }
      })
    )
  )

  // Create new cell
  const cell = await prisma.notebookCell.create({
    data: {
      tabId,
      type,
      content: '',
      language: type === 'code' ? 'javascript' : 'markdown',
      order
    }
  })

  // Don't revalidate here - component handles refresh via router.refresh()
  // revalidatePath causes double refresh that wipes debounced content
  return cell
}

export async function moveCellUp(cellId: string, notebookId: string) {
  const cell = await prisma.notebookCell.findUnique({
    where: { id: cellId }
  })

  if (!cell || cell.order === 0) return

  // Find cell above in same tab
  const cellAbove = await prisma.notebookCell.findFirst({
    where: {
      tabId: cell.tabId,
      order: cell.order - 1
    }
  })

  if (!cellAbove) return

  // Swap orders
  await Promise.all([
    prisma.notebookCell.update({
      where: { id: cell.id },
      data: { order: cell.order - 1 }
    }),
    prisma.notebookCell.update({
      where: { id: cellAbove.id },
      data: { order: cellAbove.order + 1 }
    })
  ])

  revalidatePath(`/notebooks/${notebookId}`)
}

export async function moveCellDown(cellId: string, notebookId: string) {
  const cell = await prisma.notebookCell.findUnique({
    where: { id: cellId }
  })

  if (!cell) return

  // Find cell below in same tab
  const cellBelow = await prisma.notebookCell.findFirst({
    where: {
      tabId: cell.tabId,
      order: cell.order + 1
    }
  })

  if (!cellBelow) return

  // Swap orders
  await Promise.all([
    prisma.notebookCell.update({
      where: { id: cell.id },
      data: { order: cell.order + 1 }
    }),
    prisma.notebookCell.update({
      where: { id: cellBelow.id },
      data: { order: cellBelow.order - 1 }
    })
  ])

  revalidatePath(`/notebooks/${notebookId}`)
}
