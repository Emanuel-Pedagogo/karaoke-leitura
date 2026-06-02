import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { API_URL } from "@/lib/config";
import { setAuthToken } from "@/lib/session";
import { colors, radius, spacing } from "@/lib/theme";

type LoginMode = "email" | "class";
type ClassStudent = { id: string; name: string };

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
  }

  async function handleEmailLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error ?? "Não foi possível entrar");
      }
      if (data.role !== "STUDENT") {
        throw new Error("Use a conta de aluno no aplicativo");
      }
      await setAuthToken(data.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  async function loadClassStudents() {
    const code = classCode.trim().toUpperCase();
    if (!code) {
      setError("Informe o código da turma");
      return;
    }

    setLoadingStudents(true);
    setError(null);
    setStudents([]);
    setStudentId("");
    setClassName("");

    try {
      const res = await fetch(
        `${API_URL}/api/auth/class-students?code=${encodeURIComponent(code)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Turma não encontrada");
      }
      setClassName(data.className);
      setStudents(data.students);
      if (data.students.length === 1) {
        setStudentId(data.students[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar turma");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleClassLogin() {
    if (!studentId) {
      setError("Selecione seu nome na lista");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/login-class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode: classCode.trim().toUpperCase(), studentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error ?? "Não foi possível entrar");
      }
      await setAuthToken(data.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.hint}>Servidor: {API_URL}</Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mode === "email" && styles.tabActive]}
          onPress={() => switchMode("email")}
        >
          <Text style={[styles.tabText, mode === "email" && styles.tabTextActive]}>
            E-mail
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === "class" && styles.tabActive]}
          onPress={() => switchMode("class")}
        >
          <Text style={[styles.tabText, mode === "class" && styles.tabTextActive]}>
            Código da turma
          </Text>
        </Pressable>
      </View>

      {mode === "email" ? (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="E-mail"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Senha"
            placeholderTextColor={colors.muted}
          />
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={classCode}
            onChangeText={(text) => setClassCode(text.toUpperCase())}
            autoCapitalize="characters"
            placeholder="Código da turma"
            placeholderTextColor={colors.muted}
          />
          <Pressable
            style={[styles.secondaryButton, loadingStudents && styles.buttonDisabled]}
            onPress={loadClassStudents}
            disabled={loadingStudents}
          >
            {loadingStudents ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Buscar alunos da turma</Text>
            )}
          </Pressable>

          {className ? (
            <Text style={styles.classLabel}>
              Turma: <Text style={styles.className}>{className}</Text>
            </Text>
          ) : null}

          {students.length > 0 ? (
            <View style={styles.studentList}>
              <Text style={styles.studentListTitle}>Seu nome</Text>
              {students.map((student) => {
                const selected = studentId === student.id;
                return (
                  <Pressable
                    key={student.id}
                    style={[styles.studentItem, selected && styles.studentItemSelected]}
                    onPress={() => setStudentId(student.id)}
                  >
                    <Text
                      style={[
                        styles.studentItemText,
                        selected && styles.studentItemTextSelected,
                      ]}
                    >
                      {student.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Pressable
            style={[
              styles.button,
              (loading || students.length === 0) && styles.buttonDisabled,
            ]}
            onPress={handleClassLogin}
            disabled={loading || students.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar como aluno</Text>
            )}
          </Pressable>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Link href="/cadastro" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Não tem conta? Criar conta</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  hint: { fontSize: 12, color: colors.muted, marginBottom: spacing.lg },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md - 4,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  tabTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.foreground,
  },
  error: { color: "#b91c1c", marginTop: spacing.md },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  secondaryButtonText: { color: colors.primary, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  classLabel: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  className: { fontWeight: "700", color: colors.foreground },
  studentList: { marginBottom: spacing.md, gap: spacing.sm },
  studentListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  studentItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  studentItemSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  studentItemText: { color: colors.foreground, fontSize: 15 },
  studentItemTextSelected: { color: colors.primary, fontWeight: "700" },
  link: { marginTop: spacing.lg, alignItems: "center" },
  linkText: { color: colors.primary, fontWeight: "600" },
});
