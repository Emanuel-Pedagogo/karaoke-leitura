import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  averageWcpm,
  calculateSessionMetrics,
  karaokeSpeedHint,
  METRIC_WCPM_SHORT,
  suggestKaraokeSpeed,
  type KaraokeSpeedSuggestion,
  type TextDifficultyLevel,
} from "@karaoke/shared";
import { Card } from "@/components/Card";
import { KaraokeReader } from "@/components/KaraokeReader";
import {
  VoiceAnalysisPanel,
  type AiEvaluationPayload,
} from "@/components/VoiceAnalysisPanel";
import { useReadingRecorder } from "@/hooks/useReadingRecorder";
import {
  fetchPrivacyStatus,
  fetchStudentProfile,
  fetchText,
  saveReadingSession,
  type ReadingText,
} from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

type Phase = "ready" | "reading" | "analyzing" | "done";

export default function ReadingScreen() {
  const router = useRouter();
  const { textId } = useLocalSearchParams<{ textId: string }>();
  const [text, setText] = useState<ReadingText | null>(null);
  const [studentId, setStudentId] = useState<string | undefined>();
  const [studentName, setStudentName] = useState("Estudante");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [speed, setSpeed] = useState(1);
  const [speedHint, setSpeedHint] = useState<KaraokeSpeedSuggestion | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AiEvaluationPayload | null>(null);
  const [metrics, setMetrics] = useState<ReturnType<
    typeof calculateSessionMetrics
  > | null>(null);
  const [hasVoiceConsent, setHasVoiceConsent] = useState(false);
  const finishStartedRef = useRef(false);
  const {
    isRecording,
    recordingUri,
    start: startRecording,
    stop: stopRecording,
    reset: resetRecording,
  } = useReadingRecorder();
  const startRef = useRef<number | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    async function loadScreenData() {
      if (!textId) return;
      setLoading(true);
      setError(null);
      try {
        const [textData, studentData, privacy] = await Promise.all([
          fetchText(textId),
          fetchStudentProfile(),
          fetchPrivacyStatus().catch(() => ({
            needsPrivacy: false,
            hasVoiceConsent: false,
          })),
        ]);
        setText(textData);
        setStudentId(studentData?.id);
        setStudentName(studentData?.name ?? "Estudante");
        setHasVoiceConsent(privacy.hasVoiceConsent);

        const avgWcpm = averageWcpm(
          studentData?.recentSessions.map((s) => s.wcpm) ?? [],
        );
        const suggestion = suggestKaraokeSpeed(
          avgWcpm,
          textData.difficulty as TextDifficultyLevel,
        );
        setSpeed(suggestion.speed);
        setSpeedHint(suggestion);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar a leitura",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadScreenData();
  }, [textId]);

  const handleStart = async () => {
    if (!hasVoiceConsent) return;
    startRef.current = Date.now();
    finishStartedRef.current = false;
    setAnalysisError(null);
    setAiFeedback(null);
    resetRecording();
    await startRecording();
    setPhase("reading");
    setIsPlaying(true);
  };

  const handleComplete = useCallback(async () => {
    setIsPlaying(false);
    if (startRef.current) {
      durationRef.current = Math.round((Date.now() - startRef.current) / 1000);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (isRecording) {
      await stopRecording();
    }
    setPhase("analyzing");
  }, [isRecording, speed, stopRecording]);

  const saveAfterAi = useCallback(
    async (payload: AiEvaluationPayload) => {
      if (!text || finishStartedRef.current) return;
      finishStartedRef.current = true;

      const counts = {
        omissions: payload.omissions,
        substitutions: payload.substitutions,
        hesitations: payload.hesitations,
      };
      const duration = Math.max(1, durationRef.current);
      const result = calculateSessionMetrics({
        wordCount: text.wordCount,
        durationSeconds: duration,
        ...counts,
        prosodyScore: payload.prosodyScore,
      });
      setMetrics(result);
      setPhase("done");

      if (studentId) {
        try {
          await saveReadingSession({
            studentId,
            textId: text.id,
            durationSeconds: duration,
            speedMultiplier: speed,
            ...counts,
            prosodyScore: payload.prosodyScore,
            spokenTranscript: payload.spokenTranscript,
            asrSource: "gemini",
            ...result,
          });
        } catch (saveError) {
          setError(
            saveError instanceof Error
              ? saveError.message
              : "Erro ao salvar a sessão",
          );
        }
      }
    },
    [speed, studentId, text],
  );

  const handleTryAgain = () => {
    finishStartedRef.current = false;
    resetRecording();
    setPhase("ready");
    setMetrics(null);
    setAiFeedback(null);
    setAnalysisError(null);
    setAttemptKey((k) => k + 1);
    durationRef.current = 0;
    startRef.current = null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !text) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  if (!text) return null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{text.title}</Text>
          <Text style={styles.subtitle}>{studentName}</Text>
        </View>
        {phase === "ready" || phase === "reading" ? (
          <View style={styles.speedBlock}>
            <Text style={styles.speedLabel}>Velocidade: {speed.toFixed(1)}×</Text>
            <Slider
              style={styles.speedSlider}
              minimumValue={0.5}
              maximumValue={2}
              step={0.1}
              value={speed}
              onValueChange={setSpeed}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        ) : null}
      </View>

      <Card style={styles.readerCard}>
        {phase === "reading" && isRecording ? (
          <Text style={styles.recordingHint}>🔴 Gravando sua leitura…</Text>
        ) : null}
        <KaraokeReader
          key={attemptKey}
          content={text.content}
          speed={speed}
          isPlaying={isPlaying}
          runKey={attemptKey}
          onComplete={() => void handleComplete()}
        />
      </Card>

      {phase === "ready" ? (
        <View style={styles.readyBlock}>
          {speedHint ? (
            <Text style={styles.speedHintText}>{karaokeSpeedHint(speedHint)}</Text>
          ) : null}
          {hasVoiceConsent ? (
            <Text style={styles.voiceHint}>
              Leia em voz alta: o microfone grava e a IA avalia ao terminar.
            </Text>
          ) : (
            <Text style={styles.voiceHint}>
              Autorize o microfone em Privacidade na tela inicial para usar a
              avaliação por IA.
            </Text>
          )}
          <Pressable
            onPress={() => void handleStart()}
            disabled={!hasVoiceConsent}
            style={[styles.primaryButton, !hasVoiceConsent && styles.disabled]}
          >
            <Text style={styles.primaryButtonText}>Iniciar leitura</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === "analyzing" ? (
        <Card>
          {recordingUri ? (
            <VoiceAnalysisPanel
              key={attemptKey}
              textId={text.id}
              recordingUri={recordingUri}
              attemptKey={attemptKey}
              onSuccess={(payload) => {
                setAiFeedback(payload);
                void saveAfterAi(payload);
              }}
              onError={setAnalysisError}
            />
          ) : (
            <Text style={styles.voiceHint}>Finalizando gravação…</Text>
          )}
          {analysisError ? (
            <Pressable
              onPress={handleTryAgain}
              style={[styles.secondaryButton, { marginTop: spacing.md }]}
            >
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {phase === "done" && metrics ? (
        <Card style={styles.resultCard}>
          <Text style={styles.resultEmoji}>Leitura concluída!</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Precisão</Text>
              <Text style={styles.metricValue}>{metrics.accuracyPct}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{METRIC_WCPM_SHORT}</Text>
              <Text style={styles.metricValue}>{metrics.wcpm}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pontuação</Text>
              <Text style={[styles.metricValue, styles.metricAccent]}>
                {metrics.score}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>XP ganho</Text>
              <Text style={[styles.metricValue, styles.metricPrimary]}>
                +{metrics.xpEarned}
              </Text>
            </View>
          </View>
          {aiFeedback ? (
            <Text style={styles.voiceHint}>{aiFeedback.feedback.summary}</Text>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable onPress={handleTryAgain} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Voltar ao início</Text>
          </Pressable>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  speedBlock: {
    alignSelf: "flex-start",
  },
  speedLabel: {
    fontSize: 14,
    color: colors.foreground,
  },
  speedSlider: {
    width: 160,
    marginTop: spacing.xs,
  },
  readerCard: {
    minHeight: 220,
    justifyContent: "center",
    gap: spacing.sm,
  },
  recordingHint: {
    textAlign: "center",
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  readyBlock: { gap: spacing.md },
  checkRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  checkMark: { fontSize: 18 },
  checkLabel: { flex: 1, fontSize: 14, color: colors.foreground },
  voiceHint: { fontSize: 13, color: colors.muted },
  speedHintText: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  successButton: {
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "rgba(22, 163, 74, 0.3)",
    gap: spacing.md,
  },
  resultEmoji: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricItem: {
    width: "47%",
    alignItems: "center",
    gap: spacing.xs,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },
  metricAccent: {
    color: colors.accent,
  },
  metricPrimary: {
    color: colors.primary,
  },
  errorText: {
    color: "#991b1b",
    textAlign: "center",
  },
});
