import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { DIFFICULTY_LABELS } from "@karaoke/shared";
import { Card } from "@/components/Card";
import {
  fetchPrivacyStatus,
  fetchStudentProfile,
  fetchTexts,
  type ReadingTextSummary,
  type StudentProfile,
} from "@/lib/api";
import { API_URL } from "@/lib/config";
import { colors, radius, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [texts, setTexts] = useState<ReadingTextSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const privacy = await fetchPrivacyStatus();
      if (privacy.needsPrivacy) {
        router.replace("/consentimento");
        return;
      }

      const [studentData, textsData] = await Promise.all([
        fetchStudentProfile(),
        fetchTexts(),
      ]);
      setStudent(studentData);
      setTexts(textsData);
    } catch (loadError) {
      if (
        loadError instanceof Error &&
        loadError.message === "AUTH_REQUIRED"
      ) {
        router.replace("/login");
        return;
      }
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os dados",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadData();
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Text style={styles.greeting}>
            Olá, {student?.name ?? "Estudante"}!
          </Text>
          <Text style={styles.subtitle}>
            {student?.className ?? "Turma demo"}
          </Text>

          {error ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorTitle}>Não consegui conectar ao servidor</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorHint}>
                Verifique se o site está rodando com `npm run dev` e se a URL da API
                está correta: {API_URL}
              </Text>
            </Card>
          ) : null}

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Nível</Text>
              <Text style={[styles.statValue, styles.statPrimary]}>
                {student?.level ?? 1}
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.statValue}>{student?.xp ?? 0}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${student?.xpProgress.percent ?? 0}%` },
                  ]}
                />
              </View>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Combo</Text>
              <Text style={[styles.statValue, styles.statAccent]}>
                {student?.comboStreak ?? 0}
              </Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Escolha um texto</Text>
        </View>
      }
      data={texts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/leitura/${item.id}`)}
          style={({ pressed }) => [
            styles.textItem,
            pressed && styles.textItemPressed,
          ]}
        >
          <Text style={styles.textTitle}>{item.title}</Text>
          <Text style={styles.textMeta}>
            {DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty} ·{" "}
            {item.wordCount} palavras
            {item.gradeHint ? ` · ${item.gradeHint}` : ""}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        !error ? (
          <Text style={styles.emptyText}>
            Nenhum texto cadastrado. Rode `npm run db:seed` no computador.
          </Text>
        ) : null
      }
      ListFooterComponent={
        student && student.recentSessions.length > 0 ? (
          <View style={styles.historyBlock}>
            <Text style={styles.sectionTitle}>Histórico recente</Text>
            {student.recentSessions.map((session) => (
              <View key={session.id} style={styles.historyRow}>
                <Text style={styles.historyTitle}>{session.textTitle}</Text>
                <Text style={styles.historyMeta}>
                  {session.accuracyPct != null ? `${session.accuracyPct}%` : "—"} ·{" "}
                  {session.wcpm != null ? `${session.wcpm} WCPM` : "—"}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    gap: spacing.md,
  },
  loadingText: {
    color: colors.muted,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.foreground,
  },
  subtitle: {
    color: colors.muted,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    color: colors.muted,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  statPrimary: {
    color: colors.primary,
  },
  statAccent: {
    color: colors.accent,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(15, 23, 42, 0.1)",
    borderRadius: radius.md,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: spacing.sm,
  },
  textItem: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  textItemPressed: {
    borderColor: colors.primary,
  },
  textTitle: {
    fontWeight: "600",
    color: colors.foreground,
    fontSize: 16,
  },
  textMeta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
  historyBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  historyTitle: {
    flex: 1,
    color: colors.foreground,
  },
  historyMeta: {
    color: colors.muted,
    fontVariant: ["tabular-nums"],
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorTitle: {
    fontWeight: "700",
    color: "#991b1b",
    marginBottom: spacing.xs,
  },
  errorText: {
    color: "#991b1b",
  },
  errorHint: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
  },
});
