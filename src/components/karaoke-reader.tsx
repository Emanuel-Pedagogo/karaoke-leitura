"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  delayAfterLastWordMs,
  delayBeforeNextWordMs,
  tokenizeText,
} from "@karaoke/shared";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  speed: number;
  isPlaying: boolean;
  /** Muda ao reiniciar a leitura — zera o destaque no início do texto */
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
    <p
      className="text-2xl sm:text-3xl leading-relaxed font-medium text-center"
      aria-live="polite"
    >
      {words.map((word, i) => (
        <span
          key={`${runKey}-${i}-${word}`}
          className={cn(
            "inline-block mx-1 px-1 rounded transition-colors duration-200",
            activeIndex >= 0 &&
              i < activeIndex &&
              "text-muted line-through opacity-50",
            i === activeIndex &&
              "bg-highlight text-foreground scale-105 shadow-sm",
            (activeIndex < 0 || i > activeIndex) && "text-foreground/70",
          )}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
