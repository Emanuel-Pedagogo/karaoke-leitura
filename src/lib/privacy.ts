/** Versão atual da política — atualize ao mudar o texto em /privacidade */
export const PRIVACY_POLICY_VERSION = "2026-06-v1";

export type ConsentPayload = {
  acceptPrivacy: boolean;
  acceptVoice: boolean;
  guardianConfirmed: boolean;
};

export function validateConsentPayload(body: ConsentPayload) {
  if (!body.acceptPrivacy) {
    return "É necessário aceitar a Política de Privacidade para usar a plataforma.";
  }
  if (body.acceptVoice && !body.guardianConfirmed) {
    return "O uso do microfone exige confirmação do aluno ou do responsável legal.";
  }
  return null;
}
