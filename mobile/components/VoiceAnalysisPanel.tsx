import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  evaluateAudioWithGemini,
  fetchPrivacyStatus,
} from "@/lib/api";
import { formatApiError } from "@/lib/format-api-error";
import { isDeviceOffline, isLikelyNetworkError } from "@/lib/network";
import { colors, radius, spacing } from "@/lib/theme";

export type AiEvaluationPayload = {
  omissions: number;
  substitutions: number;
  hesitations: number;
  prosodyScore: number;
  spokenTranscript?: string;
  scores: {
    prosody: number;
    fluency: number;
    expression: number;
    pace: number;
    accuracy: number;
  };
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  metrics: {
    insertions?: number;
    selfCorrections?: number;
  };
  errorCount: number;
};

type Props = {
  textId: string;
  recordingUri?: string | null;
  attemptKey: number;
  autoAnalyze?: boolean;
  onSuccess: (payload: AiEvaluationPayload) => void;
  onError: (message: string) => void;
  onOfflineSave?: (uri: string) => Promise<void>;
};

const SCORE_LABELS: Record<string, string> = {
  prosody: "Prosódia",
  fluency: "Fluência",
  expression: "Expressão",
  pace: "Ritmo",
  accuracy: "Precisão",
};

export function VoiceAnalysisPanel({
  textId,
  recordingUri,
  attemptKey,
  autoAnalyze = true,
  onSuccess,
  onError,
  onOfflineSave,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<AiEvaluationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const ranRef = useRef(false);
  const retriedRef = useRef(false);

  useEffect(() => {
    ranRef.current = false;
    setPayload(null);
    setError(null);
    setIsOfflineSaved(false);
    retriedRef.current = false;
  }, [attemptKey]);

  function shouldRetryAnalysis(message: string) {
    const lower = message.toLowerCase();
    return (
      !lower.includes("api_key_invalid") &&
      !lower.includes("api key not valid") &&
      !lower.includes("consentimento") &&
      !lower.includes("autoriz")
    );
  }

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function saveOffline(uri: string) {
    if (!onOfflineSave) {
      throw new Error("Você está offline. Conecte-se à internet para avaliar a leitura.");
    }
    await onOfflineSave(uri);
    setIsOfflineSaved(true);
  }

  async function analyzeUri(uri: string) {
    setLoading(true);
    setError(null);
    try {
      if (await isDeviceOffline()) {
        await saveOffline(uri);
        return;
      }

      const privacy = await fetchPrivacyStatus();
      if (!privacy.hasVoiceConsent) {
        const msg =
          "Autorize o microfone em Privacidade (menu inicial) para usar a IA.";
        setError(msg);
        onError(msg);
        return;
      }

      const result = await evaluateAudioWithGemini(uri, textId);
      if (!result.success || !result.evaluation) {
        throw new Error("A IA não retornou uma avaliação válida.");
      }

      const ev = result.evaluation;
      const data: AiEvaluationPayload = {
        omissions: ev.metrics?.omissions ?? 0,
        substitutions: ev.metrics?.substitutions ?? 0,
        hesitations: ev.metrics?.hesitations ?? 0,
        prosodyScore: ev.scores?.prosody ?? 3,
        spokenTranscript: ev.spokenTranscript,
        scores: {
          prosody: ev.scores?.prosody ?? 3,
          fluency: ev.scores?.fluency ?? 3,
          expression: ev.scores?.expression ?? 3,
          pace: ev.scores?.pace ?? 3,
          accuracy: ev.scores?.accuracy ?? 3,
        },
        feedback: {
          summary:
            ev.feedback?.summary ??
            "Leitura analisada. Continue praticando!",
          strengths: ev.feedback?.strengths ?? [],
          improvements: ev.feedback?.improvements ?? [],
        },
        metrics: {
          insertions: ev.metrics?.insertions,
          selfCorrections: ev.metrics?.selfCorrections,
        },
        errorCount: ev.errors?.length ?? 0,
      };
      setPayload(data);
      onSuccess(data);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Não foi possível analisar com o Gemini";
      if (!retriedRef.current && shouldRetryAnalysis(raw)) {
        retriedRef.current = true;
        await wait(1200);
        await analyzeUri(uri);
        return;
      }
      if (onOfflineSave && isLikelyNetworkError(raw)) {
        try {
          await saveOffline(uri);
          return;
        } catch (offlineError) {
          const msg = formatApiError(
            offlineError instanceof Error
              ? offlineError.message
              : "Erro ao salvar leitura offline.",
          );
          setError(msg);
          onError(msg);
          return;
        }
      }
      const msg = formatApiError(raw);
      setError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoAnalyze || !recordingUri || ranRef.current) return;
    ranRef.current = true;
    void analyzeUri(recordingUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze, recordingUri, attemptKey]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>
            {retriedRef.current
              ? "A primeira tentativa falhou. Tentando novamente…"
              : "Analisando sua leitura com IA…"}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (isOfflineSaved) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Leitura salva!</Text>
        <Text style={styles.summary}>
          Você está offline. Sua leitura foi salva localmente e será avaliada pela IA assim que você se conectar à internet.
        </Text>
      </View>
    );
  }

  if (!payload) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Avaliação da IA</Text>
      <Text style={styles.summary}>{payload.feedback.summary}</Text>

      <View style={styles.scoreRow}>
        {Object.entries(SCORE_LABELS).map(([key, label]) => (
          <View key={key} style={styles.scoreChip}>
            <Text style={styles.scoreLabel}>{label}</Text>
            <Text style={styles.scoreValue}>
              {payload.scores[key as keyof typeof payload.scores]}/5
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.metrics}>
        Omissões {payload.omissions} · Substituições {payload.substitutions} ·
        Hesitações {payload.hesitations}
        {(payload.metrics.insertions ?? 0) > 0
          ? ` · Inserções ${payload.metrics.insertions}`
          : ""}
      </Text>

      {payload.feedback.strengths.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Pontos fortes</Text>
          {payload.feedback.strengths.map((s) => (
            <Text key={s} style={styles.bullet}>
              • {s}
            </Text>
          ))}
        </View>
      ) : null}

      {payload.feedback.improvements.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Para praticar</Text>
          {payload.feedback.improvements.map((s) => (
            <Text key={s} style={styles.bullet}>
              • {s}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  summary: { fontSize: 14, color: colors.foreground },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  muted: { fontSize: 13, color: colors.muted },
  errorText: { fontSize: 13, color: "#991b1b" },
  scoreRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  scoreChip: {
    backgroundColor: colors.highlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 72,
    alignItems: "center",
  },
  scoreLabel: { fontSize: 10, color: colors.muted },
  scoreValue: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  metrics: { fontSize: 12, color: colors.muted },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  bullet: { fontSize: 12, color: colors.foreground },
});
