export function roundUp(minutes: number, step: number): number {
  if (step <= 0 || minutes <= 0) return minutes;
  return Math.ceil(minutes / step) * step;
}

export type PackageSnapshot = {
  phoneRoundingMinutes: number;
  remoteRoundingMinutes: number;
  emailRoundingMinutes: number;
  callFeeMinutes: number;
  urgencySurchargePercent: number;
};

// Tipi per cui si applica il diritto di chiamata/connessione
const CALL_FEE_TYPES = ["phone", "remote", "email"];

export type BillableBreakdown = {
  raw: number;
  rounded: number;
  roundingStep: number;
  callFee: number;
  urgencyAdd: number;
  total: number;
};

export function calcBillableBreakdown(
  rawMinutes: number,
  type: string,
  snapshot: PackageSnapshot,
  isUrgent: boolean,
): BillableBreakdown {
  let rounded = rawMinutes;
  let roundingStep = 0;

  if (type === "phone") {
    roundingStep = snapshot.phoneRoundingMinutes;
    rounded = roundUp(rawMinutes, roundingStep);
  } else if (type === "remote") {
    roundingStep = snapshot.remoteRoundingMinutes;
    rounded = roundUp(rawMinutes, roundingStep);
  } else if (type === "email") {
    roundingStep = snapshot.emailRoundingMinutes;
    rounded = roundUp(rawMinutes, roundingStep);
  }

  // Diritto di chiamata solo per phone/remote/email
  const callFee = CALL_FEE_TYPES.includes(type) ? (snapshot.callFeeMinutes ?? 0) : 0;
  const afterCallFee = rounded + callFee;

  let urgencyAdd = 0;
  let total = afterCallFee;
  if (isUrgent && snapshot.urgencySurchargePercent > 0) {
    total = Math.ceil(afterCallFee * (1 + snapshot.urgencySurchargePercent / 100));
    urgencyAdd = total - afterCallFee;
  }

  return { raw: rawMinutes, rounded, roundingStep, callFee, urgencyAdd, total };
}

export function calcBillableMinutes(
  rawMinutes: number,
  type: string,
  snapshot: PackageSnapshot,
  isUrgent: boolean,
): number {
  return calcBillableBreakdown(rawMinutes, type, snapshot, isUrgent).total;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ore`;
  return `${h} ore ${m} min`;
}
