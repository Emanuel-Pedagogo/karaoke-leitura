import { StyleSheet, Text } from "react-native";
import { appVersionLabel } from "@/lib/app-version";
import { colors, spacing } from "@/lib/theme";

export function AppVersion() {
  return <Text style={styles.version}>{appVersionLabel()}</Text>;
}

const styles = StyleSheet.create({
  version: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
