import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client"
import { getProjectWithAccess } from "@/lib/project-access"
import { getOwnedProjects, getSharedProjects } from "@/lib/data/projects"

type Props = { params: Promise<{ roomId: string }> }

export default async function EditorWorkspacePage({ params }: Props) {
  const { roomId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const project = await getProjectWithAccess(roomId)
  if (!project) {
    return <AccessDenied />
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ])

  return (
    <EditorWorkspaceClient
      project={project}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
