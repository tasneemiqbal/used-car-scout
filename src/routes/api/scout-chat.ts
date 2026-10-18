// Streaming endpoint for Scout's report chat. The browser sends only a report id
// and the conversation; facts are loaded here from the stored report.
import { createFileRoute } from "@tanstack/react-router";
import { chatRequestSchema, cleanChatHistory } from "@/lib/scout.chat";

const json = (status: number, error: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });

export const Route = createFileRoute("/api/scout-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, "That message could not be sent.");

        let history;
        try {
          history = cleanChatHistory(parsed.data.messages);
        } catch (error) {
          return json(400, (error as Error).message);
        }

        const { loadStoredReport } = await import("@/lib/scout.build.server");
        const report = await loadStoredReport(parsed.data.reportId).catch(() => null);
        if (!report) return json(404, "This report could not be found.");

        // Spend the hourly allowance only once the request is known to be valid.
        try {
          const { enforceScoutLimit } = await import("@/lib/scout.limits.server");
          await enforceScoutLimit("message");
        } catch (error) {
          const message = (error as Error).message;
          return message.startsWith("You've used") ? json(429, message) : json(503, message);
        }

        // If the buyer pasted a VIN, check it with the official NHTSA sources
        // so Scout answers from facts, never from memory.
        const { findVinInText } = await import("@/lib/scout.vin");
        const lastUser = [...history].reverse().find((message) => message.role === "user");
        const vinHit = lastUser
          ? findVinInText(lastUser.parts.map((part) => part.text).join("\n"))
          : null;
        let vinFacts: unknown = null;
        if (vinHit) {
          const { fetchVinFacts } = await import("@/lib/scout.vin.server");
          vinFacts = await fetchVinFacts(vinHit.vin, vinHit.checkDigitOk).catch(() => null);
        }

        const { streamReportChat } = await import("@/lib/scout.ai.server");
        return streamReportChat(request, report, history, vinFacts, { language: parsed.data.language, practice: parsed.data.practice });
      },
    },
  },
});
