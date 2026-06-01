import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Audio } from "expo-av";
import {
  evaluateAudioWithGemini,
  fetchPrivacyStatus,
} from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

type Alignment = {
  omissions: number;
  substitutions: number;
  hesitations: number;
};

type Props = {
  textId: string;
  /** Áudio gravado durante a leitura (recomendado) */
  recordingUri?: string | null;
  /** Analisar automaticamente ao entrar na tela de avaliação */
  autoAnalyze?: boolean;
  onApply: (counts: Alignment, spokenTranscript?: string) => void;
};

export function VoiceAnalysisPanel({
  textId,
  recordingUri,
  autoAnalyze = false,
  onApply,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastAlignment, setLastAlignment] = useState<Alignment | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(
    null,
  );
  const [manualRecording, setManualRecording] = useState<Audio.Recording | null>(
    null,
  );
  const autoRanRef = useRef(false);

  async function analyzeUri(uri: string) {
    setLoading(true);
    setMessage(null);
    try {
      const privacy = await fetchPrivacyStatus();
      if (!privacy.hasVoiceConsent) {
        Alert.alert(
          "LGPD",
          "Autorize o microfone em Privacidade (menu inicial) para usar a IA.",
        );
        return;
      }

      const result = await evaluateAudioWithGemini(uri, textId);
      if (!result.success || !result.evaluation) {
        throw new Error("A IA não retornou uma avaliação válida.");
      }

      const alignment = {
        omissions: result.evaluation.metrics.omissions ?? 0,
        substitutions: result.evaluation.metrics.substitutions ?? 0,
        hesitations: result.evaluation.metrics.hesitations ?? 0,
      };
      setLastAlignment(alignment);
      setTranscriptPreview(
        result.evaluation.spokenTranscript?.slice(0, 120) ?? null,
      );
      setMessage(
        `Gemini encontrou ${result.evaluation.errors?.length ?? 0} erro(s). Toque em "Usar sugestão" abaixo.`,
      );
      onApply(alignment, result.evaluation.spokenTranscript);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível analisar com o Gemini";
      setMessage(msg);
      Alert.alert("Erro na análise", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoAnalyze || !recordingUri || autoRanRef.current) return;
    autoRanRef.current = true;
    void analyzeUri(recordingUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na primeira vez com URI
  }, [autoAnalyze, recordingUri]);

  async function startManualRecording() {
    const privacy = await fetchPrivacyStatus();
    if (!privacy.hasVoiceConsent) {
      Alert.alert(
        "LGPD",
        "Autorize o microfone na tela de consentimento (privacidade).",
      );
      return;
    }

    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setManualRecording(recording);
  }

  async function stopManualAndAnalyze() {
    if (!manualRecording) return;
    setLoading(true);
    try {
      await manualRecording.stopAndUnloadAsync();
      const uri = manualRecording.getURI();
      setManualRecording(null);
      if (!uri) throw new Error("Gravação vazia");
      await analyzeUri(uri);
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível gravar",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>🎤 Análise por voz (Gemini)</Text>

      {recordingUri && !autoAnalyze ? (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => void analyzeUri(recordingUri)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.secondaryText}>
              Analisar gravação da leitura
            </Text>
          )}
        </Pressable>
      ) : null}

      {loading && autoAnalyze ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Analisando com IA…</Text>
        </View>
      ) : null}

      {!recordingUri && !loading ? (
        <Pressable
          style={styles.outlineButton}
          onPress={() => {
            if (manualRecording) void stopManualAndAnalyze();
            else void startManualRecording();
          }}
          disabled={loading}
        >
          <Text style={styles.outlineText}>
            {manualRecording
              ? "⏹ Parar e analisar voz"
              : "🎤 Gravar leitura agora (IA)"}
          </Text>
        </Pressable>
      ) : null}

      {transcriptPreview ? (
        <Text style={styles.transcript} numberOfLines={3}>
          Ouvido: {transcriptPreview}
          {transcriptPreview.length >= 120 ? "…" : ""}
        </Text>
      ) : null}

      {lastAlignment ? (
        <View style={styles.suggestion}>
          <Text style={styles.suggestionText}>
            Sugestão: {lastAlignment.omissions} omissões ·{" "}
            {lastAlignment.substitutions} substituições ·{" "}
            {lastAlignment.hesitations} hesitações
          </Text>
          <Pressable
            style={styles.applyButton}
            onPress={() => onApply(lastAlignment, transcriptPreview ?? undefined)}
          >
            <Text style={styles.applyText}>Usar sugestão nos contadores</Text>
          </Pressable>
        </View>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  muted: { fontSize: 13, color: colors.muted },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  outlineText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  secondaryText: { color: colors.primary, fontWeight: "600" },
  transcript: { fontSize: 12, color: colors.muted },
  suggestion: { gap: spacing.sm },
  suggestionText: { fontSize: 12, color: colors.foreground },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  message: { fontSize: 12, color: colors.muted },
});
