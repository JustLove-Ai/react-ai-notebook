import { getNotebook, getNotebooks } from '@/lib/actions/notebooks'
import { notFound } from 'next/navigation'
import { JupyterLayout } from '@/components/jupyter-layout'

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const notebook = await getNotebook(id)
  const notebooks = await getNotebooks()

  if (!notebook) {
    notFound()
  }

  return (
    <JupyterLayout notebooks={notebooks} currentNotebook={notebook} />
  )
}
