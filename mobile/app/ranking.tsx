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
import { fetchClassRanking, type RankingStudent, fetchStudentProfile } from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

export default function RankingScreen() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingStudent[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [profileData, rankingData] = await Promise.all([
        fetchStudentProfile(),
        fetchClassRanking(),
      ]);
      if (profileData) {
        setCurrentStudentId(profileData.id);
      }
      setRanking(rankingData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Ranking da Turma 🏆</Text>
        <Text style={styles.subtitle}>
          Leia textos todo dia para subir de nível e ganhar posições!
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadData()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}

      {!error && ranking.length > 0 ? (
        <View style={styles.rankingList}>
          {ranking.map((s) => {
            const isMe = s.id === currentStudentId;
            return (
              <View
                key={s.id}
                style={[
                  styles.rankingItem,
                  isMe && styles.rankingItemMe,
                ]}
              >
                <Text style={[styles.position, isMe && styles.textMe]}>
                  {s.position}º
                </Text>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, isMe && styles.textMe]}>
                    {s.name} {isMe ? "(Você)" : ""}
                  </Text>
                  <Text style={styles.studentLevel}>
                    Nível {s.level} · 🔥 {s.comboStreak} dias
                  </Text>
                </View>
                <Text style={[styles.xp, isMe && styles.textMe]}>{s.xp} XP</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      
      {!error && ranking.length === 0 ? (
        <Text style={styles.empty}>
          Nenhum aluno no ranking ainda.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  backButton: { alignSelf: "flex-start" },
  backButtonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.muted },
  rankingList: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingItemMe: {
    backgroundColor: colors.primary + "1A", // light primary
    borderRadius: radius.lg,
    borderBottomWidth: 0,
  },
  position: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.muted,
    width: 40,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  studentLevel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  xp: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  textMe: {
    color: colors.primary,
  },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  errorText: { color: "#991b1b", textAlign: "center" },
  retryButton: { marginTop: spacing.sm, alignItems: "center" },
  retryText: { color: colors.primary, fontWeight: "600" },
});