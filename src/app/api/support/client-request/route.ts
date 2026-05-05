import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerContracts, supportInterventions, customers, memberships, users } from "@/db/schema";
import { eq, and, max } from "drizzle-orm";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";
import { sendNewClientRequestEmail } from "@/lib/email";

const APP_URL = process.env.APP_URL ?? "https://app.my-repair.it";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = formData.get("token");
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const isUrgent = formData.get("isUrgent") === "true";

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Titolo obbligatorio" }, { status: 400 });
  }

  // Verifica contratto dal token
  const [contract] = await db
    .select({
      id: customerContracts.id,
      organizationId: customerContracts.organizationId,
      customerId: customerContracts.customerId,
      contractNumber: customerContracts.contractNumber,
      status: customerContracts.status,
      endDate: customerContracts.endDate,
      clientPortalToken: customerContracts.clientPortalToken,
    })
    .from(customerContracts)
    .where(eq(customerContracts.clientPortalToken, token))
    .limit(1);

  if (!contract) {
    return NextResponse.json({ error: "Contratto non trovato" }, { status: 404 });
  }

  if (
    contract.status !== "active" ||
    new Date(contract.endDate) < new Date()
  ) {
    return NextResponse.json(
      { error: "Il contratto non è attivo o è scaduto" },
      { status: 403 },
    );
  }

  // Numero sequenziale intervento
  const [maxRow] = await db
    .select({ max: max(supportInterventions.interventionNumber) })
    .from(supportInterventions)
    .where(eq(supportInterventions.organizationId, contract.organizationId));

  let nextSeq = 1;
  if (maxRow?.max) {
    const numeric = parseInt(maxRow.max.replace(/\D/g, ""), 10);
    if (!isNaN(numeric)) nextSeq = numeric + 1;
  }
  const interventionNumber = `I-${String(nextSeq).padStart(4, "0")}`;

  // Upload foto (max 3)
  const photoFiles = formData.getAll("photos") as File[];
  const uploadedKeys: string[] = [];

  for (const file of photoFiles.slice(0, 3)) {
    if (!(file instanceof File) || file.size === 0) continue;
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `interventions/${contract.id}/${randomUUID()}.${ext}`;
    const { url } = await getPresignedUploadUrl(
      key,
      false,
      file.type || "image/jpeg",
    );
    const buf = await file.arrayBuffer();
    await fetch(url, {
      method: "PUT",
      body: buf,
      headers: { "Content-Type": file.type || "image/jpeg" },
    });
    uploadedKeys.push(key);
  }

  // Crea intervento
  const [intervention] = await db
    .insert(supportInterventions)
    .values({
      organizationId: contract.organizationId,
      contractId: contract.id,
      interventionNumber,
      title,
      description: description || null,
      type: "other",
      isUrgent,
      rawMinutes: 0,
      billableMinutes: 0,
      technicianName: null,
      status: "open",
      openedBy: "client",
      photos: uploadedKeys,
    })
    .returning({ id: supportInterventions.id });

  // Notifica email al owner dell'org
  try {
    const [customerRow] = await db
      .select({ name: customers.name })
      .from(customers)
      .where(eq(customers.id, contract.customerId))
      .limit(1);

    const ownerRows = await db
      .select({ email: users.email })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(
        and(
          eq(memberships.organizationId, contract.organizationId),
          eq(memberships.role, "owner"),
        ),
      )
      .limit(1);

    if (ownerRows[0]?.email) {
      const contractUrl = `${APP_URL}/support/contracts/${contract.id}`;
      await sendNewClientRequestEmail({
        to: ownerRows[0].email,
        customerName: customerRow?.name ?? "Cliente",
        contractNumber: contract.contractNumber,
        title: title,
        portalUrl: contractUrl,
      });
    }
  } catch {
    // Notifica non bloccante
  }

  return NextResponse.json({
    ok: true,
    interventionId: intervention.id,
    interventionNumber,
  });
}
