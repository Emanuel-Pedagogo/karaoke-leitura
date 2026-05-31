# Primeiros passos (guia simples)

Este guia é para quem está começando. Siga na ordem.

---

## O que você vai fazer

1. Instalar o Node.js no computador
2. Instalar as dependências do projeto
3. Criar o banco de dados com dados de exemplo
4. Abrir o site no navegador
5. (Opcional) Rodar o app no celular

---

## Passo 1 — Instalar o Node.js

1. Abra no navegador: https://nodejs.org
2. Baixe a versão **LTS** (botão verde recomendado)
3. Instale com **Next** em tudo (padrão)
4. Feche e abra de novo o **PowerShell** ou o **Terminal do Cursor**

Para testar se funcionou, digite:

```powershell
node -v
```

Deve aparecer algo como `v22.x.x`.

---

## Passo 2 — Abrir a pasta do projeto no terminal

No Cursor: menu **Terminal → New Terminal**.

Confirme que está na pasta certa:

```powershell
cd C:\dev\karaoke-leitura
```

---

## Passo 3 — Instalar dependências (`npm install`)

```powershell
npm install
```

**Se der erro de certificado** (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`):

**Opção A (mais fácil):** use o **hotspot do celular** como internet do PC e rode `npm install` de novo.

**Opção B:** no PowerShell, rode estes dois comandos, um de cada vez:

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm install
```

**Opção C:** se ainda falhar e você estiver em rede da escola/empresa, peça ajuda ao TI ou tente em casa.

Espere terminar (pode levar alguns minutos). Não deve aparecer `error` no final.

---

## Passo 4 — Arquivo `.env`

Na pasta do projeto deve existir o arquivo `.env`.

Se não existir, copie o exemplo:

```powershell
Copy-Item .env.example .env
```

Abra `.env` e confira se tem estas linhas:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-change-in-production"
```

---

## Passo 5 — Criar o banco e dados de exemplo

**Primeira vez** (banco novo), rode:

```powershell
npm run db:push
npm run db:seed
```

**Se aparecer erro sobre `passwordHash`** (banco antigo sem senha), use um comando só — apaga o banco de teste e recria tudo:

```powershell
npm run db:reset
```

Isso é normal em desenvolvimento. Os dados demo voltam com o seed.

No final do seed deve aparecer algo como `Seed OK`.

---

## Passo 6 — Subir o site

```powershell
npm run dev
```

Deixe esse terminal **aberto** (o servidor fica rodando).

Abra no navegador: **http://localhost:3000**

---

## Passo 7 — Entrar no sistema

Na página inicial, clique em **Entrar como aluno** ou **Entrar como professor**.

### Aluno (e-mail)

- E-mail: `aluno@demo.local`
- Senha: `aluno123`

### Aluno (código da turma)

1. Aba **Código da turma**
2. Digite: `TURMA3A`
3. Clique **Buscar alunos da turma**
4. Escolha o nome **Maria Silva**
5. **Entrar como aluno**

### Professor

- E-mail: `professor@demo.local`
- Senha: `professor123`

### Coordenador (visão da escola)

- E-mail: `coordenador@demo.local`
- Senha: `coord123`

Depois do login:

- **Aluno:** aceite a política de privacidade (LGPD) na primeira vez → depois leia textos  
- **Professor:** dashboard da turma  
- **Coordenador:** visão da escola  

Política completa: http://localhost:3000/privacidade

---

## Passo 8 — App no celular (opcional)

Só faça isso **depois** do Passo 6 funcionando.

1. Instale **Expo Go** na Play Store
2. Copie `mobile\.env.example` para `mobile\.env`
3. Em **outro terminal** (deixe o `npm run dev` rodando no primeiro):

```powershell
cd C:\dev\karaoke-leitura
npm run dev:mobile
```

4. Escaneie o QR Code com o Expo Go
5. No app, entre com e-mail (`aluno@demo.local` / `aluno123`) ou código da turma (`TURMA3A`)

Mais detalhes: [GUIA-MOBILE.md](./GUIA-MOBILE.md)

---

## Resumo dos comandos (quando tudo estiver ok)

```powershell
cd C:\dev\karaoke-leitura
npm install
npm run db:push
npm run db:seed
npm run dev
```

---

## Problemas comuns

| Problema | O que fazer |
|----------|-------------|
| `npm install` com erro de certificado | Hotspot do celular ou Passo 3 Opção B |
| `npm` não reconhecido | Instale o Node.js (Passo 1) e abra terminal novo |
| Site não abre | `npm run dev` está rodando? URL: `http://localhost:3000` |
| Lista de textos vazia | Rode `npm run db:seed` de novo |
| Login não funciona | Rode `npm run db:seed` e use as senhas da tabela acima |

---

## Ordem do dia a dia

Sempre que for trabalhar no projeto:

1. Abrir terminal na pasta `C:\dev\karaoke-leitura`
2. `npm run dev`
3. Abrir http://localhost:3000

Não precisa rodar `npm install` todo dia — só na primeira vez ou quando alguém adicionar pacotes novos.
