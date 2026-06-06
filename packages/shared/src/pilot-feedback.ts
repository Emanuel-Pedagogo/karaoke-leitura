export const PILOT_FEEDBACK_CATEGORIES = [
  { value: "ERRO_LOGIN", label: "Erro no login" },
  { value: "ERRO_MICROFONE", label: "Erro no microfone" },
  { value: "ERRO_IA", label: "Erro na IA" },
  { value: "DIFICULDADE_LEITURA", label: "Dificuldade na leitura" },
  { value: "SUGESTAO_PEDAGOGICA", label: "Sugestão pedagógica" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const PILOT_INTERNET_QUALITY = [
  { value: "BOA", label: "Boa" },
  { value: "INSTAVEL", label: "Instável" },
  { value: "SEM_INTERNET", label: "Sem internet" },
] as const;

export const PILOT_TRI_STATE = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
  { value: "AS_VEZES", label: "Às vezes" },
] as const;

export type PilotFeedbackCategory =
  (typeof PILOT_FEEDBACK_CATEGORIES)[number]["value"];

export type PilotInternetQuality =
  (typeof PILOT_INTERNET_QUALITY)[number]["value"];

export type PilotTriState = (typeof PILOT_TRI_STATE)[number]["value"];

export function pilotTriStateToBoolean(
  value: PilotTriState | "",
): boolean | null {
  if (value === "SIM") return true;
  if (value === "NAO") return false;
  if (value === "AS_VEZES") return null;
  return null;
}
