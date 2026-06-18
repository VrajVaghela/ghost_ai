import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getProjectWithAccess } from "@/lib/project-access"

type Params = { params: Promise<{ projectId: string }> }

function filenameFromPath(filePath: string | null, id: string) {
  if (!filePath) return `spec-${id}.md`

  try {
    const url = new URL(filePath)
    const name = url.pathname.split("/").filter(Boolean).at(-1)
    return name || `spec-${id}.md`
  } catch {
    const name = filePath.split(/[\\/]/).filter(Boolean).at(-1)
    return name || `spec-${id}.md`
  }
}

export async function GET(_request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await getProjectWithAccess(projectId)
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filePath: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      specs: specs.map((spec) => ({
        id: spec.id,
        filename: filenameFromPath(spec.filePath, spec.id),
        createdAt: spec.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Error loading specs:", error)
    return NextResponse.json(
      { error: "Error loading specs" },
      { status: 500 }
    )
  }
}
