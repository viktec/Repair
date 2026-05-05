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

export function calcBillableMinutes(
  rawMinutes: number,
  type: string,
  snapshot: PackageSnapshot,
  isUrgent: boolean,
): number {
  let billable = rawMinutes;
  if (type === "phone") billable = roundUp(rawMinutes, snapshot.phoneRoundingMinutes);
  else if (type === "remote") billable = roundUp(rawMinutes, snapshot.remoteRoundingMinutes);
  else if (type === "email") billable = roundUp(rawMinutes, snapshot.emailRoundingMinutes);
  // onsite / lab / other: tempo effettivo senza arrotondamento
  billable += (snapshot.callFeeMinutes ?? 0);
  if (isUrgent && snapshot.urgencySurchargePercent > 0) {
    billable = Math.ceil(billable * (1 + snapshot.urgencySurchargePercent / 100));
  }
  return billable;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ore`;
  return `${h} ore ${m} min`;
}
