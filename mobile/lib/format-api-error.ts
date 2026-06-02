/** Evita mostrar JSON gigante do Google no alerta do celular. */
export function formatApiError(message: string): string {
  if (
    message.includes("API_KEY_INVALID") ||
    message.includes("API key not valid") ||
    message.includes("GEMINI_API_KEY")
  ) {
    return "Chave do Gemini inválida no servidor. Peça ao administrador para configurar GEMINI_API_KEY na Vercel e fazer Redeploy.";
  }
  if (
    message.includes("UNABLE_TO_VERIFY") ||
    message.includes("certificado SSL") ||
    message.includes("--use-system-ca")
  ) {
    return "Erro de certificado SSL no servidor ao chamar o Gemini. No PC de desenvolvimento, reinicie com npm run dev.";
  }
  if (message.startsWith("{") && message.length > 120) {
    return "Erro no servidor ao analisar o áudio. Verifique a chave GEMINI_API_KEY na Vercel.";
  }
  return message;
}
