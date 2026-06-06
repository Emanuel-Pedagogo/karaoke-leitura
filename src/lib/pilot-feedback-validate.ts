import {
  PILOT_FEEDBACK_CATEGORIES,
  PILOT_INTERNET_QUALITY,
  PILOT_TRI_STATE,
  pilotTriStateToBoolean,
  type PilotFeedbackCategory,
  type PilotInternetQuality,
  type PilotTriState,
} from "@karaoke/shared";

const CATEGORY_VALUES = new Set(
  PILOT_FEEDBACK_CATEGORIES.map((item) => item.value),
);
const INTERNET_VALUES = new Set(
  PILOT_INTERNET_QUALITY.map((item) => item.value),
);
const TRI_STATE_VALUES = new Set(PILOT_TRI_STATE.map((item) => item.value));

export type PilotFeedbackPayload = {
  source: "WEB" | "MOBILE";
  category: PilotFeedbackCategory;
  message: string;
  internetQuality?: PilotInternetQuality;
  aiWorked?: PilotTriState | "";
  readingWorked?: PilotTriState | "";
  appVersion?: string;
  screen?: string;
};

export function validatePilotFeedbackBody(body: unknown): {
  data?: PilotFeedbackPayload;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Dados inválidos" };
  }

  const input = body as Record<string, unknown>;
  const source = input.source;
  if (source !== "WEB" && source !== "MOBILE") {
    return { error: "Origem inválida" };
  }

  const category = input.category;
  if (
    typeof category !== "string" ||
    !CATEGORY_VALUES.has(category as PilotFeedbackCategory)
  ) {
    return { error: "Selecione uma categoria" };
  }

  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (message.length < 10) {
    return { error: "Descreva o que aconteceu com pelo menos 10 caracteres" };
  }
  if (message.length > 2000) {
    return { error: "Mensagem muito longa (máximo 2000 caracteres)" };
  }

  let internetQuality: PilotInternetQuality | undefined;
  if (input.internetQuality !== undefined && input.internetQuality !== "") {
    if (
      typeof input.internetQuality !== "string" ||
      !INTERNET_VALUES.has(input.internetQuality as PilotInternetQuality)
    ) {
      return { error: "Qualidade da internet inválida" };
    }
    internetQuality = input.internetQuality as PilotInternetQuality;
  }

  let aiWorked: PilotTriState | "" = "";
  if (input.aiWorked !== undefined && input.aiWorked !== "") {
    if (
      typeof input.aiWorked !== "string" ||
      !TRI_STATE_VALUES.has(input.aiWorked as PilotTriState)
    ) {
      return { error: "Resposta inválida sobre a IA" };
    }
    aiWorked = input.aiWorked as PilotTriState;
  }

  let readingWorked: PilotTriState | "" = "";
  if (input.readingWorked !== undefined && input.readingWorked !== "") {
    if (
      typeof input.readingWorked !== "string" ||
      !TRI_STATE_VALUES.has(input.readingWorked as PilotTriState)
    ) {
      return { error: "Resposta inválida sobre a leitura" };
    }
    readingWorked = input.readingWorked as PilotTriState;
  }

  const appVersion =
    typeof input.appVersion === "string" ? input.appVersion.slice(0, 120) : undefined;
  const screen =
    typeof input.screen === "string" ? input.screen.slice(0, 120) : undefined;

  return {
    data: {
      source,
      category: category as PilotFeedbackCategory,
      message,
      internetQuality,
      aiWorked,
      readingWorked,
      appVersion,
      screen,
    },
  };
}

export function mapTriStateForDb(value: PilotTriState | "" | undefined) {
  if (!value) return null;
  return pilotTriStateToBoolean(value);
}
