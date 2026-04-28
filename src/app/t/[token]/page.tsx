import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations, stores, ticketPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Wrench, CheckCircle2, Clock } from "lucide-react";
import { getPublicUrl } from "@/lib/storage";

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [ticket] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      faultDescription: tickets.faultDescription,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      customerName: customers.name,
      statusName: ticketStatuses.name,
      statusColor: ticketStatuses.color,
      isFinal: ticketStatuses.isFinal,
      orgId: tickets.organizationId,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!ticket) notFound();

  const [org] = await db
    .select({
      name: organizations.name,
      phone: organizations.phone,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
      brandingLogoUrl: organizations.brandingLogoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, ticket.orgId))
    .limit(1);

  const photos = await db
    .select({ id: ticketPhotos.id, storageKey: ticketPhotos.storageKey, photoType: ticketPhotos.photoType })
    .from(ticketPhotos)
    .where(eq(ticketPhotos.ticketId, ticket.id))
    .then((rows) => rows.filter((r) => r.storageKey));

  const primaryColor = org?.brandingPrimaryColor ?? "#0D8F7A";
  const device = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "Dispositivo";

  const photoUrls = await Promise.all(
    photos.map(async (p) => ({
      ...p,
      url: await getPublicUrl(p.storageKey),
    })),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="flex h-14 items-center justify-between px-5 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          {org?.brandingLogoUrl ? (
            <img src={org.brandingLogoUrl} alt={org?.name} className="h-7 w-auto object-contain" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="font-semibold">{org?.name ?? "Centro Riparazioni"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 p-4 pt-6">
        {/* Status card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Ticket #{String(ticket.ticketNumber).padStart(4, "0")} · {device}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: (ticket.statusColor ?? primaryColor) + "20" }}
            >
              {ticket.isFinal ? (
                <CheckCircle2 className="h-6 w-6" style={{ color: ticket.statusColor ?? primaryColor }} />
              ) : (
                <Clock className="h-6 w-6" style={{ color: ticket.statusColor ?? primaryColor }} />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stato attuale
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: ticket.statusColor ?? primaryColor }}
              >
                {ticket.statusName ?? "In lavorazione"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {ticket.isFinal
              ? "La tua riparazione è completata. Puoi venire a ritirare il dispositivo."
              : "Il tuo dispositivo è in lavorazione. Ti avviseremo non appena sarà pronto."}
          </p>
        </div>

        {/* Foto pubbliche */}
        {photoUrls.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-medium text-foreground">Foto</p>
            <div className="grid grid-cols-2 gap-2">
              {photoUrls.map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={p.url}
                    alt="Foto riparazione"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                    {p.photoType === "pre" ? "Prima" : "Dopo"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contatti */}
        {org?.phone && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Per informazioni:{" "}
              <a
                href={`tel:${org.phone}`}
                className="font-medium text-foreground underline"
                style={{ color: primaryColor }}
              >
                {org.phone}
              </a>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Gestito con{" "}
          <a href="https://my-repair.it" className="underline">
            my-repair.it
          </a>
        </p>
      </main>
    </div>
  );
}
