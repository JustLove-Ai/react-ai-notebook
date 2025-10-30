'use client'

import { useEffect, useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface SortableCellsWrapperProps {
  cells: Array<{ id: string; [key: string]: any }>
  onDragEnd: (event: DragEndEvent) => void
  children: React.ReactNode
  tabId?: string
}

export function SortableCellsWrapper({ cells, onDragEnd, children, tabId }: SortableCellsWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Only render drag-and-drop after mount to avoid SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Render children without drag-drop during SSR
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      id={`dnd-${tabId || 'default'}`}
    >
      <SortableContext
        items={cells.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  )
}
