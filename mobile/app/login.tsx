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
import { setClassCode as persistClassCode, clearClassCode } from "@/lib/class-session";
import { setAuthToken } from "@/lib/session";
import { colors, radius, spacing } from "@/lib/theme";

type ClassStudent = { id: string; name: string };

export default function LoginScreen() {
  const router = useRouter();
  const [useClassCode, setUseClassCode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error("No celular, use uma conta de aluno.");
      }
      await setAuthToken(data.token);
      await clearClassCode();
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
      if (!res.ok) throw new Error(data.error ?? "Turma não encontrada");
      setClassName(data.className);
      setStudents(data.students);
      if (data.students.length === 1) setStudentId(data.students[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar turma");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleClassLogin() {
    if (!studentId) {
      setError("Selecione seu nome");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/login-class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: classCode.trim().toUpperCase(),
          studentId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error ?? "Não foi possível entrar");
      }
      await persistClassCode(classCode);
      await setAuthToken(data.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  if (useClassCode) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Código da turma</Text>
        <Text style={styles.subtitle}>
          Digite o código que o professor passou e escolha seu nome.
        </Text>

        <TextInput
          style={styles.input}
          value={classCode}
          onChangeText={(text) => setClassCode(text.toUpperCase())}
          autoCapitalize="characters"
          placeholder="Código da turma"
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={styles.outlineButton}
          onPress={() => void loadClassStudents()}
          disabled={loadingStudents}
        >
          {loadingStudents ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.outlineText}>Buscar meu nome</Text>
          )}
        </Pressable>

        {className ? (
          <Text style={styles.classHint}>
            Turma: <Text style={styles.className}>{className}</Text>
          </Text>
        ) : null}

        {students.map((student) => {
          const selected = studentId === student.id;
          return (
            <Pressable
              key={student.id}
              style={[styles.nameItem, selected && styles.nameItemSelected]}
              onPress={() => setStudentId(student.id)}
            >
              <Text
                style={[styles.nameText, selected && styles.nameTextSelected]}
              >
                {student.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.button, (loading || !studentId) && styles.buttonDisabled]}
          onPress={() => void handleClassLogin()}
          disabled={loading || !studentId}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={() => setUseClassCode(false)} style={styles.link}>
          <Text style={styles.linkText}>Entrar com e-mail e senha</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subtitle}>Use o e-mail e a senha da sua conta.</Text>

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
        onPress={() => void handleEmailLogin()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={() => setUseClassCode(true)} style={styles.linkMuted}>
        <Text style={styles.linkMutedText}>Tenho código da turma (sem senha)</Text>
      </Pressable>

      <Link href="/cadastro" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Não tem conta? Criar conta</Text>
        </Pressable>
      </Link>

      <Link href="/welcome" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>← Voltar</Text>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.foreground,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  outlineText: { color: colors.primary, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#b91c1c", marginTop: spacing.md, textAlign: "center" },
  link: { marginTop: spacing.lg, alignItems: "center" },
  linkText: { color: colors.primary, fontWeight: "600" },
  linkMuted: { marginTop: spacing.md, alignItems: "center" },
  linkMutedText: { color: colors.muted, fontSize: 14 },
  classHint: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  className: { fontWeight: "700", color: colors.foreground },
  nameItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nameItemSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  nameText: { fontSize: 16, color: colors.foreground },
  nameTextSelected: { color: colors.primary, fontWeight: "700" },
});
