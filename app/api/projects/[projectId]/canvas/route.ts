import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProjectWithAccess } from "@/lib/project-access";
import { put, get } from "@vercel/blob";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch from Prisma to get canvasJsonPath
  const fullProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!fullProject || !fullProject.canvasJsonPath) {
    return NextResponse.json(null);
  }

  try {
    // Retrieve the private blob from storage
    const fetched = await get(fullProject.canvasJsonPath, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    if (!fetched) {
      return NextResponse.json(null);
    }
    
    const canvasData = await new Response(fetched.stream).json();
    return NextResponse.json(canvasData);
  } catch (error) {
    console.error("Error loading canvas:", error);
    return NextResponse.json({ error: "Error loading canvas" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const canvasData = await request.json();
    
    // Upload the JSON to Vercel Blob with private access and overwrite configuration
    const blob = await put(`projects/${projectId}/canvas.json`, JSON.stringify(canvasData), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Store the returned blob URL on the matching Prisma project record
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Error saving canvas:", error);
    return NextResponse.json({ error: "Error saving canvas" }, { status: 500 });
  }
}
