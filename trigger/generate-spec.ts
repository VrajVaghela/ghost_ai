import { task, metadata } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { put } from "@vercel/blob";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Initialize Gemini provider (reuses the same provider config as the design agent)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

// Input validation schema. Canvas nodes/edges are kept loose (z.any) so this
// task never has to track the canvas data model; chat history is normalised to
// the fields we actually use for context.
const ChatMessageSchema = z
  .object({
    role: z.string().optional(),
    sender: z.string().optional(),
    content: z.string().optional(),
  })
  .passthrough();

const GenerateSpecInputSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema).default([]),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

export type GenerateSpecInput = z.input<typeof GenerateSpecInputSchema>;

const SYSTEM_PROMPT = `You are a senior software architect. You are given the current state of a collaborative system-design canvas (its nodes and edges) along with the design conversation between collaborators and the AI.

Your task is to write a thorough, detailed technical specification in GitHub-flavored Markdown that fully documents the architecture of the system represented by the canvas. The reader should be able to understand and implement the system from this document alone. Produce a comprehensive, in-depth spec every time — never a brief summary.

Output rules:
- Output Markdown only. Do not wrap the whole document in a code fence.
- Start with a top-level "# Technical Specification" heading.

Always include the following sections, in this order. For each, go deep — explain the "why" behind decisions, not just the "what":
1. Overview — what the system does and the problem it solves.
2. Goals & Non-Goals — what is explicitly in and out of scope.
3. Architecture — a narrative walkthrough of the overall design and how the pieces fit together.
4. Components — one subsection per node. For each component cover its responsibility, its inputs/outputs, the components it talks to, and the nature of each interaction (derived from edge labels).
5. Data Flow — trace the primary end-to-end paths through the system, step by step, following the edges.
6. Data Model — entities, key fields, and relationships, to the extent the canvas and conversation imply them.
7. APIs & Interfaces — the contracts between components (requests, events, messages) where they can be inferred.
8. Scaling & Performance — how each part scales and where bottlenecks are likely.
9. Reliability & Failure Modes — what happens when each component or edge fails, and how the system degrades or recovers.
10. Security — trust boundaries, authn/authz, and data-protection concerns.
11. Trade-offs & Alternatives — notable design decisions and the alternatives that were or could be considered.
12. Open Questions — anything the canvas leaves ambiguous.

Sourcing rules:
- Derive component names, responsibilities, and relationships from the node labels and the edges connecting them. Treat edge labels as the nature of the interaction between components.
- Use the design conversation only as supporting context for intent; the canvas graph is the source of truth.
- Do not invent components that are not represented on the canvas. When the canvas lacks the signal for a section, still include the section and explicitly call out the gaps and assumptions under "Open Questions" rather than fabricating concrete components.
- Elaborate fully on every component and edge that IS present — reasonable, clearly-labeled inferences about responsibilities, interactions, and failure handling are expected and encouraged.`;

function buildUserPrompt(input: z.infer<typeof GenerateSpecInputSchema>): string {
  const { nodes, edges, chatHistory } = input;

  const conversation = chatHistory
    .map((m) => {
      const speaker = m.role ?? m.sender ?? "user";
      const content = m.content ?? "";
      return content ? `${speaker}: ${content}` : "";
    })
    .filter(Boolean)
    .join("\n");

  return `Canvas nodes:
${JSON.stringify(nodes, null, 2)}

Canvas edges:
${JSON.stringify(edges, null, 2)}

Design conversation:
${conversation || "(no conversation provided)"}

Write the technical specification in Markdown for the system above.`;
}

export const generateSpec = task({
  id: "generate-spec",
  run: async (payload: GenerateSpecInput) => {
    // 1. Validate input with Zod.
    const input = GenerateSpecInputSchema.parse(payload);
    const { projectId, roomId, nodes, edges } = input;

    console.log("Starting generate-spec task", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    // 2. Mark the run as started for realtime tracking.
    metadata.set("status", "generating");
    metadata.set("message", "Analyzing the canvas and generating the specification...");

    try {
      // 3. Generate the Markdown spec with Gemini.
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(input),
        // Give the model room to produce a full, detailed architecture spec
        // rather than getting truncated at the provider's default budget.
        maxOutputTokens: 8192,
      });

      const spec = result.text.trim();
      console.log(`Generated spec (${spec.length} chars)`);

      // 4. Persist the spec: metadata in Prisma, content in Vercel Blob.
      //    Follows the same metadata + blob split used for canvas persistence.
      metadata.set("message", "Saving the specification...");

      // Create the metadata record first so its id can key the blob path.
      const specRecord = await prisma.projectSpec.create({
        data: { projectId, filePath: "" },
      });

      const blob = await put(
        `specs/${projectId}/${specRecord.id}.md`,
        spec,
        {
          access: "private",
          contentType: "text/markdown",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );

      // Store the blob URL on the metadata record as the artifact reference.
      await prisma.projectSpec.update({
        where: { id: specRecord.id },
        data: { filePath: blob.url },
      });

      // 5. Mark the run complete for realtime tracking.
      metadata.set("status", "complete");
      metadata.set("message", "Specification generated.");

      // 6. Return the generated spec plus its persisted record reference.
      return { spec, specId: specRecord.id };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error running generate-spec task:", errorMessage);
      metadata.set("status", "error");
      metadata.set("message", `Error: ${errorMessage}`);
      throw error;
    }
  },
});
