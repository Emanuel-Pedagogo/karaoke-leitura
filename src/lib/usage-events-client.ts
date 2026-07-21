"use client";

export type ClientUsageEventType =
  | "READING_STARTED"
  | "OFFLINE_SYNC"
  | "APP_ERROR";

// Telemetria do piloto nunca pode travar a experiência — falha é silenciosa.
export function trackClientEvent(
  type: ClientUsageEventType,
  metadata: Record<string, unknown> = {},
): void {
  try {
    void fetch("/api/usage-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // nunca propagar erro de telemetria
  }
}
