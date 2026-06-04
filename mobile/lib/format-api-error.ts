/** Evita mostrar JSON gigante do Google no alerta do celular. */
export function formatApiError(message: string): string {
  if (
    message.includes("API_KEY_INVALID") ||
    message.includes("API key not valid") ||
    message.includes("GEMINI_API_KEY")
  ) {
    return "Erro na análise por IA. Tente novamente. Se este erro aparecer sempre nesta versão, verifique GEMINI_API_KEY na Vercel e faça redeploy.";
  }
  if (
    message.includes("UNABLE_TO_VERIFY") ||
    message.includes("certificado SSL") ||
    message.includes("--use-system-ca")
  ) {
    return "Erro de certificado SSL no servidor ao chamar o Gemini. No PC de desenvolvimento, reinicie com npm run dev.";
  }
  if (message.startsWith("{") && message.length > 120) {
    return "Erro temporário no servidor ao analisar o áudio. Toque em Tentar novamente. Se persistir, avise o administrador.";
  }
  return message;
}
