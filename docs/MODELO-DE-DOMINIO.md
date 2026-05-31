# Modelo de Domínio

## Entidades principais

```
Escola
 └── Turma
      ├── Professor (N:N)
      └── Aluno
           ├── PerfilGamificacao (nível, XP)
           ├── LeituraSessao
           │    ├── Texto
           │    ├── ErrosLeitura (omissão, substituição, hesitação)
           │    └── Métricas (precisão, WCPM, prosódia, pontuação)
           ├── Conquista (medalhas)
           └── MissaoAluno
```

## Papéis (UserRole)

| Papel        | Descrição                          |
|-------------|-------------------------------------|
| `STUDENT`   | Aluno — leitura e gamificação       |
| `TEACHER`   | Professor — turma e avaliação       |
| `COORDINATOR` | Coordenador — visão escola (fase 2) |

## Texto de leitura

- `titulo`, `conteudo` (palavras tokenizadas para karaokê)
- `dificuldade`: `INICIANTE` | `INTERMEDIARIO` | `AVANCADO`
- `serieSugerida`, `palavraTotal`

## Sessão de leitura

| Campo            | Tipo     | Descrição                    |
|-----------------|----------|------------------------------|
| duracaoSegundos | int      | Tempo da sessão              |
| palavrasTotais  | int      | Total de palavras do texto   |
| palavrasCorretas| int      | Após descontar erros         |
| omissoes        | int      | Contador manual              |
| substituicoes   | int      | Contador manual              |
| hesitacoes      | int      | Contador manual              |
| prosodiaNota    | 1–5      | Avaliação do professor       |
| precisaoPct     | computed | palavrasCorretas / total × 100 |
| wcpm            | computed | palavras corretas por minuto |
| pontuacao       | computed | XP da sessão                 |
| velocidade      | float    | Multiplicador karaokê (0.5–2) |

## Fórmulas (MVP)

**Precisão**

```
precisao = (palavrasTotais - errosTotais) / palavrasTotais × 100
errosTotais = omissoes + substituicoes + hesitacoes
```

**WCPM**

```
wcpm = palavrasCorretas / (duracaoSegundos / 60)
```

**Pontuação base**

```
pontuacao = round(wcpm × (precisao/100) × fatorProsodia × comboMultiplier)
```

## Gamificação

- **XP por sessão** → soma ao perfil
- **Nível** = floor(XP / 500) + 1 (ajustável)
- **Combo** = leituras consecutivas com precisão ≥ 90%
- **Missão diária** = meta configurável (ex.: 1 leitura, precisão mínima)
- **Ranking semanal** = soma de pontuação na semana ISO

## Conquistas (exemplos seed)

| Slug              | Condição                    |
|-------------------|-----------------------------|
| primeira-leitura  | 1 sessão concluída          |
| fluente-10        | WCPM ≥ 60 em uma sessão     |
| precisao-ouro     | Precisão 100%               |
| combo-5           | 5 combos seguidos           |
| maratonista       | 30 min leitura acumulada    |
