import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations, ticketPhotos } from "@/db/schema";
import { eq, and, isNull, sql, asc, inArray } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { getObjectBuffer } from "@/lib/storage";

// Strip characters outside WinAnsiEncoding (pdf-lib standard fonts)
function san(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/[^\x20-\xFF]/g, "?").trim();
}

function formatCents(cents: number | null): string {
  if (cents == null) return "";
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

async function buildPdf(ticket: TicketRow, orgName: string, orgAddress: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const W = page.getWidth();
  const H = page.getHeight();

  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const teal = rgb(0.051, 0.561, 0.478); // #0D8F7A
  const dark = rgb(0.1, 0.1, 0.1);
  const mid = rgb(0.45, 0.45, 0.45);
  const light = rgb(0.62, 0.62, 0.62);
  const bg = rgb(0.96, 0.96, 0.96);

  // ── Header ──────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 52, width: W, height: 52, color: teal });
  page.drawText(san(orgName), { x: 22, y: H - 34, size: 15, font: bold, color: rgb(1, 1, 1) });
  const numStr = `Ticket #${String(ticket.ticketNumber).padStart(4, "0")}`;
  const nw = bold.widthOfTextAtSize(numStr, 13);
  page.drawText(numStr, { x: W - nw - 22, y: H - 34, size: 13, font: bold, color: rgb(1, 1, 1) });

  let y = H - 68;

  // ── Meta row ─────────────────────────────────────────────
  const dateStr = new Date(ticket.createdAt).toLocaleDateString("it-IT");
  page.drawText(`Data: ${dateStr}`, { x: 22, y, size: 8.5, font: reg, color: mid });
  if (ticket.statusName) {
    const sw = reg.widthOfTextAtSize(`Stato: ${san(ticket.statusName)}`, 8.5);
    page.drawText(`Stato: ${san(ticket.statusName)}`, { x: W - sw - 22, y, size: 8.5, font: reg, color: mid });
  }
  y -= 16;
  page.drawLine({ start: { x: 22, y }, end: { x: W - 22, y }, thickness: 0.5, color: bg });
  y -= 12;

  // Helper: section header
  function section(title: string) {
    y -= 4;
    page.drawRectangle({ x: 20, y: y - 3, width: W - 40, height: 15, color: bg });
    page.drawText(title, { x: 24, y, size: 7.5, font: bold, color: mid });
    y -= 18;
  }

  // Helper: labeled row
  function row(label: string, value: string | null | undefined, isBold = false) {
    const v = san(value);
    if (!v) return;
    page.drawText(san(label), { x: 22, y, size: 8, font: reg, color: light });
    page.drawText(v, { x: 140, y, size: 8.5, font: isBold ? bold : reg, color: dark });
    y -= 14;
  }

  // Helper: multi-line text block
  function textBlock(text: string) {
    const words = san(text).split(" ");
    const maxW = W - 44;
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (reg.widthOfTextAtSize(t, 8.5) > maxW) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    for (const l of lines.slice(0, 6)) {
      page.drawText(l, { x: 22, y, size: 8.5, font: reg, color: dark });
      y -= 13;
    }
    y -= 4;
  }

  // ── Cliente ──────────────────────────────────────────────
  section("CLIENTE");
  row("Nome", ticket.customerName, true);
  row("Telefono", ticket.customerPhone);
  row("Email", ticket.customerEmail);

  // ── Dispositivo ──────────────────────────────────────────
  section("DISPOSITIVO");
  row("Modello", [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" "), true);
  row("IMEI", ticket.deviceImei);
  row("Seriale", ticket.deviceSerial);
  row("Accessori", ticket.accessories);
  row("Condizioni", ticket.deviceCondition);

  // ── Guasto ───────────────────────────────────────────────
  section("GUASTO SEGNALATO");
  textBlock(ticket.faultDescription ?? "");

  // ── Importi ──────────────────────────────────────────────
  if (ticket.estimatedCost != null || ticket.finalCost != null) {
    section("IMPORTI");
    row("Preventivo", formatCents(ticket.estimatedCost));
    row("Costo finale", formatCents(ticket.finalCost), true);
  }

  // ── Note interne ─────────────────────────────────────────
  if (ticket.internalNotes) {
    section("NOTE INTERNE");
    textBlock(ticket.internalNotes);
  }

  // ── Footer ───────────────────────────────────────────────
  page.drawLine({ start: { x: 22, y: 28 }, end: { x: W - 22, y: 28 }, thickness: 0.4, color: bg });
  page.drawText(
    `Generato il ${new Date().toLocaleDateString("it-IT")} — ${san(orgName)} — ${san(orgAddress)}`,
    { x: 22, y: 15, size: 6.5, font: reg, color: light },
  );

  return doc.save();
}

type TicketRow = {
  id: string;
  ticketNumber: number;
  createdAt: Date;
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceImei: string | null;
  deviceSerial: string | null;
  accessories: string | null;
  deviceCondition: string | null;
  faultDescription: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  internalNotes: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  statusName: string | null;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return new NextResponse("Non autorizzato", { status: 401 });
  }
  const orgId = session.user.organizationId;

  const year = req.nextUrl.searchParams.get("year");

  const [org] = await db
    .select({ name: organizations.name, address: organizations.address, city: organizations.city })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const conditions = [eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)];
  if (year) {
    const y = parseInt(year, 10);
    if (!isNaN(y)) conditions.push(sql`extract(year from ${tickets.createdAt})::integer = ${y}`);
  }

  const rows: TicketRow[] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      createdAt: tickets.createdAt,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      deviceImei: tickets.deviceImei,
      deviceSerial: tickets.deviceSerial,
      accessories: tickets.accessories,
      deviceCondition: tickets.deviceCondition,
      faultDescription: tickets.faultDescription,
      estimatedCost: tickets.estimatedCost,
      finalCost: tickets.finalCost,
      internalNotes: tickets.internalNotes,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerEmail: customers.email,
      statusName: ticketStatuses.name,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(...conditions))
    .orderBy(asc(tickets.ticketNumber));

  if (rows.length === 0) {
    return new NextResponse("Nessun ticket trovato", { status: 404 });
  }

  const orgName = org?.name ?? "Centro Riparazioni";
  const orgAddress = [org?.address, org?.city].filter(Boolean).join(", ");

  // Fetch all photos for these tickets in one query
  const ticketIds = rows.map((r) => r.id);
  const photos = await db
    .select({
      ticketId: ticketPhotos.ticketId,
      storageKey: ticketPhotos.storageKey,
      photoType: ticketPhotos.photoType,
      isPublic: ticketPhotos.isPublic,
    })
    .from(ticketPhotos)
    .where(inArray(ticketPhotos.ticketId, ticketIds))
    .orderBy(asc(ticketPhotos.createdAt));

  // Group photos by ticketId
  const photosByTicket = new Map<string, typeof photos>();
  for (const p of photos) {
    if (!photosByTicket.has(p.ticketId)) photosByTicket.set(p.ticketId, []);
    photosByTicket.get(p.ticketId)!.push(p);
  }

  const zip = new JSZip();
  for (const ticket of rows) {
    const folderName = `ticket-${String(ticket.ticketNumber).padStart(4, "0")}`;
    const folder = zip.folder(folderName)!;

    // PDF scheda ticket
    const pdf = await buildPdf(ticket, orgName, orgAddress);
    folder.file(`${folderName}.pdf`, pdf);

    // Foto allegate
    const ticketPhotosData = photosByTicket.get(ticket.id) ?? [];
    const typeCounters: Record<string, number> = {};
    for (const photo of ticketPhotosData) {
      const ext = photo.storageKey.split(".").pop() ?? "jpg";
      const type = photo.photoType ?? "foto";
      typeCounters[type] = (typeCounters[type] ?? 0) + 1;
      const photoName = `${type}-${typeCounters[type]}.${ext}`;
      const buffer = await getObjectBuffer(photo.storageKey, photo.isPublic ?? false);
      if (buffer) folder.file(photoName, buffer);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const zipName = year ? `ticket-${year}.zip` : "ticket-archivio.zip";

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
    },
  });
}
