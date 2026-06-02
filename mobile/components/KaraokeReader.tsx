import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  delayAfterLastWordMs,
  delayBeforeNextWordMs,
  tokenizeText,
} from "@karaoke/shared";
import { colors, radius } from "@/lib/theme";

type Props = {
  content: string;
  speed: number;
  isPlaying: boolean;
  runKey?: number;
  onWordChange?: (index: number) => void;
  onComplete?: () => void;
};

export function KaraokeReader({
  content,
  speed,
  isPlaying,
  runKey = 0,
  onWordChange,
  onComplete,
}: Props) {
  const words = useMemo(() => tokenizeText(content), [content]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onWordChangeRef = useRef(onWordChange);
  onCompleteRef.current = onComplete;
  onWordChangeRef.current = onWordChange;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetHighlight = useCallback(() => {
    clearTimer();
    setActiveIndex(-1);
  }, [clearTimer]);

  useEffect(() => {
    resetHighlight();
  }, [runKey, content, resetHighlight]);

  useEffect(() => {
    if (isPlaying) return;
    resetHighlight();
  }, [isPlaying, resetHighlight]);

  useEffect(() => {
    clearTimer();
    if (!isPlaying || words.length === 0) return;

    let idx = 0;
    setActiveIndex(0);
    onWordChangeRef.current?.(0);

    const scheduleNext = () => {
      const word = words[idx];
      const isLast = idx >= words.length - 1;

      if (isLast) {
        const tail = delayAfterLastWordMs(word, speed);
        timeoutRef.current = setTimeout(() => {
          onCompleteRef.current?.();
        }, tail);
        return;
      }

      const delay = delayBeforeNextWordMs(word, speed);
      timeoutRef.current = setTimeout(() => {
        idx += 1;
        setActiveIndex(idx);
        onWordChangeRef.current?.(idx);
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return clearTimer;
  }, [isPlaying, speed, words, runKey, clearTimer]);

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
    >
      {words.map((word, index) => {
        const isPast = activeIndex >= 0 && index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <Text
            key={`${runKey}-${index}-${word}`}
            style={[
              styles.word,
              isPast && styles.wordPast,
              isActive && styles.wordActive,
              (activeIndex < 0 || index > activeIndex) && styles.wordFuture,
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
