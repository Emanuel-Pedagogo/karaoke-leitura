import Constants from "expo-constants";
import { API_URL } from "./config";
import { fetchWithTimeout } from "./fetch-timeout";
import { isDeviceOffline } from "./network";
import { getAuthToken } from "./session";

export type TelemetryEventType =
  | "READING_STARTED"
  | "OFFLINE_SYNC"
  | "APP_ERROR";

function appVersion() {
  const version = Constants.expoConfig?.version ?? "dev";
  const code = Constants.expoConfig?.android?.versionCode;
  return code ? `${version} (${code})` : version;
}

// Telemetria do piloto nunca pode travar o fluxo do aluno — falha é silenciosa.
export async function trackEvent(
  type: TelemetryEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    if (await isDeviceOffline()) return;

    const token = await getAuthToken();
    await fetchWithTimeout(
      `${API_URL}/api/usage-events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          metadata,
          appVersion: appVersion(),
          source: "MOBILE",
        }),
      },
      8000,
    );
  } catch (error) {
    console.warn("[telemetria] falha ao registrar evento", type, error);
  }
}
