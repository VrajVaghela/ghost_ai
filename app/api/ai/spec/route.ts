import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getProjectWithAccess } from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";

// Request validation. Project access is derived from the authenticated user +
// roomId, so no client-supplied projectId is accepted or trusted.
const SpecRequestSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  chatHistory: z
    .array(
      z
        .object({
          role: z.string().optional(),
          sender: z.string().optional(),
          content: z.string().optional(),
        })
        .passthrough()
    )
    .default([]),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SpecRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // Resolve project access from the authenticated user + roomId. The resolved
  // project id is the only projectId we trust downstream.
  const project = await getProjectWithAccess(roomId);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId,
      },
    });

    // Scoped read-only public token so the client can subscribe to this run
    // in real time via useRealtimeRun without a second round-trip.
    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: handle.id,
        },
      },
      realtime: {},
    });

    return NextResponse.json({ runId: handle.id, publicToken }, { status: 202 });
  } catch (error) {
    console.error("Error triggering generate-spec task:", error);
    return NextResponse.json(
      { error: "Error triggering spec task" },
      { status: 500 }
    );
  }
}
