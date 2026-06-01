# 🗺️ Masterplan: Karaokê de Leitura

Este documento serve como um guia estratégico e de negócios para a evolução do aplicativo, separando o desenvolvimento em fases claras desde o piloto até a escalabilidade B2B/B2C.

---

### FASE 1: O Piloto e a Validação (Foco Atual)
**Objetivo:** Garantir que a mecânica principal funciona e colher feedback real.
*   **O que fazer:** Fazer o build no Expo e rodar em dispositivos físicos.
*   **Ação:** Hospedar o site (Next.js) e o Banco de Dados (PostgreSQL) na nuvem de forma simples (ex: Vercel + Supabase/Neon).
*   **Testadores:** Selecionar um grupo pequeno de professores parceiros para testar gratuitamente com seus alunos na sala de aula.
*   **Métricas de sucesso:** O app é estável? O login por código da turma funciona fluidamente? Os pontos (XP) e métricas estão sendo salvos corretamente no banco?

### FASE 2: A "Magia" (Integração com IA - Gemini)
**Objetivo:** Eliminar a necessidade de um adulto avaliar a leitura manualmente e habilitar geração de conteúdo infinito.
*   **Speech-to-Text Inteligente:** Enviar o áudio da criança lendo para a API do Gemini comparar com o texto original e calcular automaticamente: erros (omissões, substituições), hesitações e WCPM (Palavras Corretas Por Minuto).
*   **Análise de Prosódia:** A IA avaliar se a criança respeitou a pontuação e teve entonação, gerando um feedback carinhoso (visual ou em áudio).
*   **Geração Dinâmica de Textos:** Ferramenta para professores ou pais gerarem histórias personalizadas baseadas nos interesses da criança (ex: dinossauros, espaço) e no nível de dificuldade exato (foco em sílabas complexas específicas).

### FASE 3: Assinatura para Pais (B2C) e Gamificação Real
**Objetivo:** Monetizar direto com as famílias, transformando o app numa ferramenta de criação de hábitos e redução de atrito em casa.
*   **Economia de Fichas (Recompensas Reais):** Criação de um painel onde os pais configuram prêmios da vida real. Exemplo: *1.000 XP = Ir ao cinema* ou *300 XP = 30 min de YouTube / Videogame*. O app vira a "moeda de troca" produtiva do tempo de tela.
*   **Novo Perfil no Banco:** Criar a estrutura de `ParentProfile` no Prisma para vincular os pais aos perfis dos alunos.
*   **Paywall e Assinatura:** Implementar compras In-App (ex: usando RevenueCat) para gerenciar o "Trial" (7 dias de teste grátis) e a conversão para assinatura mensal/anual diretamente nas lojas (Google Play / App Store).

### FASE 4: Plataforma SaaS para Educadores (B2B e B2B2C)
**Objetivo:** Criar receita recorrente escalável vendendo para profissionais (professores particulares, fonoaudiólogos) e instituições escolares.
*   **Assinatura Professor:** Ferramenta para automatizar a "sondagem de leitura". O professor adiciona a turma, envia as missões de leitura pelo app, e recebe um painel com rankings saudáveis, gráficos de evolução e *insights* gerados por IA sugerindo intervenções pedagógicas.
*   **Assinatura Escola (Enterprise):** Uso da infraestrutura de `CoordinatorProfile` e `School` (já previstas no banco) para vender painéis administrativos completos para coordenadores pedagógicos, permitindo avaliar o desempenho letivo de dezenas de turmas simultaneamente.

### FASE 5: Estratégia de Marketing e Tração
**Objetivo:** Viralizar o conceito, educar o mercado e diminuir o Custo de Aquisição de Clientes (CAC).
*   **O Ângulo de Vendas (Copywriting):** Focar na "Dor da Tela Inútil" (Pais culpados pelo uso excessivo de celulares) e na "Dor do Atraso" (Medo de a criança não se alfabetizar direito ou ficar para trás da turma).
*   **Formato de Anúncios:** Vídeos curtos estilo TikTok/Reels focados em "UGC" (conteúdo gravado de forma autêntica por usuários), mostrando a criança encantada lendo para o celular e a IA corrigindo em tempo real.
*   **Influenciadores:** Fechar parcerias estratégicas com micro-influenciadoras maternas focadas em educação infantil, desenvolvimento, TDAH ou autismo, mostrando o app como uma solução prática e divertida na rotina familiar.