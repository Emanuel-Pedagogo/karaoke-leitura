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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  averageWcpm,
  calculateSessionMetrics,
  comboMultiplierFromStreak,
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
import {
  createClientSessionId,
  persistPendingReading,
} from "@/lib/offline-audio";
import { isDeviceOffline } from "@/lib/network";
import { hasClassSession } from "@/lib/class-session";
import { colors, radius, spacing } from "@/lib/theme";

type Phase = "ready" | "countdown" | "reading" | "analyzing" | "done";

export default function ReadingScreen() {
  const router = useRouter();
  const { textId, fresh } = useLocalSearchParams<{ textId: string; fresh?: string }>();
  const [text, setText] = useState<ReadingText | null>(null);
  const [studentId, setStudentId] = useState<string | undefined>();
  const [studentName, setStudentName] = useState("Estudante");
  const [studentComboStreak, setStudentComboStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState(3);
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
  const [savedOffline, setSavedOffline] = useState(false);
  const [classSession, setClassSession] = useState(false);
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
  const clientSessionIdRef = useRef(createClientSessionId());

  useEffect(() => {
    async function loadScreenData() {
      if (!textId) return;
      setLoading(true);
      setError(null);
      if (fresh) {
        finishStartedRef.current = false;
        resetRecording();
        setPhase("ready");
        setCountdown(3);
        setMetrics(null);
        setAiFeedback(null);
        setAnalysisError(null);
        setSavedOffline(false);
        setIsPlaying(false);
        setAttemptKey((k) => k + 1);
        durationRef.current = 0;
        startRef.current = null;
        clientSessionIdRef.current = createClientSessionId();
      }
      try {
        const [textData, studentData, privacy] = await Promise.all([
          fetchText(textId),
          fetchStudentProfile(),
          fetchPrivacyStatus(),
        ]);
        setText(textData);
        setStudentId(studentData?.id);
        setStudentName(studentData?.name ?? "Estudante");
        setStudentComboStreak(studentData?.comboStreak ?? 0);
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
  }, [textId, fresh, resetRecording]);

  useFocusEffect(
    useCallback(() => {
      void hasClassSession().then(setClassSession);
    }, []),
  );

  const beginReading = useCallback(async () => {
    startRef.current = Date.now();
    resetRecording();
    await startRecording();
    setPhase("reading");
    setIsPlaying(true);
  }, [resetRecording, startRecording]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      void beginReading();
      return;
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [beginReading, countdown, phase]);

  const handleStart = () => {
    if (!hasVoiceConsent) return;
    finishStartedRef.current = false;
    setAnalysisError(null);
    setAiFeedback(null);
    setError(null);
    setCountdown(3);
    setPhase("countdown");
  };

  const handleComplete = useCallback(async () => {
    setIsPlaying(false);
    if (startRef.current) {
      durationRef.current = Math.round((Date.now() - startRef.current) / 1000);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));

    let uri = recordingUri;
    if (isRecording) {
      uri = (await stopRecording()) ?? null;
    }

    if (!uri) {
      setError("Não foi possível finalizar a gravação. Tente novamente.");
      setPhase("ready");
      return;
    }

    if (!text) return;

    if (await isDeviceOffline()) {
      try {
        await persistPendingReading({
          uri,
          studentId,
          clientSessionId: clientSessionIdRef.current,
          textId: text.id,
          durationSeconds: durationRef.current,
          speedMultiplier: speed,
        });
        setSavedOffline(true);
        setPhase("done");
      } catch {
        setError("Erro ao salvar leitura offline.");
        setPhase("ready");
      }
      return;
    }

    setPhase("analyzing");
  }, [isRecording, recordingUri, speed, stopRecording, studentId, text]);

  const handleOfflineSave = useCallback(
    async (uri: string) => {
      if (!text) return;
      await persistPendingReading({
        uri,
        studentId,
        clientSessionId: clientSessionIdRef.current,
        textId: text.id,
        durationSeconds: durationRef.current,
        speedMultiplier: speed,
      });
      setSavedOffline(true);
      setPhase("done");
    },
    [studentId, text, speed],
  );

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
        comboMultiplier: comboMultiplierFromStreak(studentComboStreak),
      });
      setMetrics(result);
      setPhase("done");

      if (studentId) {
        try {
          await saveReadingSession({
            studentId,
            clientSessionId: clientSessionIdRef.current,
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
          if (recordingUri) {
            await persistPendingReading({
              uri: recordingUri,
              studentId,
              clientSessionId: clientSessionIdRef.current,
              textId: text.id,
              durationSeconds: duration,
              speedMultiplier: speed,
              evaluatedPayload: payload,
            });
            setSavedOffline(true);
          }
          setError(
            saveError instanceof Error
              ? `${saveError.message} A leitura foi guardada para sincronizar depois.`
              : "Erro ao salvar a sessão. A leitura foi guardada para sincronizar depois.",
          );
        }
      }
    },
    [recordingUri, speed, studentComboStreak, studentId, text],
  );

  const handleTryAgain = () => {
    finishStartedRef.current = false;
    resetRecording();
    setPhase("ready");
    setCountdown(3);
    setMetrics(null);
    setAiFeedback(null);
    setAnalysisError(null);
    setSavedOffline(false);
    setAttemptKey((k) => k + 1);
    durationRef.current = 0;
    startRef.current = null;
    clientSessionIdRef.current = createClientSessionId();
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
        {phase === "countdown" ? (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownText}>Prepare-se para ler em voz alta</Text>
          </View>
        ) : null}
        {phase === "reading" && isRecording ? (
          <Text style={styles.recordingHint}>🔴 Gravando sua leitura…</Text>
        ) : null}
        <KaraokeReader
          key={attemptKey}
          content={text.content}
          speed={speed}
          isPlaying={phase === "reading" && isPlaying}
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
              onOfflineSave={(uri) => handleOfflineSave(uri)}
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

      {phase === "done" && savedOffline && !metrics ? (
        <Card style={styles.resultCard}>
          <Text style={styles.resultEmoji}>Leitura salva!</Text>
          <Text style={styles.voiceHint}>
            Você está offline. Sua leitura foi salva localmente e será avaliada pela IA assim que você se conectar à internet.
          </Text>
          <Pressable onPress={() => router.replace("/home")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Voltar ao início</Text>
          </Pressable>
          {classSession ? (
            <Pressable
              onPress={() =>
                router.push(`/trocar-aluno?returnTo=${encodeURIComponent(`/leitura/${text.id}`)}`)
              }
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Próximo aluno</Text>
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
          {classSession ? (
            <Pressable
              onPress={() =>
                router.push(`/trocar-aluno?returnTo=${encodeURIComponent(`/leitura/${text.id}`)}`)
              }
              style={[styles.primaryButton, styles.nextStudentButton]}
            >
              <Text style={styles.primaryButtonText}>Próximo aluno</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.replace("/home")} style={classSession ? styles.secondaryButton : styles.primaryButton}>
            <Text style={classSession ? styles.secondaryButtonText : styles.primaryButtonText}>
              Voltar ao início
            </Text>
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
  countdownBox: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.primary,
  },
  countdownText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
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
  nextStudentButton: {
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
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
