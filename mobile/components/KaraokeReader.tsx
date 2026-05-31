import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokenizeText } from "@karaoke/shared";
import { colors, radius } from "@/lib/theme";

type Props = {
  content: string;
  speed: number;
  isPlaying: boolean;
  onWordChange?: (index: number) => void;
  onComplete?: () => void;
};

const MS_PER_WORD_BASE = 450;

export function KaraokeReader({
  content,
  speed,
  isPlaying,
  onWordChange,
  onComplete,
}: Props) {
  const words = useMemo(() => tokenizeText(content), [content]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    if (!isPlaying) return;

    const interval = MS_PER_WORD_BASE / speed;
    let idx = activeIndex < 0 ? 0 : activeIndex;

    timerRef.current = setInterval(() => {
      setActiveIndex(idx);
      onWordChange?.(idx);
      if (idx >= words.length - 1) {
        clearTimer();
        onComplete?.();
        return;
      }
      idx += 1;
    }, interval);

    return clearTimer;
  }, [isPlaying, speed, words.length, clearTimer, onWordChange, onComplete]);

  useEffect(() => {
    if (!isPlaying) return;
    setActiveIndex(-1);
  }, [content, isPlaying]);

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
    >
      {words.map((word, index) => {
        const isPast = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <Text
            key={`${index}-${word}`}
            style={[
              styles.word,
              isPast && styles.wordPast,
              isActive && styles.wordActive,
              !isPast && !isActive && styles.wordFuture,
            ]}
          >
            {word}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  word: {
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "600",
    paddingHorizontal: 4,
    borderRadius: radius.md,
  },
  wordPast: {
    color: colors.muted,
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  wordActive: {
    backgroundColor: colors.highlight,
    color: colors.foreground,
    transform: [{ scale: 1.05 }],
  },
  wordFuture: {
    color: "rgba(15, 23, 42, 0.7)",
  },
});
