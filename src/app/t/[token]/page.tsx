import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations, ticketPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Wrench, Phone, MapPin, PenLine } from "lucide-react";
import { getPublicUrl } from "@/lib/storage";
import { PublicPhotoGallery } from "./public-photo-gallery";

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [ticket] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      deviceImei: tickets.deviceImei,
      accessories: tickets.accessories,
      deviceCondition: tickets.deviceCondition,
      faultDescription: tickets.faultDescription,
      estimatedCost: tickets.estimatedCost,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      customerName: customers.name,
      statusName: ticketStatuses.name,
      statusColor: ticketStatuses.color,
      isFinal: ticketStatuses.isFinal,
      orgId: tickets.organizationId,
      customerPhone: customers.phone,
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
      address: organizations.address,
      city: organizations.city,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
      brandingLogoUrl: organizations.brandingLogoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, ticket.orgId))
    .limit(1);

  const allPhotos = await db
    .select({ id: ticketPhotos.id, storageKey: ticketPhotos.storageKey, photoType: ticketPhotos.photoType, isPublic: ticketPhotos.isPublic })
    .from(ticketPhotos)
    .where(eq(ticketPhotos.ticketId, ticket.id));

  const publicPhotos = allPhotos.filter((r) => r.isPublic && r.photoType !== "signature");
  const hasSigned = allPhotos.some((r) => r.photoType === "signature");

  const primaryColor = org?.brandingPrimaryColor ?? "#0D8F7A";
  const device = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "Dispositivo";

  const waLink = org?.phone
    ? `https://wa.me/${org.phone.replace(/\D/g, "")}`
    : null;

  const STATUS_MESSAGES: Record<string, string> = {
    "In attesa":      "Il tuo dispositivo è stato ricevuto e sarà preso in carico a breve.",
    "Diagnosi":       "Il tuo dispositivo è in fase di diagnosi. Ti informeremo sull'esito a breve.",
    "In riparazione": "La riparazione è in corso. Ti avviseremo non appena il dispositivo sarà pronto.",
    "Pronto":         "Il tuo dispositivo è pronto per il ritiro. Puoi passare a prenderlo quando vuoi.",
    "Consegnato":     "La riparazione è completata. Grazie per averci scelto!",
  };

  const statusMessage = ticket.statusName
    ? (STATUS_MESSAGES[ticket.statusName] ?? `Il tuo dispositivo è attualmente in stato: ${ticket.statusName}.`)
    : "Il tuo dispositivo è in lavorazione.";

  const updatedDate = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(ticket.updatedAt));

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header
        className="flex h-14 items-center justify-between px-5 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2.5">
          {org?.brandingLogoUrl ? (
            <img src={org.brandingLogoUrl} alt={org.name} className="h-7 w-auto object-contain" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="font-semibold">{org?.name ?? "Centro Riparazioni"}</span>
        </div>
        <span className="text-xs opacity-70">Tracking riparazione</span>
      </header>

      <main className="mx-auto max-w-md space-y-3 p-4 pt-5">

        {/* Stato principale */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ticket #{String(ticket.ticketNumber).padStart(4, "0")}</span>
            <span>Aggiornato {updatedDate}</span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: (ticket.statusColor ?? primaryColor) + "20" }}
            >
              {ticket.isFinal ? (
                <CheckCircle2 className="h-7 w-7" style={{ color: ticket.statusColor ?? primaryColor }} />
              ) : (
                <Clock className="h-7 w-7" style={{ color: ticket.statusColor ?? primaryColor }} />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stato</p>
              <p className="text-2xl font-bold" style={{ color: ticket.statusColor ?? primaryColor }}>
                {ticket.statusName ?? "In lavorazione"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{statusMessage}</p>

          {hasSigned && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <PenLine className="h-4 w-4 shrink-0" />
              <span className="font-medium">Accettazione firmata</span>
            </div>
          )}
        </div>

        {/* Riepilogo dispositivo */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">Riepilogo riparazione</p>
          <dl className="space-y-2 text-sm">
            <Row label="Dispositivo" value={device} />
            {ticket.deviceImei && <Row label="IMEI" value={ticket.deviceImei} />}
            <Row label="Problema segnalato" value={ticket.faultDescription} />
            {ticket.accessories && <Row label="Accessori consegnati" value={ticket.accessories} />}
            {ticket.deviceCondition && <Row label="Condizioni estetiche" value={ticket.deviceCondition} />}
            {ticket.estimatedCost != null && (
              <Row
                label="Preventivo"
                value={new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(ticket.estimatedCost / 100)}
              />
            )}
          </dl>
        </div>

        {/* Foto pubbliche */}
        <PublicPhotoGallery
          photos={publicPhotos.map((p) => ({
            id: p.id,
            url: getPublicUrl(p.storageKey),
            photoType: p.photoType,
          }))}
        />

        {/* Contatti */}
        {(org?.phone || org?.address || waLink) && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Contatti</p>
            <div className="space-y-2.5">
              {org?.phone && (
                <a
                  href={`tel:${org.phone}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: primaryColor + "15" }}
                  >
                    <Phone className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                  </div>
                  <span className="font-medium" style={{ color: primaryColor }}>{org.phone}</span>
                </a>
              )}

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span className="font-medium text-[#25D366]">Scrivici su WhatsApp</span>
                </a>
              )}

              {(org?.address || org?.city) && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: primaryColor + "15" }}
                  >
                    <MapPin className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                  </div>
                  <span>{[org.address, org.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Gestito con{" "}
          <a href="https://my-repair.it" className="underline">
            my-repair.it
          </a>
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
