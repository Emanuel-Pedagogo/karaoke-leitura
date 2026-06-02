import PptxGenJS from "pptxgenjs";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "docs", "TREINAMENTO-APOIADORES.pptx");

const COLORS = {
  primary: "2563EB",
  dark: "1E293B",
  muted: "64748B",
  accent: "F59E0B",
  light: "F8FAFC",
  white: "FFFFFF",
};

/** @type {Array<{ title: string; subtitle?: string; bullets?: string[]; body?: string[]; table?: { headers: string[]; rows: string[][] }; notes?: string }>} */
const slides = [
  {
    title: "Karaokê de Leitura",
    subtitle: "Formação para Professores Apoiadores",
    bullets: [
      "Prática oral gamificada para fluência leitora",
      "[Nome da escola / projeto]",
      "[Data]",
    ],
    notes:
      "Boas-vindas. Pergunte quantos já trabalharam com leitura em voz alta na sala. Anote expectativas no quadro (2 min).",
  },
  {
    title: "Por que estamos aqui?",
    body: ["O desafio", "A proposta"],
    bullets: [
      "Muitos alunos leem pouco em voz alta",
      "Insegurança ao ler para os colegas",
      "Dificuldade de acompanhar quem pratica em casa",
      "",
      "Transformar a leitura em experiência lúdica e motivadora",
      "Registrar progresso de forma automática",
      "Dar ao professor dados para intervenção pedagógica",
    ],
    notes:
      'Não é "substituir o professor". É ampliar a prática e o acompanhamento.',
  },
  {
    title: "O que é o Karaokê de Leitura?",
    body: [
      "Plataforma educacional onde o aluno lê em voz alta enquanto o texto avança palavra a palavra — como um karaokê — e recebe feedback sobre fluência e precisão.",
    ],
    bullets: [
      "Leitura interativa — destaque progressivo das palavras",
      "Avaliação — precisão, palavras/min, prosódia",
      "Gamificação — XP, níveis, missões, conquistas",
    ],
    notes: "Mostre print ou demo rápida da tela de leitura (30 s).",
  },
  {
    title: "Quem faz o quê?",
    table: {
      headers: ["Papel", "Onde entra", "Função principal"],
      rows: [
        ["Aluno", "App no celular", "Lê textos, ganha XP"],
        ["Professor apoiador", "Na sala", "Facilita login, ambiente e encorajamento"],
        ["Professor titular", "Navegador (web)", "Textos, metas, missões, relatórios"],
        ["Coordenador", "Navegador (web)", "Visão da escola"],
      ],
    },
    bullets: ["No celular, só entra conta de aluno. Professor usa computador."],
    notes: "Detalhe que confunde: professor não faz login no app mobile.",
  },
  {
    title: "Seu papel como apoiador",
    subtitle: "Você facilita. Você não corrige tudo.",
    table: {
      headers: ["Faça", "Evite"],
      rows: [
        ["Ambiente calmo e silencioso", "Comparar alunos em voz alta"],
        ["Ajudar no login (código + nome)", "Forçar uso do microfone"],
        ["Ajustar velocidade do karaokê", "Pressionar por ranking"],
        ["Celebrar esforço e progresso", "Interromper a leitura no meio"],
        ["Anotar dificuldades para o titular", "Julgar só pela nota"],
      ],
    },
    bullets: [
      "Seu trabalho é fazer a leitura acontecer com segurança e leveza.",
    ],
    notes: "Atividade relâmpago: frases de encorajamento em duplas (3 min).",
  },
  {
    title: "Fluxo na sala (visão geral)",
    body: [
      "Login → Escolher texto → Ajustar velocidade → Ler em voz alta → Resultado → Celebrar",
    ],
    bullets: [
      "Aluno entra com código da turma + nome",
      "Aceita privacidade (primeira vez)",
      "Escolhe um texto",
      "Inicia leitura (microfone autorizado)",
      "Texto avança; aluno lê até o fim",
      "Sistema avalia e mostra precisão, XP, conquistas",
    ],
    notes: "Anuncie demo completa no slide 14.",
  },
  {
    title: "Login do aluno (passo a passo)",
    subtitle: "No celular",
    bullets: [
      "Abrir o app Karaokê de Leitura",
      "Aba Código da turma",
      "Digitar código (ex.: TURMA3A) — professor vê no dashboard",
      "Buscar alunos da turma",
      "Escolher o nome na lista",
      "Entrar como aluno",
      "",
      "Vários alunos no mesmo aparelho?",
      "Sair → Trocar de aluno → repetir com outro nome",
    ],
    notes: "Escreva o código real da turma no quadro.",
  },
  {
    title: "A tela de leitura",
    body: ["Antes de iniciar", "Durante", "Depois"],
    bullets: [
      "Escolher texto (Iniciante / Intermediário / Avançado)",
      "Ajustar velocidade (0,5× a 2×)",
      "Confirmar consentimento de microfone",
      "",
      "Palavra atual destacada; aluno lê em voz alta até o fim",
      "",
      "Precisão, palavras/min, pontuação, XP, conquistas",
    ],
    notes: "Não interrompam a leitura no meio.",
  },
  {
    title: "O que medimos?",
    table: {
      headers: ["Métrica", "Significado", "Como explicar"],
      rows: [
        ["Precisão", "% de palavras corretas", "De 100 palavras, quantas acertou?"],
        ["Palavras/min", "Ritmo de leitura correta", "Palavras certas por minuto"],
        ["Prosódia", "Expressividade", "Leu com voz de pergunta? De emoção?"],
        ["Omissão", "Pulou palavra", "Esqueceu de ler"],
        ["Substituição", "Trocou a palavra", "Falou outra palavra no lugar"],
        ["Hesitação", "Travou ou repetiu", "Ficou em dúvida"],
      ],
    },
    notes: "IA sugere os erros; professor titular pode revisar no histórico.",
  },
  {
    title: "Gamificação: XP e Níveis",
    bullets: [
      "XP — ganho a cada leitura concluída (mínimo 10)",
      "Quanto melhor a leitura → mais XP",
      "500 XP = 1 nível",
      "Nível 1 → 2 aos 500 XP, 2 → 3 aos 1000 XP…",
      "Barra de progresso na tela inicial",
      "",
      "Analogia: Cada leitura é uma partida. XP é sua moeda de treino.",
    ],
    notes: "Use analogia de jogo para explicar às crianças.",
  },
  {
    title: "Gamificação: Combo, Missões, Conquistas",
    bullets: [
      "Combo — leituras seguidas com precisão ≥ 90% → bônus na pontuação",
      "Errou muito? Combo zera — incentive nova tentativa",
      "",
      "Missões — desafios do professor (ex.: 1 leitura hoje) → XP bônus",
      "",
      "Conquistas:",
      "  Primeira Leitura",
      "  Leitor Fluente (60+ palavras/min)",
      "  Precisão de Ouro (100%)",
    ],
    notes: "Desbloquear conquista é momento de celebrar.",
  },
  {
    title: "Ranking: como usar sem desmotivar",
    bullets: [
      "Ranking semanal — reinicia toda semana",
      "Ordena por XP da semana (prática recente)",
      "",
      "Boas práticas:",
      "Celebrar participação: Quem praticou esta semana?",
      "Evitar expor quem está em último",
      "Cada aluno tem ritmo diferente",
      "",
      "O ranking mostra quem praticou. O importante é ler com regularidade.",
    ],
    notes: "Discussão: como evitar competição tóxica? (2 min)",
  },
  {
    title: "Dificuldade dos textos",
    table: {
      headers: ["Nível", "Para quem", "Quando indicar"],
      rows: [
        ["Iniciante", "Alfabetização", "Primeira sessão, aluno inseguro"],
        ["Intermediário", "Consolidação", "Já lê com alguma fluência"],
        ["Avançado", "Textos complexos", "Alta precisão e bom ritmo"],
      ],
    },
    bullets: ["Regra: na dúvida, comece mais fácil. Sucesso gera confiança."],
    notes: "Antes da demo ao vivo.",
  },
  {
    title: "Demo ao vivo",
    subtitle: "Roteiro rápido (5 min)",
    bullets: [
      "Login com código da turma",
      "Escolher texto Iniciante",
      "Velocidade 0,8×",
      "Ler em voz alta até o fim",
      "Mostrar tela de resultado (precisão, XP)",
      "",
      "Convide: Alguém quer tentar uma frase? (opcional)",
    ],
    notes: "Se demo falhar, use prints. Ambiente silencioso e internet estável.",
  },
  {
    title: "LGPD e microfone",
    bullets: [
      "Escola é controladora dos dados",
      "Primeira entrada: aluno aceita política de privacidade",
      "Microfone é opcional — sem consentimento, sem avaliação por voz",
      "Áudio não fica guardado no servidor",
      "Aluno pode apagar dados em Meus dados",
      "",
      "Nunca force gravação.",
      "Frase para pais: Microfone só para avaliar a leitura. Opcional e revogável.",
    ],
    notes: "Respeite recusa ou constrangimento.",
  },
  {
    title: "Problemas comuns e soluções",
    table: {
      headers: ["Problema", "O que fazer"],
      rows: [
        ["Lista de textos vazia", "Professor cadastra em Textos"],
        ["Microfone não funciona", "Consentimento + ambiente silencioso"],
        ['IA "errou" na correção', "Tentar de novo; ruído atrapalha"],
        ["Aluno travou / chorou", "Pausar; texto mais fácil; velocidade menor"],
        ["Sem internet", "Leitura não salva — aguardar conexão"],
        ["Vários alunos, 1 celular", "Sair → trocar de aluno → novo login"],
      ],
    },
    notes: "Pergunte problemas que já viveram na escola.",
  },
  {
    title: "Atividade prática (duplas)",
    subtitle: "15 minutos",
    bullets: [
      "Formar duplas: apoiador + aluno simulado",
      "Apoiador conduz login e leitura",
      "Checklist: ambiente, login, velocidade, encorajamento",
      "Trocar papéis",
      "Plenária: 2 aprendizados + 1 dúvida",
    ],
    notes: "Circule durante a atividade. Anote boas práticas para elogiar.",
  },
  {
    title: "Encerramento e próximos passos",
    bullets: [
      "Hoje você aprendeu:",
      "  Objetivo pedagógico do sistema",
      "  Seu papel na sala",
      "  Gamificação (XP, combo, missões, ranking)",
      "  Fluxo login → leitura → resultado",
      "  LGPD e microfone",
      "",
      "Depois: código anotado, handout, dúvidas → professor titular",
      "",
      "Obrigado! Boa leitura com a turma.",
    ],
    notes: "Feedback rápido 1–5: pronto para apoiar na sala?",
  },
];

function addHeader(slide, pptx, title, subtitle) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.08,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
  });

  slide.addText(title, {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: subtitle ? 0.7 : 1,
    fontSize: subtitle ? 28 : 32,
    bold: true,
    color: COLORS.dark,
    fontFace: "Calibri",
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 1.05,
      w: 9,
      h: 0.5,
      fontSize: 18,
      color: COLORS.muted,
      fontFace: "Calibri",
    });
  }
}

function addBullets(slide, items, startY = 1.6) {
  const filtered = items.filter((b) => b !== undefined);
  if (filtered.length === 0) return;

  slide.addText(
    filtered.map((text) => ({
      text,
      options: {
        bullet: text !== "" && !text.startsWith("  ") && !text.includes("→"),
        indentLevel: text.startsWith("  ") ? 1 : 0,
        fontSize: text === "" ? 6 : 16,
        color: COLORS.dark,
        breakLine: true,
      },
    })),
    {
      x: 0.5,
      y: startY,
      w: 9,
      h: 5.2 - startY,
      valign: "top",
      fontFace: "Calibri",
    },
  );
}

function addTable(slide, table, startY = 1.5) {
  const rows = [table.headers, ...table.rows];
  const colW = table.headers.length === 3 ? [1.8, 2.4, 4.3] : [4.2, 4.3];

  slide.addTable(rows, {
    x: 0.4,
    y: startY,
    w: 9.2,
    colW,
    fontSize: 12,
    fontFace: "Calibri",
    border: { type: "solid", color: "CBD5E1", pt: 0.75 },
    fill: { color: COLORS.white },
    color: COLORS.dark,
    autoPage: false,
  });
}

function buildPresentation() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Karaokê de Leitura";
  pptx.title = "Formação para Professores Apoiadores";
  pptx.subject = "Treinamento de professores apoiadores";

  for (const data of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.light };

    if (data.title === "Karaokê de Leitura" && !data.table) {
      slide.background = { color: COLORS.primary };
      slide.addText(data.title, {
        x: 0.5,
        y: 2.0,
        w: 9,
        h: 1,
        fontSize: 40,
        bold: true,
        color: COLORS.white,
        align: "center",
        fontFace: "Calibri",
      });
      slide.addText(data.subtitle ?? "", {
        x: 0.5,
        y: 3.0,
        w: 9,
        h: 0.6,
        fontSize: 24,
        color: "DBEAFE",
        align: "center",
        fontFace: "Calibri",
      });
      if (data.bullets?.length) {
        slide.addText(data.bullets.join("\n"), {
          x: 0.5,
          y: 4.0,
          w: 9,
          h: 1.5,
          fontSize: 16,
          color: COLORS.white,
          align: "center",
          fontFace: "Calibri",
        });
      }
    } else {
      addHeader(slide, pptx, data.title, data.subtitle);

      let contentY = data.subtitle ? 1.65 : 1.45;

      if (data.body?.length) {
        for (const paragraph of data.body) {
          slide.addText(paragraph, {
            x: 0.5,
            y: contentY,
            w: 9,
            h: 0.45,
            fontSize: paragraph.length > 80 ? 14 : 16,
            bold: paragraph.length < 30,
            color: paragraph.length < 30 ? COLORS.primary : COLORS.dark,
            fontFace: "Calibri",
            italic: paragraph.length > 80,
          });
          contentY += paragraph.length > 80 ? 0.75 : 0.4;
        }
        contentY += 0.1;
      }

      if (data.table) {
        addTable(slide, data.table, contentY);
        if (data.bullets?.length) {
          addBullets(slide, data.bullets, contentY + 2.35);
        }
      } else if (data.bullets?.length) {
        addBullets(slide, data.bullets, contentY);
      }
    }

    if (data.notes) {
      slide.addNotes(data.notes);
    }
  }

  return pptx;
}

const pptx = buildPresentation();
await pptx.writeFile({ fileName: outPath });
console.log(`Gerado: ${outPath}`);
