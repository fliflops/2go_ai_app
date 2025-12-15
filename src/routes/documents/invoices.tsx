import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/documents/invoices')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/documents/invoices"!</div>
}
