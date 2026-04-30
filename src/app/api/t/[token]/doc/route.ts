import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, customers, organizations, ticketStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { WAIVER_DECLARATIONS } from "@/lib/waiver-declarations";

type DocType = "preventivo" | "liberatoria" | "accettazione" | "ricevuta";

function san(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[^\x20-\xFF]/g, "?").trim();
}

function fmtDate(d: Date | null | undefined, withTime = false): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(d));
}

function fmtCents(cents: number | null | undefined): string {
  if (cents == null) return "-";
  const val = (cents / 100).toFixed(2).replace(".", ",");
  return `EUR ${val}`;
}

function wrapText(text: string, font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>, size: number, maxW: number): string[] {
  const words = san(text).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > maxW) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

type TicketData = {
  ticketNumber: number;
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceImei: string | null;
  deviceSerial: string | null;
  faultDescription: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  quoteAcceptedAt: Date | null;
  quoteRejectedAt: Date | null;
  quoteTermsAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isFinal: boolean;
  customerName: string | null;
  customerPhone: string | null;
  statusName: string | null;
  orgName: string;
  orgAddress: string;
  orgPhone: string | null;
  brandingPrimaryColor: string | null;
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

async function buildPdf(type: DocType, d: TicketData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const W = page.getWidth();
  const H = page.getHeight();

  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primary = d.brandingPrimaryColor && /^#[0-9a-fA-F]{6}$/.test(d.brandingPrimaryColor)
    ? hexToRgb(d.brandingPrimaryColor)
    : rgb(0.051, 0.561, 0.478);
  const dark = rgb(0.1, 0.1, 0.1);
  const mid = rgb(0.4, 0.4, 0.4);
  const light = rgb(0.62, 0.62, 0.62);
  const bgGray = rgb(0.96, 0.96, 0.96);

  const titles: Record<DocType, string> = {
    preventivo: "PREVENTIVO DI RIPARAZIONE",
    liberatoria: "LIBERATORIA",
    accettazione: "ACCETTAZIONE RIPARAZIONE",
    ricevuta: "RICEVUTA",
  };

  // Header
  page.drawRectangle({ x: 0, y: H - 52, width: W, height: 52, color: primary });
  page.drawText(san(d.orgName), { x: 22, y: H - 34, size: 14, font: bold, color: rgb(1, 1, 1) });
  const titleStr = titles[type];
  const tw = bold.widthOfTextAtSize(titleStr, 9);
  page.drawText(titleStr, { x: W - tw - 22, y: H - 28, size: 9, font: bold, color: rgb(1, 1, 1) });
  const numStr = `Ticket #${String(d.ticketNumber).padStart(4, "0")}`;
  const nw = reg.widthOfTextAtSize(numStr, 8);
  page.drawText(numStr, { x: W - nw - 22, y: H - 40, size: 8, font: reg, color: rgb(0.9, 0.9, 0.9) });

  let y = H - 68;

  function section(title: string) {
    y -= 6;
    page.drawRectangle({ x: 20, y: y - 3, width: W - 40, height: 16, color: bgGray });
    page.drawText(title, { x: 24, y, size: 7.5, font: bold, color: mid });
    y -= 20;
  }

  function row(label: string, value: string | null | undefined, isBold = false) {
    const v = san(value);
    if (!v) return;
    page.drawText(san(label), { x: 22, y, size: 8, font: reg, color: light });
    page.drawText(v, { x: 150, y, size: 8.5, font: isBold ? bold : reg, color: dark });
    y -= 14;
  }

  function textBlock(text: string | null | undefined) {
    if (!text) return;
    const lines = wrapText(text, reg, 8.5, W - 44);
    for (const l of lines.slice(0, 8)) {
      page.drawText(l, { x: 22, y, size: 8.5, font: reg, color: dark });
      y -= 13;
    }
    y -= 4;
  }

  // Date meta
  page.drawText(`Data: ${fmtDate(d.createdAt)}`, { x: 22, y, size: 8, font: reg, color: mid });
  y -= 16;
  page.drawLine({ start: { x: 22, y }, end: { x: W - 22, y }, thickness: 0.4, color: bgGray });
  y -= 12;

  const device = [d.deviceBrand, d.deviceModel].filter(Boolean).join(" ") || "—";

  // ── PREVENTIVO ────────────────────────────────────────────────────────────
  if (type === "preventivo") {
    section("CLIENTE");
    row("Nome", d.customerName, true);
    row("Telefono", d.customerPhone);

    section("DISPOSITIVO");
    row("Modello", device, true);
    row("IMEI", d.deviceImei);

    section("GUASTO SEGNALATO");
    textBlock(d.faultDescription);

    section("PREVENTIVO");
    row("Importo stimato", fmtCents(d.estimatedCost), true);

    y -= 4;
    let statusText: string;
    let statusColor = dark;
    if (d.quoteAcceptedAt) {
      statusText = `ACCETTATO dal cliente il ${fmtDate(d.quoteAcceptedAt, true)}`;
      statusColor = rgb(0.05, 0.6, 0.3);
    } else if (d.quoteRejectedAt) {
      statusText = `RIFIUTATO dal cliente il ${fmtDate(d.quoteRejectedAt, true)}`;
      statusColor = rgb(0.8, 0.15, 0.15);
    } else {
      statusText = "In attesa di risposta dal cliente";
      statusColor = rgb(0.7, 0.5, 0.0);
    }
    page.drawText(san(statusText), { x: 22, y, size: 9, font: bold, color: statusColor });
  }

  // ── LIBERATORIA ───────────────────────────────────────────────────────────
  if (type === "liberatoria") {
    section("CLIENTE");
    row("Nome", d.customerName, true);

    section("DISPOSITIVO");
    row("Modello", device, true);
    row("IMEI", d.deviceImei);

    section("DICHIARAZIONI");
    for (const decl of WAIVER_DECLARATIONS) {
      const lines = wrapText(decl, reg, 8, W - 60);
      page.drawText("v", { x: 22, y: y + 1, size: 9, font: bold, color: rgb(0.05, 0.6, 0.3) });
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], { x: 36, y: y - i * 12, size: 8, font: reg, color: dark });
      }
      y -= lines.length * 12 + 6;
    }

    y -= 8;
    page.drawLine({ start: { x: 22, y }, end: { x: W - 22, y }, thickness: 0.4, color: bgGray });
    y -= 16;
    const sigDate = d.quoteAcceptedAt ?? d.quoteTermsAcceptedAt;
    page.drawText(
      `Firma digitale apposta il: ${fmtDate(sigDate, true)}`,
      { x: 22, y, size: 8.5, font: bold, color: dark },
    );
  }

  // ── ACCETTAZIONE ──────────────────────────────────────────────────────────
  if (type === "accettazione") {
    section("CLIENTE");
    row("Nome", d.customerName, true);
    row("Telefono", d.customerPhone);

    section("DISPOSITIVO");
    row("Modello", device, true);
    row("IMEI", d.deviceImei);

    section("RIEPILOGO ACCETTAZIONE");

    const acceptDate = d.quoteAcceptedAt;
    const dateStr = fmtDate(acceptDate, true);

    const items = [
      `Verificate e dichiarate le condizioni del dispositivo (Liberatoria)`,
      `Letti e accettati i Termini e Condizioni di Assistenza`,
      `Autorizzata la riparazione per ${fmtCents(d.estimatedCost)} (IVA inclusa)`,
      `Firma digitale apposta per conferma`,
    ];

    for (const item of items) {
      page.drawText("v", { x: 22, y: y + 1, size: 9, font: bold, color: rgb(0.05, 0.6, 0.3) });
      page.drawText(san(item), { x: 36, y, size: 8.5, font: reg, color: dark });
      y -= 16;
    }

    y -= 8;
    page.drawLine({ start: { x: 22, y }, end: { x: W - 22, y }, thickness: 0.4, color: bgGray });
    y -= 16;
    page.drawText(`Data accettazione: ${dateStr}`, { x: 22, y, size: 8.5, font: bold, color: dark });
  }

  // ── RICEVUTA ──────────────────────────────────────────────────────────────
  if (type === "ricevuta") {
    section("CLIENTE");
    row("Nome", d.customerName, true);
    row("Telefono", d.customerPhone);

    section("DISPOSITIVO");
    row("Modello", device, true);
    row("IMEI", d.deviceImei);
    row("Seriale", d.deviceSerial);

    section("INTERVENTO");
    textBlock(d.faultDescription);

    section("IMPORTI");
    if (d.estimatedCost != null) row("Preventivo", fmtCents(d.estimatedCost));
    row("Costo finale", fmtCents(d.finalCost ?? d.estimatedCost), true);

    y -= 8;
    page.drawLine({ start: { x: 22, y }, end: { x: W - 22, y }, thickness: 0.4, color: bgGray });
    y -= 16;
    page.drawText("Dispositivo consegnato e ritirato dal cliente.", { x: 22, y, size: 8.5, font: reg, color: dark });
    y -= 14;
    page.drawText("Garanzia: 3 mesi dalla data di riparazione (vedere Termini e Condizioni).", { x: 22, y, size: 8, font: reg, color: mid });
  }

  // Footer
  page.drawLine({ start: { x: 22, y: 28 }, end: { x: W - 22, y: 28 }, thickness: 0.4, color: bgGray });
  page.drawText(
    `Generato il ${fmtDate(new Date(), true)} — ${san(d.orgName)}${d.orgAddress ? ` — ${san(d.orgAddress)}` : ""}`,
    { x: 22, y: 15, size: 6.5, font: reg, color: light },
  );

  return doc.save();
}

const EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const type = req.nextUrl.searchParams.get("type") as DocType | null;

  const validTypes: DocType[] = ["preventivo", "liberatoria", "accettazione", "ricevuta"];
  if (!type || !validTypes.includes(type)) {
    return new NextResponse("Tipo documento non valido", { status: 400 });
  }

  const [row] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      deviceImei: tickets.deviceImei,
      deviceSerial: tickets.deviceSerial,
      faultDescription: tickets.faultDescription,
      estimatedCost: tickets.estimatedCost,
      finalCost: tickets.finalCost,
      quoteAcceptedAt: tickets.quoteAcceptedAt,
      quoteRejectedAt: tickets.quoteRejectedAt,
      quoteTermsAcceptedAt: tickets.quoteTermsAcceptedAt,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      isFinal: ticketStatuses.isFinal,
      customerName: customers.name,
      customerPhone: customers.phone,
      orgId: tickets.organizationId,
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!row) return new NextResponse("Non trovato", { status: 404 });

  // Expiry check: 24h after reaching a final status
  const isExpired = !!row.isFinal && Date.now() - new Date(row.updatedAt).getTime() > EXPIRY_MS;
  if (isExpired) return new NextResponse("Link scaduto", { status: 410 });

  // Per-type permission checks
  if (type === "ricevuta" && !row.isFinal) {
    return new NextResponse("La ricevuta è disponibile solo dopo la consegna", { status: 403 });
  }
  if ((type === "liberatoria" || type === "accettazione") && !row.quoteAcceptedAt) {
    return new NextResponse("Documento non disponibile", { status: 403 });
  }

  const [org] = await db
    .select({
      name: organizations.name,
      phone: organizations.phone,
      address: organizations.address,
      city: organizations.city,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
    })
    .from(organizations)
    .where(eq(organizations.id, row.orgId))
    .limit(1);

  const data: TicketData = {
    ...row,
    isFinal: row.isFinal ?? false,
    statusName: null,
    orgName: org?.name ?? "Centro Riparazioni",
    orgAddress: [org?.address, org?.city].filter(Boolean).join(", "),
    orgPhone: org?.phone ?? null,
    brandingPrimaryColor: org?.brandingPrimaryColor ?? null,
  };

  const pdfBytes = await buildPdf(type, data);
  const filename = `${type}-${String(row.ticketNumber).padStart(4, "0")}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
