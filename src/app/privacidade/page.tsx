import Link from "next/link";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

export default function PrivacidadePage() {
  return (
    <article className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="text-muted">
          Versão {PRIVACY_POLICY_VERSION} · Karaokê de Leitura · Última atualização:
          maio/2026
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Quem é responsável (controlador)</h2>
        <p>
          A <strong>escola ou instituição contratante</strong> é a controladora dos
          dados pessoais dos alunos. Esta plataforma atua como operadora/fornecedora
          da ferramenta tecnológica, tratando dados conforme instruções pedagógicas
          da instituição.
        </p>
        <p>
          Dúvidas sobre dados devem ser dirigidas à secretaria ou encarregado (DPO)
          da escola. Contato do projeto: e-mail indicado pela instituição.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. Quais dados coletamos</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nome, e-mail e turma (cadastro)</li>
          <li>Desempenho em leituras: precisão, WCPM, erros, prosódia, XP, datas</li>
          <li>
            <strong>Voz (somente se você consentir):</strong> transcrição em texto da
            fala durante a leitura. <strong>Não armazenamos o arquivo de áudio</strong>{" "}
            no servidor após a análise.
          </li>
          <li>Dados técnicos de sessão (cookie de login)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. Para que usamos (finalidade)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Acompanhamento pedagógico da fluência leitora</li>
          <li>Gamificação e engajamento (XP, missões, ranking)</li>
          <li>Análise automática opcional da leitura oral (com consentimento de voz)</li>
          <li>Relatórios para professores e coordenação</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Base legal (LGPD)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Consentimento</strong> — uso da plataforma e, separadamente, do
            microfone
          </li>
          <li>
            <strong>Legítimo interesse / execução de política educacional</strong> —
            registros de desempenho em atividades de leitura da turma
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. Crianças e adolescentes</h2>
        <p>
          O tratamento de dados de menores exige atenção especial. O uso do{" "}
          <strong>microfone</strong> só é habilitado após confirmação de que o aluno
          tem capacidade ou que o <strong>responsável legal autorizou</strong>. A
          escola deve obter autorizações institucionais que exigir.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. Compartilhamento e transferência</h2>
        <p>
          Se configurada pela escola, transcrições podem ser processadas por serviço
          de IA (ex.: OpenAI Whisper) sob contrato e apenas com a chave fornecida
          pela instituição. Não vendemos dados pessoais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">7. Prazo de guarda</h2>
        <p>
          Dados pedagógicos: enquanto o aluno estiver vinculado à turma e conforme
          política da escola (sugestão: até 2 anos após saída, depois anonimizar ou
          apagar). Transcrições de voz: podem ser apagadas a qualquer momento pelo
          aluno em <Link href="/aluno/dados">Meus dados</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">8. Seus direitos (art. 18 LGPD)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confirmar se tratamos seus dados e acessá-los</li>
          <li>Corrigir dados incompletos ou desatualizados (via escola)</li>
          <li>
            Apagar transcrições de voz na área &quot;Meus dados&quot; do aluno
          </li>
          <li>Revogar consentimento de voz (desativa microfone)</li>
          <li>Solicitar portabilidade ou oposição — via escola</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">9. Segurança</h2>
        <p>
          Senhas armazenadas com hash, sessão autenticada, acesso por perfil
          (aluno/professor). Em produção: HTTPS obrigatório, backups e controle de
          acesso ao servidor.
        </p>
      </section>

      <p className="text-muted text-xs">
        Este texto é modelo educacional. A escola deve revisar com assessoria jurídica
        antes do uso em larga escala.
      </p>

      <Link href="/" className="text-primary hover:underline inline-block">
        ← Voltar ao início
      </Link>
    </article>
  );
}
