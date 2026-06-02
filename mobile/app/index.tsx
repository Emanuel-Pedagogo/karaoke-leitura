import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { DIFFICULTY_LABELS } from "@karaoke/shared";
import {
  fetchPrivacyStatus,
  fetchStudentProfile,
  fetchTexts,
  type ReadingTextSummary,
  type StudentProfile,
} from "@/lib/api";
import { getAuthToken } from "@/lib/session";
import { colors, radius, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [texts, setTexts] = useState<ReadingTextSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        router.replace("/welcome");
        return;
      }

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
        router.replace("/welcome");
        return;
      }
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar. Tente de novo.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData]),
  );

  const firstText = texts[0];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.greeting}>
        Olá, {student?.name?.split(" ")[0] ?? "leitor"}!
      </Text>
      {student?.className ? (
        <Text style={styles.subtitle}>{student.className}</Text>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadData()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}

      {!error && firstText ? (
        <Pressable
          style={styles.heroCard}
          onPress={() => router.push(`/leitura/${firstText.id}`)}
        >
          <Text style={styles.heroLabel}>Próxima leitura</Text>
          <Text style={styles.heroTitle}>{firstText.title}</Text>
          <Text style={styles.heroMeta}>
            {DIFFICULTY_LABELS[firstText.difficulty] ?? firstText.difficulty} ·{" "}
            {firstText.wordCount} palavras
          </Text>
          <View style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Começar agora →</Text>
          </View>
        </Pressable>
      ) : null}

      {student ? (
        <Text style={styles.xpLine}>
          Nível {student.level} · {student.xp} pontos
        </Text>
      ) : null}

      {texts.length > 1 ? (
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Outros textos</Text>
          {texts.slice(1).map((item) => (
            <Pressable
              key={item.id}
              style={styles.textItem}
              onPress={() => router.push(`/leitura/${item.id}`)}
            >
              <Text style={styles.textTitle}>{item.title}</Text>
              <Text style={styles.textMeta}>
                {DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty} ·{" "}
                {item.wordCount} palavras
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!error && texts.length === 0 ? (
        <Text style={styles.empty}>
          Ainda não há textos disponíveis. Peça ao professor para cadastrar.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: spacing.xs,
  },
  heroButton: {
    marginTop: spacing.lg,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  heroButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  xpLine: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  listSection: { gap: spacing.sm },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  textItem: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  textTitle: { fontWeight: "600", fontSize: 16, color: colors.foreground },
  textMeta: { marginTop: 4, color: colors.muted, fontSize: 14 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: "#991b1b", textAlign: "center" },
  retryButton: { marginTop: spacing.sm, alignItems: "center" },
  retryText: { color: colors.primary, fontWeight: "600" },
});
