import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/document-upload2/invoice')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/document-upload/invoice"!</div>
}
