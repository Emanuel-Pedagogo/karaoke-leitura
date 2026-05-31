# LGPD — Guia para a escola

## O que a plataforma já faz

| Requisito LGPD | Implementação |
|----------------|---------------|
| Transparência | [Política de Privacidade](/privacidade) pública |
| Consentimento | Tela `/aluno/consentimento` antes do uso |
| Consentimento de voz separado | Checkbox opcional + confirmação de responsável |
| Minimização | Áudio **não** é guardado no servidor; só transcrição (se autorizado) |
| Direito de apagar voz | `/aluno/dados` → apagar transcrições |
| Revogação de voz | Apagar dados ou desmarcar consentimento em nova visita à tela de consentimento |
| Papel da escola | Aviso no dashboard do professor |

## Checklist da escola (antes de usar com turmas reais)

1. [ ] Definir encarregado/DPO ou contato de privacidade na secretaria  
2. [ ] Incluir o Karaokê de Leitura na autorização de uso de imagem/voz/dados da matrícula  
3. [ ] Informar pais/responsáveis sobre o microfone **opcional**  
4. [ ] Revisar o texto em `/privacidade` com advogado  
5. [ ] Em produção: HTTPS, backup, contrato com provedor de IA (se usar Whisper)  
6. [ ] Definir prazo de guarda dos dados após o aluno sair da escola  

## Fluxo do aluno

1. Login → tela de consentimento (obrigatória)  
2. Pode usar o app **sem** microfone  
3. Para microfone: marcar opção + confirmar responsável  
4. A qualquer momento: **Meus dados** → apagar transcrições  

## Atualizar a política

1. Edite `src/app/privacidade/page.tsx`  
2. Altere `PRIVACY_POLICY_VERSION` em `src/lib/privacy.ts`  
3. Alunos verão a tela de consentimento novamente na próxima entrada  

## Dados no banco

Campos em `StudentProfile`:

- `privacyAcceptedAt` / `privacyPolicyVersion`  
- `voiceConsentAt` / `voiceConsentGuardian`  

Campo em `ReadingSession`:

- `spokenTranscript` (apagável pelo aluno)
