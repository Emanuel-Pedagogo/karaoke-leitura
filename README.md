# Karaokê de Leitura

Plataforma educacional gamificada para desenvolvimento da **fluência leitora**, **compreensão textual** e **engajamento** por meio de leituras interativas em formato karaokê.

## Objetivos

- Estimular leitura oral de forma lúdica e motivadora
- Desenvolver fluência, ritmo, prosódia e confiança
- Permitir acompanhamento pedagógico individual e coletivo
- Transformar a leitura em experiência gamificada

## Público-alvo

- Alunos (alfabetização ao ensino fundamental)
- Professores e coordenadores
- Escolas públicas e privadas
- Alunos com dificuldades de leitura ou necessidades educacionais específicas

## Stack (MVP)

| Camada      | Tecnologia              |
|------------|-------------------------|
| Frontend   | Next.js 15 + React 19   |
| Linguagem  | TypeScript              |
| Estilo     | Tailwind CSS            |
| Banco      | SQLite (dev) / PostgreSQL (prod) |
| ORM        | Prisma                  |
| Auth       | JWT (Node crypto) + código da turma |

## Estrutura de papéis

- **Aluno** — leitura karaokê, XP, missões, ranking
- **Professor** — dashboard, turmas, missões, relatórios
- **Coordenador** — visão agregada (fase 2)

## Documentação

- **[Primeiros passos (guia simples)](./docs/PRIMEIROS-PASSOS.md)** ← comece por aqui
- [Especificação funcional](./docs/ESPECIFICACAO-FUNCIONAL.md)
- [Modelo de domínio](./docs/MODELO-DE-DOMINIO.md)
- [Roadmap](./docs/ROADMAP.md)
- [Plano de larga escala](./docs/PLANO-LARGA-ESCALA.md)
- [Guia do app Android (React Native)](./docs/GUIA-MOBILE.md)
- [Publicar na Play Store (EAS)](./docs/PUBLICAR-PLAY-STORE.md)
- [Fase 4 — Voz e IA](./docs/FASE-4-VOZ.md)
- [LGPD — guia para a escola](./docs/LGPD.md)

## Desenvolvimento

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Credenciais demo (após o seed):

- Aluno: `aluno@demo.local` / `aluno123` (turma `TURMA3A`) ou `pedro@demo.local` / `aluno123` (`TURMA3B`)
- Professor: `professor@demo.local` / `professor123`
- Coordenador: `coordenador@demo.local` / `coord123`

Abra [http://localhost:3000](http://localhost:3000).

## Licença

Projeto educacional — uso interno da instituição contratante.
