import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

export interface CurrentIdentity {
  userId: string
  email: string | null
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null

  return { userId, email }
}

export interface ProjectAccess {
  id: string
  name: string
  ownerId: string
}

export async function getProjectWithAccess(roomId: string): Promise<ProjectAccess | null> {
  const identity = await getCurrentIdentity()
  if (!identity) return null

  const project = await prisma.project.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) return null

  if (project.ownerId === identity.userId) return project

  if (identity.email) {
    const collab = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId: roomId, email: identity.email } },
      select: { id: true },
    })
    if (collab) return project
  }

  return null
}
