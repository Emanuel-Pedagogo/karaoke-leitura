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
import { calculateSessionMetrics } from "@karaoke/shared";
import { Card } from "@/components/Card";
import { KaraokeReader } from "@/components/KaraokeReader";
import { ManualEvaluationPanel } from "@/components/ManualEvaluationPanel";
import { VoiceAnalyzeButton } from "@/components/VoiceAnalyzeButton";
import {
  fetchStudentProfile,
  fetchText,
  saveReadingSession,
  type ReadingText,
} from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

type Phase = "ready" | "reading" | "evaluate" | "done";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [counts, setCounts] = useState({
    omissions: 0,
    substitutions: 0,
    hesitations: 0,
  });
  const [prosody, setProsody] = useState(3);
  const [metrics, setMetrics] = useState<ReturnType<
    typeof calculateSessionMetrics
  > | null>(null);
  const startRef = useRef<number | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    async function loadScreenData() {
      if (!textId) return;
      setLoading(true);
      setError(null);
      try {
        const [textData, studentData] = await Promise.all([
          fetchText(textId),
          fetchStudentProfile(),
        ]);
        setText(textData);
        setStudentId(studentData?.id);
        setStudentName(studentData?.name ?? "Estudante");
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

  const handleStart = () => {
    startRef.current = Date.now();
    setPhase("reading");
    setIsPlaying(true);
  };

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    if (startRef.current) {
      durationRef.current = Math.round((Date.now() - startRef.current) / 1000);
    }
    setPhase("evaluate");
  }, []);

  const handleFinish = async () => {
    if (!text) return;

    const duration = Math.max(1, durationRef.current);
    const result = calculateSessionMetrics({
      wordCount: text.wordCount,
      durationSeconds: duration,
      ...counts,
      prosodyScore: prosody,
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
          prosodyScore: prosody,
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
  };

  useEffect(() => {
    if (phase !== "reading") setIsPlaying(false);
  }, [phase]);

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
        {phase === "reading" ? (
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
        <KaraokeReader
          content={text.content}
          speed={speed}
          isPlaying={isPlaying}
          onComplete={handleComplete}
        />
      </Card>

      {phase === "ready" ? (
        <Pressable onPress={handleStart} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Iniciar leitura</Text>
        </Pressable>
      ) : null}

      {phase === "evaluate" ? (
        <Card>
          <VoiceAnalyzeButton
            textId={text.id}
            onApply={(a) => setCounts(a)}
          />
          <View style={{ height: spacing.md }} />
          <ManualEvaluationPanel
            counts={counts}
            prosodyScore={prosody}
            onChange={(nextCounts, nextProsody) => {
              setCounts(nextCounts);
              setProsody(nextProsody);
            }}
          />
          <Pressable onPress={() => void handleFinish()} style={styles.successButton}>
            <Text style={styles.primaryButtonText}>Concluir e ver resultado</Text>
          </Pressable>
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
              <Text style={styles.metricLabel}>WCPM</Text>
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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
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
