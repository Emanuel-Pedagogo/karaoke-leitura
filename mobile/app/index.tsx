import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { fetchPrivacyStatus } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/session";
import { colors } from "@/lib/theme";

/**
 * Rota inicial: decide welcome, consentimento ou início — sem mostrar a home antes.
 */
export default function BootstrapScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      const token = await getAuthToken();
      if (!token) {
        if (!cancelled) router.replace("/welcome");
        return;
      }

      try {
        const privacy = await fetchPrivacyStatus();
        if (cancelled) return;

        if (privacy.needsPrivacy) {
          router.replace("/consentimento");
          return;
        }

        router.replace("/home");
      } catch (error) {
        if (cancelled) return;
        if (
          error instanceof Error &&
          error.message === "AUTH_REQUIRED"
        ) {
          await clearAuthToken();
        }
        router.replace("/welcome");
      }
    }

    void resolveRoute();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
