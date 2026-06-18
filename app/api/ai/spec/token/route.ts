import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const TokenRequestSchema = z.object({
  runId: z.string().min(1, "runId is required"),
});

export async function POST(request: Request) {
  const { userId } = await clerkAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = TokenRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing required runId" }, { status: 400 });
  }

  const { runId } = parsed.data;

  // The token is only issued for runs owned by the authenticated user.
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
      expirationTime: "1h",
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creating spec task token:", error);
    return NextResponse.json(
      { error: "Error creating spec task token" },
      { status: 500 }
    );
  }
}
