# Publicar na Play Store (Expo EAS)

Este guia explica como gerar o **.aab** (Android App Bundle) e enviar para a **Google Play Store**.

O app publicado **precisa de um servidor na internet** (HTTPS). Ele não funciona apontando para `localhost` ou IP da sua rede Wi‑Fi.

---

## Visão geral

| Etapa | O que fazer |
|-------|-------------|
| 1 | Colocar o site Next.js no ar (Vercel, VPS, etc.) |
| 2 | Conta Expo + EAS Build |
| 3 | Build do app Android |
| 4 | Conta Google Play Developer |
| 5 | Enviar o .aab e preencher a ficha da loja |

---

## Pré-requisito — servidor em produção

Antes de publicar, o backend precisa estar acessível publicamente, por exemplo:

- `https://leitura.suaescola.edu.br`

Teste no navegador: a página inicial e o login de aluno devem funcionar.

Anote essa URL — você vai usá-la no app.

---

## Passo 1 — Instalar o EAS CLI

Na pasta do projeto:

```powershell
cd C:\dev\karaoke-leitura
npm install
```

Se der erro de certificado (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`):

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm install
```

---

## Passo 2 — Conta Expo e login

1. Crie uma conta gratuita em [https://expo.dev](https://expo.dev)
2. No terminal, dentro de `mobile/`:

```powershell
cd C:\dev\karaoke-leitura\mobile
npx eas login
```

---

## Passo 3 — Vincular o projeto ao EAS

Ainda em `mobile/`:

```powershell
npx eas init
```

- Confirme criar o projeto na Expo
- O comando grava o **Project ID** no `app.config.ts`

---

## Passo 4 — URL da API em produção

O app lê a variável `EXPO_PUBLIC_API_URL`. Configure no EAS (recomendado):

```powershell
npx eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://SUA-URL-REAL.com
```

Substitua pela URL HTTPS do seu servidor.

Alternativa local (só para teste de build): copie o exemplo e edite:

```powershell
Copy-Item mobile\.env.production.example mobile\.env.production
```

---

## Passo 5 — Gerar o build Android

### Teste interno (APK — instala direto no celular)

```powershell
cd C:\dev\karaoke-leitura
npm run build:mobile:android:preview
```

Baixe o APK pelo link que o EAS mostra no terminal.

### Produção (AAB — para a Play Store)

```powershell
npm run build:mobile:android
```

O build roda na nuvem da Expo (não precisa do Android Studio instalado). Ao terminar, você recebe um link para baixar o **.aab**.

---

## Passo 6 — Conta Google Play Developer

1. Acesse [Google Play Console](https://play.google.com/console)
2. Pague a taxa única de registro (cerca de US$ 25)
3. Crie um app novo
4. Use o **mesmo package name** do projeto: `br.edu.karaokeleitura.app`

---

## Passo 7 — Enviar o .aab

### Opção A — pelo EAS (automático)

1. No Play Console: **Configuração → Acesso à API** → crie uma conta de serviço e baixe o JSON
2. Salve como `mobile/google-service-account.json` (não commite — já está no `.gitignore`)
3. Rode:

```powershell
npm run submit:mobile:android
```

O envio vai para a faixa **internal** (teste interno). Ajuste em `mobile/eas.json` se quiser `production`.

### Opção B — manual

1. Play Console → **Teste interno** → **Criar nova versão**
2. Faça upload do `.aab` baixado do EAS
3. Salve e envie para revisão

---

## Passo 8 — Ficha da loja (obrigatório)

No Play Console, preencha:

| Item | Sugestão |
|------|----------|
| Nome | Karaokê de Leitura |
| Descrição curta | Leitura gamificada para alunos |
| Descrição completa | Explique fluência, XP, turmas, LGPD |
| Ícone 512×512 | `mobile/assets/icon.png` |
| Capturas de tela | Pelo menos 2 telas do app (login + leitura) |
| Política de privacidade | URL pública do site: `https://SUA-URL/privacidade` |
| Classificação etária | Questionário do Google (app educacional) |
| Público-alvo | Crianças / escola — siga as regras do Google para apps infantis |

---

## Passo 9 — Testadores e publicação

1. **Teste interno** — adicione e-mails de testadores (professores, TI)
2. Valide login (e-mail e código da turma), leitura e salvamento de XP
3. Promova a versão para **Produção** quando estiver satisfeito

---

## Comandos úteis

```powershell
# Ver builds na nuvem
cd mobile
npx eas build:list

# Nova versão (incrementa versionCode automaticamente)
npm run build:mobile:android

# Enviar último build para a Play Store
npm run submit:mobile:android
```

---

## Problemas comuns

**Build falha no monorepo `@karaoke/shared`**

- Rode `npm install` na raiz do projeto antes do build
- O `eas.json` já define `EXPO_USE_METRO_WORKSPACE_ROOT=1`

**App instalado não conecta ao servidor**

- `EXPO_PUBLIC_API_URL` deve ser HTTPS e acessível da internet
- Confira firewall e certificado SSL do servidor

**Microfone não funciona**

- O aluno precisa aceitar consentimento LGPD no app
- Permissão de microfone está declarada no `app.config.ts`

**Package name já existe na Play Store**

- Altere `android.package` em `mobile/app.config.ts` para um identificador único da sua escola (ex.: `br.edu.minhaescola.leitura`)

---

## Próximo passo depois de publicar

- [Modo offline](./GUIA-MOBILE.md) — textos baixados no celular
- Atualizações: cada nova versão = novo build EAS + upload na Play Console
