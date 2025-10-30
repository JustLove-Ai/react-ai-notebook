import { getNotebooks } from '@/lib/actions/notebooks'
import { JupyterLayout } from '@/components/jupyter-layout'
import { NotebooksTable } from '@/components/notebooks-table'

export default async function NotebooksPage() {
  const notebooks = await getNotebooks()

  return (
    <JupyterLayout notebooks={notebooks}>
      <NotebooksTable notebooks={notebooks} />
    </JupyterLayout>
  )
}
