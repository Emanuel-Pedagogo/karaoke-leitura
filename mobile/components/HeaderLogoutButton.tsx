import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { hasClassSession } from "@/lib/class-session";
import { confirmLogout } from "@/lib/logout";
import { colors, spacing } from "@/lib/theme";

export function HeaderLogoutButton() {
  const router = useRouter();
  const [classSession, setClassSession] = useState(false);

  useEffect(() => {
    void hasClassSession().then(setClassSession);
  }, []);

  function handlePress() {
    if (classSession) {
      router.push("/trocar-aluno");
      return;
    }
    confirmLogout(router);
  }

  function handleLongPress() {
    if (!classSession) return;
    Alert.alert("Sair da turma", "Deseja esquecer o código da turma neste aparelho?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => void confirmLogout(router),
      },
    ]);
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={classSession ? "Trocar de aluno" : "Sair da conta"}
    >
      <Text style={styles.label}>{classSession ? "Trocar" : "Sair"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  label: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
