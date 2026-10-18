// Browser-safe contract for the report chat request. The server rebuilds every
// message from text only, so a browser cannot smuggle tool calls or extra fields.
import { z } from "zod";
import { reportLookupSchema } from "./scout.schemas";

export const CHAT_HISTORY_LIMIT = 16;
export const CHAT_MESSAGE_CHARACTER_LIMIT = 1_000;

const partSchema = z.object({ type: z.string(), text: z.string().optional() }).passthrough();
const messageSchema = z
  .object({
    id: z.string().max(100),
    role: z.enum(["user", "assistant"]),
    parts: z.array(partSchema).max(40),
  })
  .passthrough();

export const chatRequestSchema = z.object({
  reportId: reportLookupSchema.shape.id,
  messages: z.array(messageSchema).min(1).max(200),
  language: z.enum(["en", "es"]).default("en"),
  practice: z.object({ scenario: z.enum(["price", "pressure", "leave"]), style: z.enum(["friendly", "pushy"]), end: z.boolean().default(false) }).optional(),
});

export const scoutReplySchema = z.object({
  answer: z.string().trim().min(1).max(3000),
  followUps: z.array(z.string().trim().min(1).max(200)).min(2).max(3),
  sellerMessage: z.string().max(1000).nullable(),
  feedback: z.object({ didWell: z.string().max(600), tryNext: z.string().max(600), strongerPhrase: z.string().max(600) }).nullable(),
}).strict();
export type ScoutReply = z.infer<typeof scoutReplySchema>;

export type CleanChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
};

/** Keeps the latest turns, text only, each trimmed to a safe length. */
export function cleanChatHistory(messages: z.infer<typeof messageSchema>[]): CleanChatMessage[] {
  const cleaned = messages
    .map((message) => {
      const text = message.parts
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text as string)
        .join("\n")
        .trim()
        .slice(0, CHAT_MESSAGE_CHARACTER_LIMIT);
      return { id: message.id, role: message.role, parts: [{ type: "text" as const, text }] };
    })
    .filter((message) => (message.parts[0]?.text.length ?? 0) > 0)
    .slice(-CHAT_HISTORY_LIMIT);
  if (cleaned.length === 0 || cleaned[cleaned.length - 1]?.role !== "user") {
    throw new Error("Please type a question for Scout.");
  }
  return cleaned;
}
