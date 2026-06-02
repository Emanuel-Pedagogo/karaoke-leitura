import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { colors, radius, spacing } from "@/lib/theme";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji} accessibilityElementsHidden>
        🎤
      </Text>
      <Text style={styles.title}>Karaokê de Leitura</Text>
      <Text style={styles.subtitle}>
        Leia em voz alta, ganhe pontos e evolua — de um jeito divertido.
      </Text>

      <View style={styles.actions}>
        <Link href="/cadastro" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryText}>Criar conta</Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Já tenho conta</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  emoji: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
});
