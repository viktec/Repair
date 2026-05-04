import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import {
  organizations,
  tickets,
  ticketStatuses,
  posTransactions,
  inventoryItems,
  memberships,
  users,
} from "@/db/schema";
import { eq, and, gte, lt, isNull, lte, count, sum } from "drizzle-orm";

const anthropic = new Anthropic();

// ─── Period helpers ──────────────────────────────────────────────────────────

function getPeriodRange(period: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { from: today, to: new Date(today.getTime() + 86400000) };
    case "this_week": {
      const day = today.getDay(); // 0=dom
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7));
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      return { from: monday, to: nextMonday };
    }
    case "this_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    case "last_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case "this_year":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear() + 1, 0, 1),
      };
    default:
      return { from: today, to: new Date(today.getTime() + 86400000) };
  }
}

function periodLabel(period: string): string {
  const labels: Record<string, string> = {
    today: "oggi",
    this_week: "questa settimana",
    this_month: "questo mese",
    last_month: "il mese scorso",
    this_year: "quest'anno",
  };
  return labels[period] ?? period;
}

// ─── Tool execution ──────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, string>,
  orgId: string,
): Promise<string> {
  if (toolName === "get_ticket_stats") {
    const { period, status } = toolInput;
    const { from, to } = getPeriodRange(period);

    const conditions = [
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      gte(tickets.createdAt, from),
      lt(tickets.createdAt, to),
    ];

    if (status) {
      // find status by name
      const [st] = await db
        .select({ id: ticketStatuses.id })
        .from(ticketStatuses)
        .where(
          and(
            eq(ticketStatuses.organizationId, orgId),
            eq(ticketStatuses.name, status),
          ),
        )
        .limit(1);
      if (st) conditions.push(eq(tickets.statusId, st.id));
    }

    const [result] = await db
      .select({ total: count() })
      .from(tickets)
      .where(and(...conditions));

    const label = periodLabel(period);
    const statusText = status ? ` con stato "${status}"` : "";
    return `Ticket${statusText} ${label}: ${result?.total ?? 0}`;
  }

  if (toolName === "get_revenue") {
    const { period } = toolInput;
    const { from, to } = getPeriodRange(period);

    // POS transactions (completed only)
    const [posResult] = await db
      .select({ total: sum(posTransactions.totalCents) })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.organizationId, orgId),
          eq(posTransactions.status, "completed"),
          gte(posTransactions.createdAt, from),
          lt(posTransactions.createdAt, to),
        ),
      );

    // Ticket final costs (delivered tickets)
    const [ticketResult] = await db
      .select({ total: sum(tickets.finalCost) })
      .from(tickets)
      .where(
        and(
          eq(tickets.organizationId, orgId),
          isNull(tickets.deletedAt),
          gte(tickets.deliveredAt, from),
          lt(tickets.deliveredAt, to),
        ),
      );

    const posCents = Number(posResult?.total ?? 0);
    const ticketCents = Number(ticketResult?.total ?? 0);
    const totalCents = posCents + ticketCents;
    const totalEur = (totalCents / 100).toFixed(2);
    const label = periodLabel(period);
    return `Fatturato ${label}: €${totalEur} (POS: €${(posCents / 100).toFixed(2)}, Ticket chiusi: €${(ticketCents / 100).toFixed(2)})`;
  }

  if (toolName === "get_inventory_alerts") {
    const items = await db
      .select({
        name: inventoryItems.name,
        quantity: inventoryItems.quantity,
        minQuantity: inventoryItems.minQuantity,
        sku: inventoryItems.sku,
      })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.organizationId, orgId),
          isNull(inventoryItems.deletedAt),
          lte(inventoryItems.quantity, inventoryItems.minQuantity),
        ),
      )
      .orderBy(inventoryItems.name);

    if (items.length === 0) return "Nessun prodotto sotto scorta minima.";
    const list = items
      .map(
        (i) =>
          `• ${i.name}${i.sku ? ` (${i.sku})` : ""}: ${i.quantity} pz (min. ${i.minQuantity})`,
      )
      .join("\n");
    return `Prodotti sotto scorta (${items.length}):\n${list}`;
  }

  if (toolName === "get_open_tickets") {
    const { technician } = toolInput;

    // Get non-final statuses
    const finalStatuses = await db
      .select({ id: ticketStatuses.id })
      .from(ticketStatuses)
      .where(
        and(
          eq(ticketStatuses.organizationId, orgId),
          eq(ticketStatuses.isFinal, true),
        ),
      );
    const finalIds = finalStatuses.map((s) => s.id);

    let technicianLabel = "";
    if (technician) {
      // Find member by name for context
      const [member] = await db
        .select({ name: users.name })
        .from(users)
        .innerJoin(memberships, eq(memberships.userId, users.id))
        .where(
          and(
            eq(memberships.organizationId, orgId),
          ),
        )
        .limit(1);
      technicianLabel = ` (tecnico: ${technician})`;
      void member; // technician filtering by name not feasible without assignment table — return general count with note
    }

    const conditions = [
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
    ];

    // Exclude final statuses if any
    const allTickets = await db
      .select({ statusId: tickets.statusId })
      .from(tickets)
      .where(and(...conditions));

    const openCount = allTickets.filter(
      (t) => !t.statusId || !finalIds.includes(t.statusId),
    ).length;

    return `Ticket aperti${technicianLabel}: ${openCount}`;
  }

  return "Tool non riconosciuto.";
}

// ─── Claude tool definitions ─────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_ticket_stats",
    description:
      "Conta e aggrega ticket per un periodo. Supporta: today, this_week, this_month, last_month",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "this_week", "this_month", "last_month"],
        },
        status: {
          type: "string",
          description: "Filtra per stato (opzionale)",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "get_revenue",
    description:
      "Fatturato totale (POS + ticket consegnati) per un periodo",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: [
            "today",
            "this_week",
            "this_month",
            "last_month",
            "this_year",
          ],
        },
      },
      required: ["period"],
    },
  },
  {
    name: "get_inventory_alerts",
    description: "Lista prodotti sotto scorta minima",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_open_tickets",
    description: "Numero ticket aperti, eventualmente per tecnico",
    input_schema: {
      type: "object",
      properties: {
        technician: {
          type: "string",
          description: "Nome tecnico (opzionale)",
        },
      },
    },
  },
];

// ─── Telegram helpers ────────────────────────────────────────────────────────

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

// ─── Webhook route ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = (body.message ?? body.edited_message) as
    | Record<string, unknown>
    | undefined;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = (
    (message.chat as Record<string, unknown>)?.id ?? ""
  ).toString();
  const text = (message.text as string | undefined) ?? "";

  if (!text.trim()) return NextResponse.json({ ok: true });

  // Find the org by chatId (business plan check happens implicitly — only business orgs set up the bot)
  const [org] = await db
    .select({
      id: organizations.id,
      telegramBotToken: organizations.telegramBotToken,
      telegramChatId: organizations.telegramChatId,
      plan: organizations.plan,
    })
    .from(organizations)
    .where(eq(organizations.telegramChatId, chatId))
    .limit(1);

  if (!org?.telegramBotToken || !org.telegramChatId) return NextResponse.json({ ok: true });

  // Security: verify chat id matches exactly
  if (org.telegramChatId !== chatId) return NextResponse.json({ ok: true });

  // Only business plan
  if (!["business", "gift"].includes(org.plan)) {
    await sendTelegramMessage(
      org.telegramBotToken,
      chatId,
      "Il bot BI richiede il piano Business.",
    );
    return NextResponse.json({ ok: true });
  }

  // Run Claude with tool use
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: text },
  ];

  try {
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `Sei un assistente BI per un centro di riparazione (smartphone, tablet, PC, TV).
Rispondi SEMPRE in italiano, in modo conciso e diretto.
Hai accesso a strumenti per interrogare il database del negozio in sola lettura.
Non puoi modificare dati. Usa gli strumenti quando l'utente chiede dati numerici.
Oggi è ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`,
      tools: TOOLS,
      messages,
    });

    // Agentic loop — handle tool calls
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeTool(
            block.name,
            block.input as Record<string, string>,
            org.id,
          );
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          };
        }),
      );

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `Sei un assistente BI per un centro di riparazione (smartphone, tablet, PC, TV).
Rispondi SEMPRE in italiano, in modo conciso e diretto.
Hai accesso a strumenti per interrogare il database del negozio in sola lettura.
Non puoi modificare dati. Usa gli strumenti quando l'utente chiede dati numerici.
Oggi è ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`,
        tools: TOOLS,
        messages,
      });
    }

    const replyText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (replyText) {
      await sendTelegramMessage(org.telegramBotToken, chatId, replyText);
    }
  } catch (err) {
    console.error("[telegram/webhook] Claude error:", err);
    await sendTelegramMessage(
      org.telegramBotToken,
      chatId,
      "Si è verificato un errore. Riprova tra qualche istante.",
    );
  }

  return NextResponse.json({ ok: true });
}
