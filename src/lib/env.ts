export function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export const squareEnabled = () => Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY);

/** Volunteer addresses that get a note on every paid order. Comma-separated. Empty = no notifications. */
export const notifyEmails = (): string[] =>
  (process.env.NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
