# Guia do app Android (React Native)

Este guia foi escrito para quem está começando. Não precisa dominar programação para **rodar** o projeto; para **alterar** código, vá com calma e mude uma coisa por vez.

## O que foi criado

O projeto agora tem **três partes**:

| Pasta | O que é | Analogia |
|-------|---------|----------|
| `src/` | Site Next.js (web) | Painel no navegador |
| `packages/shared/` | Regras de XP, WCPM, karaokê | “Receita” usada pelo site e pelo celular |
| `mobile/` | App React Native (Expo) | App do aluno no Android |

O celular **não guarda o banco de dados**. Ele conversa com o site pelo Wi‑Fi, como um app que precisa de internet.

## O que instalar no computador

1. **Node.js** (LTS) — [https://nodejs.org](https://nodejs.org)
2. **Android Studio** — emulador Android (opcional, mas recomendado)
3. **Expo Go** no celular — app gratuito na Play Store (para testar sem emulador)

## Primeira vez — preparar o banco

Abra um terminal na pasta do projeto:

```bash
npm install
npm run db:push
npm run db:seed
```

Isso cria textos de exemplo e um aluno demo no banco.

## Rodar o servidor (obrigatório)

Em **um terminal**:

```bash
npm run dev
```

Deixe rodando. O site fica em `http://localhost:3000`.

## Rodar o app no celular ou emulador

### Emulador Android (mais simples no PC)

1. Copie o arquivo de exemplo:
   - de `mobile/.env.example`
   - para `mobile/.env`
2. A URL padrão `http://10.0.2.2:3000` já aponta para o seu PC dentro do emulador.
3. Em **outro terminal**:

```bash
npm run dev:mobile
```

4. Pressione `a` para abrir no Android.

### Celular físico (mesma rede Wi‑Fi)

1. Descubra o IP do seu PC (no Windows: `ipconfig` → algo como `192.168.1.10`).
2. Crie `mobile/.env` com:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

(troque pelo IP real do seu computador)

3. Rode `npm run dev:mobile` e escaneie o QR Code com o **Expo Go**.

## Login no app

Na primeira abertura (ou se a sessão expirou), escolha uma forma de entrar:

**E-mail e senha**

- Demo: `aluno@demo.local` / `aluno123`

**Código da turma** (aba no app)

1. Digite o código (ex.: `TURMA3A`)
2. Toque em **Buscar alunos da turma**
3. Selecione seu nome e **Entrar como aluno**

O servidor precisa estar com `AUTH_SECRET` no `.env` (veja `.env.example`).

## Fluxo do aluno no app

0. Tela de login (se necessário)
1. Tela inicial — nível, XP, lista de textos
2. Toque em um texto — abre a leitura karaokê
3. **Iniciar leitura** — palavras vão sendo destacadas
4. Avaliação manual — omissões, substituições, hesitações, prosódia
5. Resultado — precisão, WCPM, XP (salvo no mesmo banco do site)

## APIs criadas para o mobile

| Rota | Função |
|------|--------|
| `POST /api/auth/login` | Login por e-mail (retorna token Bearer) |
| `GET /api/auth/class-students?code=` | Lista alunos da turma |
| `POST /api/auth/login-class` | Login por código da turma |
| `GET /api/student/me` | Perfil do aluno (requer token) |
| `GET /api/texts` | Lista de textos |
| `GET /api/texts/:id` | Um texto completo |
| `POST /api/sessions` | Salva a leitura (já existia) |

## Estrutura do app (`mobile/`)

```
mobile/
├── app/                    # Telas (Expo Router)
│   ├── login.tsx           # Login do aluno
│   ├── index.tsx           # Home do aluno
│   └── leitura/[textId].tsx
├── components/             # Karaokê, avaliação, card
└── lib/
    ├── api.ts              # Chamadas HTTP ao servidor
    └── config.ts           # URL da API
```

## Problemas comuns

**“Não consegui conectar ao servidor”**

- O `npm run dev` está rodando?
- A URL em `mobile/.env` está correta?
- Celular e PC na mesma rede Wi‑Fi?
- Firewall do Windows bloqueando a porta 3000?

**Lista de textos vazia**

- Rode `npm run db:seed`.

**Erro ao instalar pacotes (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`)**

- Problema de certificado SSL na rede (comum em redes corporativas).
- Peça ajuda de TI ou tente outra rede / hotspot do celular.

**`TypeError: fetch failed` ao rodar `npm run dev:mobile`**

- Mesma causa: rede bloqueia ou intercepta HTTPS.
- O script já usa `expo start --offline` para evitar isso no dia a dia.
- Se ainda falhar, rode antes: `$env:NODE_OPTIONS="--use-system-ca"`

## Próximos passos (quando estiver confortável)

1. Modo offline (textos baixados no celular)
2. Microfone / reconhecimento de voz no app (já disponível parcialmente na web)

## Publicar na Play Store

Guia completo: **[PUBLICAR-PLAY-STORE.md](./PUBLICAR-PLAY-STORE.md)**

Resumo rápido:

```powershell
cd C:\dev\karaoke-leitura\mobile
npx eas login
npx eas init
npx eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://SUA-URL.com
cd ..
npm run build:mobile:android
npm run submit:mobile:android
```

O app em produção **precisa** de um servidor Next.js público (HTTPS), não funciona com `localhost`.

## Onde mexer com segurança

| Quer mudar… | Arquivo |
|-------------|---------|
| Cores do app | `mobile/lib/theme.ts` |
| Textos da tela inicial | `mobile/app/index.tsx` |
| Regra de XP / WCPM | `packages/shared/src/reading-metrics.ts` |
| URL da API | `mobile/.env` |

Sempre teste web e mobile depois de mudar `packages/shared/`.
