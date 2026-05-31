import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { colors, radius, spacing } from "@/lib/theme";

type ErrorCounts = {
  omissions: number;
  substitutions: number;
  hesitations: number;
};

type Props = {
  counts: ErrorCounts;
  prosodyScore: number;
  onChange: (counts: ErrorCounts, prosody: number) => void;
};

function CounterRow({
  label,
  value,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.counter}>
        <Pressable
          accessibilityLabel={`Diminuir ${label}`}
          onPress={onDec}
          style={styles.counterButton}
        >
          <Text style={styles.counterButtonText}>−</Text>
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable
          accessibilityLabel={`Aumentar ${label}`}
          onPress={onInc}
          style={[styles.counterButton, styles.counterButtonPrimary]}
        >
          <Text style={styles.counterButtonTextPrimary}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ManualEvaluationPanel({
  counts,
  prosodyScore,
  onChange,
}: Props) {
  function update(partial: Partial<ErrorCounts>) {
    onChange({ ...counts, ...partial }, prosodyScore);
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Avaliação manual</Text>
      <CounterRow
        label="Omissões"
        value={counts.omissions}
        onInc={() => update({ omissions: counts.omissions + 1 })}
        onDec={() => update({ omissions: Math.max(0, counts.omissions - 1) })}
      />
      <CounterRow
        label="Substituições"
        value={counts.substitutions}
        onInc={() => update({ substitutions: counts.substitutions + 1 })}
        onDec={() =>
          update({ substitutions: Math.max(0, counts.substitutions - 1) })
        }
      />
      <CounterRow
        label="Hesitações"
        value={counts.hesitations}
        onInc={() => update({ hesitations: counts.hesitations + 1 })}
        onDec={() =>
          update({ hesitations: Math.max(0, counts.hesitations - 1) })
        }
      />
      <View style={styles.sliderBlock}>
        <Text style={styles.rowLabel}>Prosódia / expressividade</Text>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={prosodyScore}
          onValueChange={(value) => onChange(counts, value)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.sliderHint}>Nota: {prosodyScore}/5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.foreground,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  counterButtonText: {
    fontSize: 18,
    color: colors.foreground,
  },
  counterButtonTextPrimary: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "700",
  },
  counterValue: {
    width: 32,
    textAlign: "center",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  sliderBlock: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sliderHint: {
    fontSize: 12,
    color: colors.muted,
  },
});
