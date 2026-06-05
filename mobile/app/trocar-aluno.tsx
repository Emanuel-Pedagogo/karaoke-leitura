import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { fetchPrivacyStatus, fetchStudentProfile } from "@/lib/api";
import {
  fetchClassStudents,
  getClassCode,
  switchToStudent,
  type ClassStudent,
} from "@/lib/class-session";
import { isDeviceOffline } from "@/lib/network";
import { colors, radius, spacing } from "@/lib/theme";

const OFFLINE_CLASS_ERROR =
  "Não foi possível buscar alunos da turma. Verifique a conexão.";

export default function TrocarAlunoScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [classCode, setClassCode] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const code = await getClassCode();
      if (!code) {
        setClassCode(null);
        return;
      }
      setClassCode(code);

      if (await isDeviceOffline()) {
        setError(OFFLINE_CLASS_ERROR);
        return;
      }

      const [classData, profile] = await Promise.all([
        fetchClassStudents(code),
        fetchStudentProfile().catch(() => null),
      ]);
      setClassName(classData.className);
      setStudents(classData.students);
      setCurrentStudentId(profile?.id ?? null);
    } catch (e) {
      if (await isDeviceOffline()) {
        setError(OFFLINE_CLASS_ERROR);
      } else {
        setError(
          e instanceof Error ? e.message : OFFLINE_CLASS_ERROR,
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  async function handleSelectStudent(studentId: string) {
    if (!classCode || studentId === currentStudentId) {
      router.back();
      return;
    }

    setSwitchingId(studentId);
    setError(null);
    try {
      await switchToStudent(classCode, studentId);
      const privacy = await fetchPrivacyStatus();
      if (privacy.needsPrivacy) {
        router.replace("/consentimento");
        return;
      }
      if (returnTo && typeof returnTo === "string") {
        const separator = returnTo.includes("?") ? "&" : "?";
        router.replace(`${returnTo}${separator}fresh=${Date.now()}` as any);
      } else {
        router.replace("/home");
      }
    } catch (e) {
      if (e instanceof Error && e.message === "AUTH_REQUIRED") {
        router.replace("/welcome");
        return;
      }
      setError(e instanceof Error ? e.message : "Erro ao trocar de aluno");
    } finally {
      setSwitchingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!classCode) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Turma não encontrada</Text>
        <Text style={styles.subtitle}>
          Entre com o código da turma para usar a troca rápida de alunos.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.primaryButtonText}>Entrar com código da turma</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Escolha o próximo aluno</Text>
      {className ? (
        <Text style={styles.subtitle}>Turma: {className}</Text>
      ) : null}
      <Text style={styles.hint}>
        Toque no nome do aluno que vai ler agora. O celular continua na mesma turma.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadData()}>
            <Text style={styles.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}

      {students.map((student) => {
        const isCurrent = student.id === currentStudentId;
        const isSwitching = switchingId === student.id;
        return (
          <Pressable
            key={student.id}
            style={[styles.nameItem, isCurrent && styles.nameItemCurrent]}
            onPress={() => void handleSelectStudent(student.id)}
            disabled={!!switchingId}
          >
            {isSwitching ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                style={[styles.nameText, isCurrent && styles.nameTextCurrent]}
              >
                {student.name}
                {isCurrent ? " (atual)" : ""}
              </Text>
            )}
          </Pressable>
        );
      })}

      {students.length === 0 ? (
        <Text style={styles.empty}>
          Nenhum aluno nesta turma. Peça ao professor para cadastrar os alunos.
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
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  nameItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 52,
    justifyContent: "center",
  },
  nameItemCurrent: {
    borderColor: colors.primary,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  nameText: { fontSize: 17, color: colors.foreground },
  nameTextCurrent: { color: colors.primary, fontWeight: "700" },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#991b1b", textAlign: "center", fontSize: 14 },
  retryText: {
    color: colors.primary,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
});
