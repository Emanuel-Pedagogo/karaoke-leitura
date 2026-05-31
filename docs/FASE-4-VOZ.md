# Fase 4 — Voz e IA

## O que foi implementado

### 1. Captura de voz (web)

- Checkbox **“Usar microfone e análise automática”** antes da leitura
- Gravação de áudio + reconhecimento do navegador (Chrome/Edge, `pt-BR`)
- Na avaliação: botão **“Analisar leitura automaticamente”**

### 2. ASR (transcrição)

| Modo | Como |
|------|------|
| Navegador | Gratuito, durante a leitura (Web Speech API) |
| Servidor | Opcional: `OPENAI_API_KEY` no `.env` → Whisper transcreve o áudio gravado |

### 3. Correção automática

- Compara o texto falado com o texto do karaokê
- Sugere omissões, substituições e hesitações
- Botão **“Usar sugestão nos contadores”** (sempre revisável)

### 4. Sugestão de textos

- Na home do aluno: bloco **“Sugeridos para você (IA)”**
- Baseado em WCPM médio e textos ainda não lidos

### 5. Assistente pedagógico

- `/aluno/assistente` — dicas a partir do histórico (sem custo de API)

## Configuração opcional (Whisper)

No `.env`:

```env
OPENAI_API_KEY="sk-..."
```

Reinicie `npm run dev`. No celular, sem reconhecimento do navegador, o áudio gravado pode ser enviado ao servidor.

## Atualizar banco

```powershell
npx prisma db push
```

Novos campos em `ReadingSession`: `spokenTranscript`, `asrSource`.

## LGPD

- Consentimento obrigatório: `/aluno/consentimento`
- Política: `/privacidade`
- Apagar transcrições: `/aluno/dados`
- Guia da escola: [LGPD.md](./LGPD.md)

## Limitações (MVP)

- A análise automática **não substitui** o professor
- Safari/Firefox podem ter suporte limitado ao microfone no navegador
- App mobile: use Whisper no servidor ou digite/cole a transcrição manualmente na análise

## Próximos passos possíveis

- Karaokê avançando palavra a palavra conforme a voz
- Chat com LLM no assistente
- Modelo de prosódia por áudio
