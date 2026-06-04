import NetInfo from "@react-native-community/netinfo";

/** True when the device cannot reach the internet (airplane mode, no Wi‑Fi, etc.). */
export async function isDeviceOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) return true;
  if (state.isInternetReachable === false) return true;
  return false;
}

export function isLikelyNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("network request failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("internet") ||
    lower.includes("conexão") ||
    lower.includes("conexao") ||
    lower.includes("offline") ||
    lower.includes("enotfound") ||
    lower.includes("unable to resolve host")
  );
}
