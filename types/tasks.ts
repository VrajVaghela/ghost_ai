import { z } from "zod";

export const AiStatusMessageSchema = z.object({
  id: z.string(),
  message: z.string(),
  timestamp: z.number(),
  type: z.enum(["info", "success", "error"]),
  text: z.string().optional(),
});

export type AiStatusMessage = z.infer<typeof AiStatusMessageSchema>;

export const AiChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;
