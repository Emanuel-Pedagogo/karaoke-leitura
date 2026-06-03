# Plano de Larga Escala

Este plano organiza as proximas implementacoes para o Karaokê de Leitura suportar mais escolas, turmas e alunos com seguranca operacional. A prioridade aqui nao e adicionar novas funcionalidades visiveis, mas reduzir riscos de queda, custo alto, lentidao, abuso e perda de confianca quando o app sair do piloto.

## Objetivo

Preparar o sistema para sair de um piloto controlado e evoluir para uso por varias escolas, com:

- app Android publicado de forma segura;
- backend publico estavel;
- banco de dados preparado para crescimento;
- uso de voz/IA com limite, fila e controle de custo;
- fluxo LGPD consistente entre web e mobile;
- seguranca adequada para criancas, professores e escolas.

## Situacao atual resumida

Hoje o sistema esta adequado para piloto com uso acompanhado, mas ainda nao deve ser aberto para grande publico sem ajustes.

| Area | Situacao atual | Risco em larga escala |
| --- | --- | --- |
| App mobile | Funcional e dependente de internet | Sem offline e sem fila de sincronizacao |
| Backend | Next.js com rotas REST | Rotas pesadas podem bloquear ou dar timeout |
| Banco | PostgreSQL via Prisma | Falta de indices, paginacao e agregacoes eficientes |
| Voz/IA | Avaliacao sincrona por requisicao | Custo, timeout e limite de API externa |
| Login por turma | Simples e pratico | Codigo de turma pode expor lista de alunos |
| Dados/metricas | Algumas metricas vem do cliente | Possivel manipulacao de XP/ranking |
| Observabilidade | Logs basicos | Dificil saber onde falha em producao |

## Estimativa conservadora antes das melhorias

| Cenario | Capacidade esperada |
| --- | ---: |
| Piloto controlado | 30 a 100 alunos ativos |
| Uma escola pequena com uso distribuido | 100 a 300 alunos cadastrados |
| Usuarios simultaneos sem IA pesada | 50 a 150 |
| Avaliacoes de voz/IA simultaneas | 5 a 20 |
| Turma inteira enviando audio ao mesmo tempo | Alto risco de lentidao, timeout ou erro |

## Fase 0 - O que da para fazer agora so pelo repositorio

Estas tarefas dependem principalmente de codigo e documentacao. Elas podem ser feitas antes de contratar infraestrutura mais robusta.

### 0.1 Seguranca minima de APIs

Prioridade: alta.

- Adicionar autenticacao e autorizacao nas rotas de criacao, edicao e remocao de textos.
- Garantir que somente professor/coordenador possa alterar conteudo pedagogico.
- Recalcular no servidor os campos criticos da sessao de leitura sempre que possivel:
  - `xpEarned`;
  - `score`;
  - `accuracyPct`;
  - `wcpm`.
- Evitar que o app envie valores finais de XP/ranking sem validacao.
- Bloquear `studentId` divergente do usuario autenticado.

Resultado esperado: reduzir fraude, abuso e corrupcao de ranking.

### 0.2 Limites simples para voz/IA

Prioridade: alta.

- Limitar tamanho maximo do audio enviado.
- Limitar duracao maxima de uma leitura com analise automatica.
- Retornar erro amigavel quando o audio ultrapassar limite.
- Criar limite diario por aluno/turma para analise automatica.
- Registrar no banco quando uma avaliacao falhar por limite, timeout ou erro de provedor.

Resultado esperado: controlar custo e impedir que poucas pessoas derrubem ou encarecam o sistema.

### 0.3 Rate limiting basico

Prioridade: alta.

- Aplicar limite de tentativas em:
  - login por e-mail;
  - busca de alunos por codigo de turma;
  - login por codigo de turma;
  - cadastro;
  - avaliacao por voz/IA;
  - geracao de textos por IA.
- Comecar com uma implementacao simples por IP + rota.
- Evoluir depois para Redis/Upstash ou outro store compartilhado.

Resultado esperado: reduzir ataque, spam e uso abusivo de IA.

### 0.4 Login por turma mais seguro

Prioridade: alta para publicacao aberta.

- Manter o codigo da turma pela praticidade, mas adicionar uma segunda etapa:
  - PIN por aluno;
  - ou aprovacao do professor;
  - ou codigo temporario de convite.
- Evitar retornar dados demais na listagem publica de alunos.
- Registrar tentativas de entrada por turma.

Resultado esperado: impedir que qualquer pessoa com o codigo entre como aluno.

### 0.5 Mobile mais robusto para piloto

Prioridade: media/alta.

- Adicionar botao de sair no app.
- Adicionar tela "Meus dados" no app:
  - ver consentimento;
  - revogar voz;
  - apagar transcricoes;
  - abrir politica de privacidade.
- Mostrar erro claro quando estiver sem internet.
- Adicionar fallback manual no app para leitura sem microfone.
- Ajustar o fluxo para cumprir a regra: aluno pode usar sem microfone.

Resultado esperado: app mais seguro para criancas e mais alinhado com LGPD.

### 0.6 Otimizacao inicial de banco

Prioridade: media.

- Adicionar indices Prisma para consultas frequentes:
  - `ReadingSession.studentId`;
  - `ReadingSession.textId`;
  - `ReadingSession.completedAt`;
  - combinacoes como `studentId + completedAt`;
  - `StudentProfile.classId`;
  - `Class.schoolId`;
  - `Mission.classId`;
  - `MissionProgress.studentId`;
  - `ClassJoinRequest.classId` e `status`.
- Evitar dashboards que carregam historico completo de sessoes.
- Trocar carregamento completo por:
  - ultimas leituras;
  - agregacoes;
  - paginacao.

Resultado esperado: manter paines rapidos com centenas ou milhares de leituras.

### 0.7 Transacoes e consistencia

Prioridade: media.

- Envolver salvamento de sessao, XP, nivel, conquistas e missoes em transacoes.
- Evitar atualizacoes parciais quando uma etapa falhar.
- Padronizar erros de API para o mobile tratar melhor.

Resultado esperado: menos inconsistencia entre leitura salva, XP e conquistas.

### 0.8 Observabilidade simples

Prioridade: media.

- Padronizar logs de erro com contexto:
  - rota;
  - usuario;
  - turma;
  - provedor de IA;
  - tempo de processamento.
- Criar eventos de auditoria basicos para:
  - login;
  - avaliacao por IA;
  - geracao de texto;
  - apagamento de dados.
- Preparar o codigo para integrar Sentry/monitoramento depois.

Resultado esperado: diagnosticar falhas reais durante piloto.

### 0.9 Documentacao de operacao

Prioridade: media.

- Criar checklist de deploy em producao:
  - `DATABASE_URL`;
  - `AUTH_SECRET`;
  - `GEMINI_API_KEY`;
  - dominio HTTPS;
  - politica de privacidade;
  - backups;
  - limite de IA.
- Corrigir inconsistencias de documentacao entre SQLite e PostgreSQL.
- Criar checklist de publicacao Play Store para uso interno/fechado.

Resultado esperado: evitar publicacao com ambiente incompleto.

## Fase 1 - Piloto fechado na Play Store

Objetivo: validar o app em ambiente real sem abrir para qualquer pessoa.

Escopo recomendado:

- teste interno ou fechado na Play Store;
- 1 escola parceira;
- 2 a 5 professores;
- 30 a 100 alunos;
- voz/IA com limite;
- acompanhamento manual dos erros.

Checklist:

- backend HTTPS funcionando;
- banco PostgreSQL de producao;
- secrets configuradas;
- build Android validado em celulares reais;
- politica de privacidade publica;
- ficha de seguranca de dados da Play Store preenchida;
- plano de suporte para professores;
- monitoramento basico ativo.

Criterios para avancar:

- login funciona sem ajuda tecnica;
- leitura salva XP corretamente;
- professores conseguem acompanhar turmas;
- falhas de IA sao compreensiveis para o usuario;
- custo por aluno fica dentro do esperado;
- nao ha relatos graves de perda de dados.

## Fase 2 - Infraestrutura de producao

Estas tarefas ja dependem de servicos externos, configuracao de nuvem ou escolha de fornecedor.

### 2.1 Banco e conexoes

- Usar PostgreSQL gerenciado.
- Configurar pool de conexoes apropriado para serverless.
- Criar rotina de backup.
- Definir ambiente separado para homologacao e producao.
- Usar migracoes formais do Prisma em vez de depender apenas de `db push`.

### 2.2 Monitoramento e alertas

- Integrar Sentry ou ferramenta equivalente.
- Monitorar:
  - erros 500;
  - tempo de resposta;
  - timeout em IA;
  - custo de API;
  - volume de audio;
  - logins falhos.
- Criar alertas para falhas de login, IA e banco.

### 2.3 Controle de custo de IA

- Definir cotas por escola, turma ou plano.
- Criar painel interno de consumo.
- Separar plano com IA de plano sem IA.
- Bloquear uso quando a cota acabar ou pedir liberacao.

## Fase 3 - Arquitetura para muitas turmas ao mesmo tempo

Esta fase exige mudancas mais estruturais.

### 3.1 Fila para audio/IA

Trocar o fluxo atual:

1. app envia audio;
2. servidor processa na hora;
3. aluno espera resposta.

Por um fluxo assincrono:

1. app envia audio;
2. servidor cria um job;
3. fila processa a avaliacao;
4. app consulta o status;
5. resultado aparece quando ficar pronto.

Beneficios:

- evita timeout;
- suaviza pico de uma turma inteira;
- permite retry;
- controla custo;
- melhora experiencia em redes instaveis.

### 3.2 Storage temporario de audio

- Usar storage privado para audio temporario quando necessario.
- Definir expiracao automatica curta.
- Manter a regra LGPD: nao guardar audio permanentemente.
- Registrar apenas transcricao e metricas permitidas.

### 3.3 Cache e consultas agregadas

- Cachear listas de textos e dados pouco mutaveis.
- Criar tabelas ou consultas agregadas para dashboards.
- Evitar recalcular rankings grandes em toda requisicao.
- Paginar historicos.

## Fase 4 - Offline e sincronizacao

Importante para escolas com internet instavel.

- Baixar textos no celular para leitura offline.
- Salvar sessoes pendentes localmente.
- Sincronizar quando a internet voltar.
- Mostrar status claro:
  - salvo no aparelho;
  - sincronizando;
  - salvo na escola.
- Resolver conflitos com regras simples.

Esta fase aumenta bastante a confianca do produto em escolas publicas ou redes com Wi-Fi fraco.

## Fase 5 - Multi-escola e SaaS completo

Quando houver mais clientes, o sistema precisa tratar cada escola como unidade de contrato e operacao.

- Vincular usuarios, turmas, textos, missoes e relatorios por escola.
- Painel de coordenador com dados agregados.
- Permissoes por papel:
  - aluno;
  - professor;
  - coordenador;
  - administrador da plataforma.
- Planos e limites por escola:
  - alunos ativos;
  - professores;
  - minutos de IA;
  - armazenamento;
  - relatorios.
- Exportacao de relatorios com controle de acesso.

## Fase 6 - Pronto para publicacao aberta

Antes de abrir a Play Store para uso amplo, o sistema deve ter:

- APIs criticas protegidas;
- rate limiting em producao;
- fila de IA;
- limites de audio;
- banco com indices e pool;
- monitoramento e alertas;
- politica LGPD revisada;
- tela mobile para dados/consentimento/logout;
- fallback sem microfone;
- termos claros para escolas e responsaveis;
- plano de suporte.

## Ordem sugerida de execucao

1. Proteger rotas e permissoes.
2. Recalcular metricas criticas no servidor.
3. Adicionar limites de audio/IA.
4. Adicionar rate limiting basico.
5. Melhorar login por turma.
6. Corrigir fluxo mobile sem microfone, logout e dados.
7. Adicionar indices e paginacao nos dashboards.
8. Padronizar logs e checklist de producao.
9. Rodar piloto fechado.
10. Configurar banco, pool, backup e monitoramento.
11. Implementar fila de IA.
12. Implementar offline/sincronizacao.
13. Evoluir para SaaS multi-escola completo.

## Decisao pratica

Para o proximo ciclo, o melhor foco e a Fase 0. Ela reduz riscos grandes sem exigir nova arquitetura. Depois disso, o sistema fica mais seguro para piloto fechado e a equipe pode decidir com dados reais se vale investir primeiro em fila de IA, offline ou painel SaaS.
