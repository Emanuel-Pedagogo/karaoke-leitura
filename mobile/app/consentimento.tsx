import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { submitPrivacyConsent } from "@/lib/api";
import { cachePrivacyStatus } from "@/lib/privacy-cache";
import { API_URL } from "@/lib/config";
import { clearAuthToken } from "@/lib/session";
import { colors, radius, spacing } from "@/lib/theme";

export default function ConsentimentoScreen() {
  const router = useRouter();
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptVoice, setAcceptVoice] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!acceptPrivacy) {
      setError("Aceite a política de privacidade para continuar.");
      return;
    }
    if (acceptVoice && !guardianConfirmed) {
      setError("Confirme a autorização do responsável para usar o microfone.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitPrivacyConsent({
        acceptPrivacy,
        acceptVoice,
        guardianConfirmed: acceptVoice ? guardianConfirmed : false,
      });
      await cachePrivacyStatus({
        needsPrivacy: false,
        hasVoiceConsent: acceptVoice,
      });
      router.replace("/home");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      if (
        message === "AUTH_REQUIRED" ||
        message.includes("Sessão inválida") ||
        message.includes("Não autorizado")
      ) {
        await clearAuthToken();
        router.replace("/welcome");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacidade (LGPD)</Text>
      <Text style={styles.muted}>
        A escola é a controladora dos seus dados. Leia a política antes de
        continuar.
      </Text>
      <Pressable
        onPress={() => Linking.openURL(`${API_URL}/privacidade`)}
        style={styles.link}
      >
        <Text style={styles.linkText}>Abrir política de privacidade</Text>
      </Pressable>

      <Pressable
        style={styles.checkRow}
        onPress={() => setAcceptPrivacy(!acceptPrivacy)}
      >
        <Text style={styles.check}>{acceptPrivacy ? "☑" : "☐"}</Text>
        <Text style={styles.checkLabel}>Aceito a política e o uso educacional dos meus dados</Text>
      </Pressable>

      <Pressable
        style={styles.checkRow}
        onPress={() => setAcceptVoice(!acceptVoice)}
      >
        <Text style={styles.check}>{acceptVoice ? "☑" : "☐"}</Text>
        <Text style={styles.checkLabel}>
          Opcional: autorizo microfone (transcrição; áudio não fica no servidor)
        </Text>
      </Pressable>

      {acceptVoice ? (
        <Pressable
          style={[styles.checkRow, styles.indent]}
          onPress={() => setGuardianConfirmed(!guardianConfirmed)}
        >
          <Text style={styles.check}>{guardianConfirmed ? "☑" : "☐"}</Text>
          <Text style={styles.checkLabel}>
            Sou responsável ou tenho autorização para menores
          </Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => void handleSubmit()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Salvando…" : "Continuar"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  muted: { fontSize: 14, color: colors.muted },
  link: { paddingVertical: spacing.sm },
  linkText: { color: colors.primary, fontWeight: "600" },
  checkRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  indent: { marginLeft: spacing.md },
  check: { fontSize: 18 },
  checkLabel: { flex: 1, fontSize: 14, color: colors.foreground },
  error: { color: "#991b1b" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
