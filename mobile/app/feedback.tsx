import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  PILOT_FEEDBACK_CATEGORIES,
  PILOT_INTERNET_QUALITY,
  PILOT_TRI_STATE,
  type PilotFeedbackCategory,
  type PilotInternetQuality,
  type PilotTriState,
} from "@karaoke/shared";
import { AppVersion } from "@/components/AppVersion";
import { submitPilotFeedback } from "@/lib/api";
import { appVersionLabel } from "@/lib/app-version";
import { isDeviceOffline } from "@/lib/network";
import { colors, radius, spacing } from "@/lib/theme";

export default function FeedbackScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<PilotFeedbackCategory | null>(null);
  const [internetQuality, setInternetQuality] =
    useState<PilotInternetQuality | null>(null);
  const [aiWorked, setAiWorked] = useState<PilotTriState | null>(null);
  const [readingWorked, setReadingWorked] = useState<PilotTriState | null>(null);
  const [message, setMessage] = useState("");
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const version = appVersionLabel();

  useEffect(() => {
    void isDeviceOffline().then(setOffline);
  }, []);

  async function handleSubmit() {
    if (!category) {
      setError("Selecione uma categoria.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Descreva o que aconteceu com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitPilotFeedback({
        category,
        message: message.trim(),
        internetQuality: internetQuality ?? undefined,
        aiWorked: aiWorked ?? undefined,
        readingWorked: readingWorked ?? undefined,
        appVersion: version,
        screen: "/feedback",
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>
          Obrigado! Seu feedback ajuda a melhorar o piloto.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace("/home")}>
          <Text style={styles.buttonText}>Voltar ao início</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Feedback do piloto</Text>
      <Text style={styles.muted}>
        Ajude a melhorar o Karaokê de Leitura durante o piloto fechado. Leva
        menos de 2 minutos.
      </Text>

      {offline ? (
        <View style={styles.offlineBox}>
          <Text style={styles.offlineText}>
            Conecte-se à internet para enviar feedback.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Categoria</Text>
      {PILOT_FEEDBACK_CATEGORIES.map((item) => (
        <Pressable
          key={item.value}
          style={[
            styles.option,
            category === item.value && styles.optionSelected,
          ]}
          onPress={() => setCategory(item.value)}
        >
          <Text
            style={[
              styles.optionText,
              category === item.value && styles.optionTextSelected,
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.label}>Como estava a internet?</Text>
      <View style={styles.chipRow}>
        {PILOT_INTERNET_QUALITY.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.chip,
              internetQuality === item.value && styles.chipSelected,
            ]}
            onPress={() =>
              setInternetQuality(
                internetQuality === item.value ? null : item.value,
              )
            }
          >
            <Text
              style={[
                styles.chipText,
                internetQuality === item.value && styles.chipTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>A IA funcionou?</Text>
      <View style={styles.chipRow}>
        {PILOT_TRI_STATE.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.chip, aiWorked === item.value && styles.chipSelected]}
            onPress={() =>
              setAiWorked(aiWorked === item.value ? null : item.value)
            }
          >
            <Text
              style={[
                styles.chipText,
                aiWorked === item.value && styles.chipTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>A leitura funcionou?</Text>
      <View style={styles.chipRow}>
        {PILOT_TRI_STATE.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.chip,
              readingWorked === item.value && styles.chipSelected,
            ]}
            onPress={() =>
              setReadingWorked(readingWorked === item.value ? null : item.value)
            }
          >
            <Text
              style={[
                styles.chipText,
                readingWorked === item.value && styles.chipTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Conte o que aconteceu</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={5}
        maxLength={2000}
        value={message}
        onChangeText={setMessage}
        placeholder="Ex.: o login demorou, a contagem apareceu mas o microfone não gravou…"
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
      />

      <Text style={styles.versionHint}>{version}</Text>

      <Pressable
        style={[styles.button, (loading || offline) && styles.buttonDisabled]}
        onPress={() => void handleSubmit()}
        disabled={loading || offline}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar feedback</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppVersion />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  muted: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff",
  },
  optionText: { color: colors.foreground, fontSize: 15 },
  optionTextSelected: { color: colors.primary, fontWeight: "600" },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: { color: colors.foreground, fontSize: 14 },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 120,
    color: colors.foreground,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  versionHint: { fontSize: 12, color: colors.muted, marginBottom: spacing.md },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#b91c1c", marginTop: spacing.md, textAlign: "center" },
  offlineBox: {
    backgroundColor: "#fef3c7",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offlineText: { color: "#92400e", fontSize: 14, textAlign: "center" },
  successIcon: { fontSize: 48, marginBottom: spacing.md },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});
