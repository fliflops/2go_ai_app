import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/document-upload2/contract')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/document-upload/contract"!</div>
}
