import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { getProjectWithAccess } from "@/lib/project-access";

type Params = { params: Promise<{ projectId: string; specId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  // Verify the caller can access this project (owner or collaborator).
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The spec must exist and belong to this project.
  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { id: true, filePath: true },
  });

  if (!spec || !spec.filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Retrieve the private blob using the stored reference.
    const fetched = await get(spec.filePath, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!fetched) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const markdown = await new Response(fetched.stream).text();

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="spec-${spec.id}.md"`,
      },
    });
  } catch (error) {
    console.error("Error downloading spec:", error);
    return NextResponse.json(
      { error: "Error downloading spec" },
      { status: 500 }
    );
  }
}
