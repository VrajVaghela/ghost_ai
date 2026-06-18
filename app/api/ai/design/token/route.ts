import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await clerkAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const runId = typeof body.runId === "string" ? body.runId.trim() : "";

  if (!runId) {
    return NextResponse.json({ error: "Missing required runId" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: { runId, userId },
    select: { runId: true },
  });

  if (!taskRun) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: taskRun.runId,
        },
      },
      realtime: {},
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creating design task token:", error);
    return NextResponse.json(
      { error: "Error creating design task token" },
      { status: 500 }
    );
  }
}
