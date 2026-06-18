import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getProjectWithAccess } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";

  if (!prompt || !roomId || !projectId) {
    return NextResponse.json(
      { error: "Missing required prompt, roomId, or projectId" },
      { status: 400 }
    );
  }

  if (roomId !== projectId) {
    return NextResponse.json(
      { error: "roomId must match projectId" },
      { status: 400 }
    );
  }

  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    });

    // Scoped read-only public token so the client can subscribe to this run
    // in real time via useRealtimeRun.
    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: handle.id,
        },
      },
      realtime: {},
    });

    return NextResponse.json(
      { runId: handle.id, publicToken },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error triggering design agent task:", error);
    return NextResponse.json(
      { error: "Error triggering design task" },
      { status: 500 }
    );
  }
}
