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
import { registerAccount } from "@/lib/api";
import { setAuthToken } from "@/lib/session";
import { colors, radius, spacing } from "@/lib/theme";

export default function CadastroScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await registerAccount({
        role: "STUDENT",
        name,
        email,
        password,
        classCode: classCode.trim() || undefined,
      });
      if (!data.token) {
        throw new Error("Não foi possível criar a conta");
      }
      await setAuthToken(data.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>
        Cadastre-se como aluno para usar o aplicativo.
      </Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome completo"
        placeholderTextColor={colors.muted}
      />
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
        placeholder="Senha (mín. 6 caracteres)"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Confirmar senha"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        value={classCode}
        onChangeText={(text) => setClassCode(text.toUpperCase())}
        autoCapitalize="characters"
        placeholder="Código da turma (opcional)"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.hint}>
        Sem código? Criamos uma conta individual para você.
      </Text>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => void handleRegister()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Criar conta</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Link href="/login" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Já tem conta? Entrar</Text>
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
    fontSize: 14,
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
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b91c1c", marginTop: spacing.md },
  link: { marginTop: spacing.lg, alignItems: "center" },
  linkText: { color: colors.primary, fontWeight: "600" },
});
