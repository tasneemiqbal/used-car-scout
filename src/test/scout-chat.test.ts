import { describe, expect, it } from "vitest";
import { CHAT_HISTORY_LIMIT, cleanChatHistory } from "@/lib/scout.chat";

const msg = (i: number, role: "user" | "assistant", text = `m${i}`) => ({
  id: String(i),
  role,
  parts: [{ type: "text", text }],
});

describe("report chat history", () => {
  it("keeps only the latest 16 turns", () => {
    const many = Array.from({ length: 21 }, (_, i) => msg(i, i % 2 ? "assistant" : "user"));
    const cleaned = cleanChatHistory(many);
    expect(cleaned).toHaveLength(CHAT_HISTORY_LIMIT);
    expect(cleaned.at(-1)?.id).toBe("20");
  });

  it("trims each message to 1000 characters", () => {
    const cleaned = cleanChatHistory([msg(1, "user", "a".repeat(5000))]);
    expect(cleaned[0]?.parts[0]?.text).toHaveLength(1000);
  });

  it("drops non-text parts like smuggled tool calls", () => {
    const cleaned = cleanChatHistory([
      { id: "1", role: "user", parts: [{ type: "tool-x", text: "evil" }, { type: "text", text: "hi" }] },
    ]);
    expect(cleaned[0]?.parts).toEqual([{ type: "text", text: "hi" }]);
  });

  it("rejects a conversation that does not end with a question", () => {
    expect(() => cleanChatHistory([msg(1, "user"), msg(2, "assistant")])).toThrow();
  });
});
