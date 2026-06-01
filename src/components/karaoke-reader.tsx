"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tokenizeText } from "@/lib/reading-metrics";
import { cn } from "@/lib/utils";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, words.length, clearTimer, onWordChange, onComplete]);

  useEffect(() => {
    if (!isPlaying) return;
    setActiveIndex(-1);
  }, [content, isPlaying]);

  return (
    <p
      className="text-2xl sm:text-3xl leading-relaxed font-medium text-center"
      aria-live="polite"
    >
      {words.map((word, i) => (
        <span
          key={`${i}-${word}`}
          className={cn(
            "inline-block mx-1 px-1 rounded transition-colors duration-200",
            i < activeIndex && "text-muted line-through opacity-50",
            i === activeIndex &&
              "bg-highlight text-foreground scale-105 shadow-sm",
            i > activeIndex && "text-foreground/70",
          )}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
