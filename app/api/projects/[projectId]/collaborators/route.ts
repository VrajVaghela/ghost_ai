import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getProjectWithAccess } from "@/lib/project-access"
import { enrichCollaborators } from "@/lib/data/collaborators"

type Params = { params: Promise<{ projectId: string }> }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params

  const project = await getProjectWithAccess(projectId)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    select: { id: true, email: true },
    orderBy: { createdAt: "desc" },
  })

  const collaborators = await enrichCollaborators(rows)
  return NextResponse.json(collaborators)
}

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const email: string = (body.email ?? "").trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }

  const collaborator = await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    update: {},
    create: { projectId, email },
    select: { id: true, email: true },
  })

  const [enriched] = await enrichCollaborators([collaborator])
  return NextResponse.json(enriched, { status: 201 })
}
