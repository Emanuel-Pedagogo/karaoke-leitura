import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { confirmLogout } from "@/lib/logout";
import { colors, spacing } from "@/lib/theme";

export function HeaderLogoutButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => confirmLogout(router)}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Sair da conta"
    >
      <Text style={styles.label}>Sair</Text>
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
