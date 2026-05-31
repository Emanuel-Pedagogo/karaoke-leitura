import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DIFFICULTY_LABELS } from "@karaoke/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { DIFFICULTY_LABELS };
