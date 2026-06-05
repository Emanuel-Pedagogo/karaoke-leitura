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
import { AppVersion } from "@/components/AppVersion";
import {
  fetchPrivacyStatus,
  fetchStudentClassRequests,
  fetchStudentProfile,
  fetchTexts,
  prefetchTextsForOffline,
  type ClassJoinRequest,
  type ReadingTextSummary,
  type StudentProfile,
} from "@/lib/api";
import { hasClassSession } from "@/lib/class-session";
import { getPendingSessions } from "@/lib/db";
import { isDeviceOffline } from "@/lib/network";
import { confirmLogout } from "@/lib/logout";
import { syncPendingSessions } from "@/lib/sync";
import { colors, radius, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [texts, setTexts] = useState<ReadingTextSummary[]>([]);
  const [classRequests, setClassRequests] = useState<ClassJoinRequest[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classSession, setClassSession] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    const offline = await isDeviceOffline();
    setIsOffline(offline);
    try {
      const privacy = await fetchPrivacyStatus();
      if (privacy.needsPrivacy) {
        router.replace("/consentimento");
        return;
      }

      const [studentData, textsData, requestsData, pendingSessions, inClassSession] =
        await Promise.all([
        fetchStudentProfile(),
        fetchTexts(),
        fetchStudentClassRequests().catch(() => [] as ClassJoinRequest[]),
        getPendingSessions(),
        hasClassSession(),
      ]);
      setStudent(studentData);
      setTexts(textsData);
      setClassRequests(requestsData);
      setPendingSyncCount(pendingSessions.length);
      setClassSession(inClassSession);

      if (!offline && textsData.length > 0) {
        void prefetchTextsForOffline(textsData);
      }
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

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncPendingSessions();
      const pendingSessions = await getPendingSessions();
      setPendingSyncCount(pendingSessions.length);
      if (pendingSessions.length === 0) {
        await loadData();
      }
    } finally {
      setSyncing(false);
    }
  }, [loadData]);

  const firstText = texts[0];
  const teacherInvites = classRequests.filter(
    (r) => r.type === "TEACHER_INVITE",
  );
  const pendingJoins = classRequests.filter((r) => r.type === "CODE_JOIN");

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
      {classSession ? (
        <View style={styles.classBanner}>
          <Text style={styles.classBannerTitle}>Modo sala ativo</Text>
          <Text style={styles.classBannerText}>
            Este celular está sendo usado por vários alunos da turma.
          </Text>
          <Text style={styles.classBannerStudent}>
            Aluno atual: {student?.name ?? "—"}
          </Text>
          <Pressable
            style={styles.classBannerButton}
            onPress={() => router.push("/trocar-aluno")}
          >
            <Text style={styles.classBannerButtonText}>
              Trocar aluno / Próximo aluno
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.greeting}>
        Olá, {student?.name?.split(" ")[0] ?? "leitor"}!
      </Text>
      {student?.className ? (
        <Text style={styles.subtitle}>{student.className}</Text>
      ) : null}

      {teacherInvites.length > 0 ? (
        <Pressable
          style={styles.inviteBanner}
          onPress={() => router.push("/turma")}
        >
          <Text style={styles.inviteBannerTitle}>
            Convite da turma ({teacherInvites.length})
          </Text>
          <Text style={styles.inviteBannerText}>
            {teacherInvites[0].class.name} convidou você. Toque para aceitar ou
            recusar.
          </Text>
        </Pressable>
      ) : null}

      {pendingJoins.length > 0 ? (
        <Pressable
          style={styles.pendingBanner}
          onPress={() => router.push("/turma")}
        >
          <Text style={styles.pendingBannerText}>
            {pendingJoins.length} solicitação(ões) aguardando o professor — ver
            em Minha Turma
          </Text>
        </Pressable>
      ) : null}

      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Modo offline — textos salvos no celular estão disponíveis para leitura.
          </Text>
        </View>
      ) : null}

      {pendingSyncCount > 0 ? (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerTitle}>Sincronização pendente</Text>
          <Text style={styles.syncBannerText}>
            Você tem {pendingSyncCount} leitura(s) salva(s) offline. Elas serão avaliadas automaticamente quando houver conexão com a internet.
          </Text>
          {!isOffline ? (
            <Pressable
              onPress={() => void handleSync()}
              disabled={syncing}
              style={styles.syncButton}
            >
              <Text style={styles.syncButtonText}>
                {syncing ? "Sincronizando…" : "Sincronizar agora"}
              </Text>
            </Pressable>
          ) : null}
        </View>
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
        <View style={styles.statsRow}>
          <Text style={styles.xpLine}>
            Nível {student.level} · {student.xp} pontos
          </Text>
          <View style={styles.actionButtons}>
            <Pressable onPress={() => router.push("/ranking" as any)} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>🏆 Ranking</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/turma")} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                Minha Turma{classRequests.length > 0 ? ` (${classRequests.length})` : ""}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/dados")} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>🔒 Meus dados</Text>
            </Pressable>
          </View>
        </View>
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

      {!classSession ? (
        <Pressable
          onPress={() => confirmLogout(router)}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Trocar de aluno (sair)</Text>
        </Pressable>
      ) : null}

      <AppVersion />

      {classSession ? (
        <Pressable
          onPress={() => confirmLogout(router)}
          style={styles.logoutLink}
        >
          <Text style={styles.logoutLinkText}>Sair da turma</Text>
        </Pressable>
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
  classBanner: {
    backgroundColor: "#eff6ff",
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  classBannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  classBannerText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  classBannerStudent: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: spacing.xs,
  },
  classBannerButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  classBannerButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
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
  inviteBanner: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inviteBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#047857",
    marginBottom: spacing.xs,
  },
  inviteBannerText: {
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
  },
  pendingBanner: {
    backgroundColor: "#fffbeb",
    borderColor: "#f59e0b",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pendingBannerText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  syncBanner: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  syncBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d4ed8",
    marginBottom: spacing.xs,
  },
  syncBannerText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  syncButton: {
    marginTop: spacing.sm,
    backgroundColor: "#1d4ed8",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  offlineBanner: {
    backgroundColor: "#f3f4f6",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offlineBannerText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
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
    color: colors.muted,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  actionButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
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
  logoutButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  logoutText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "700",
  },
  logoutLink: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  logoutLinkText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
});
