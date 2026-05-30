// Verificacao factual independente e BLOQUEANTE (PRD secao 9.4, skill
// fact-check-ve). Roda em Opus por ser a guardia da fidelidade. Resolve os
// suportes de cada afirmacao nos dados brutos do corpus e classifica em
// confirmada, imprecisa ou nao_sustentada. Sem lastro, sai do relatorio.

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_VERIFICADOR } from "@/lib/ai/prompts";
import type {
  ClaimCandidato,
  ClaimStatus,
  ClaimVerificada,
  Corpus,
  ResultadoVerificacao,
} from "@/lib/pipeline/types";

/** Indice id -> trecho do dado bruto, para a verificacao olhar so o que e citado. */
function indiceEvidencias(corpus: Corpus): Map<string, string> {
  const idx = new Map<string, string>();
  for (const p of corpus.posts) {
    const pub = p.metricas
      .filter((m) => m.disponivel)
      .map((m) => `${m.nome}=${m.valor}`)
      .join(", ");
    const indisp = p.metricas
      .filter((m) => !m.disponivel)
      .map((m) => m.nome)
      .join(", ");
    // Transcricao de audio, legenda oficial ou OCR sustentam claims sobre o que
    // foi dito ou escrito no item, sem precisar de um support-id novo.
    const transcricao = corpus.transcricoes.find(
      (t) => t.postExternalId === p.externalId,
    );
    const ocr = corpus.ocr.find((o) => o.postExternalId === p.externalId);
    const conteudo = transcricao
      ? ` Transcricao/legenda (${transcricao.modelo}): "${transcricao.texto.slice(0, 800)}".`
      : ocr
        ? ` OCR: "${ocr.texto.slice(0, 800)}".`
        : "";
    idx.set(
      p.externalId,
      `Item ${p.externalId} (${p.fonte}, ${p.tipoMidia}, ${p.publicadoEm.slice(0, 10)}). Legenda: "${p.legenda}". Metricas publicas: ${pub || "n/d"}. Metricas indisponiveis: ${indisp}. Comentarios coletados: ${p.comentarios.length}.${conteudo}`,
    );
    for (const c of p.comentarios) {
      idx.set(
        c.id,
        `Comentario ${c.id} (autor ${c.autor}) no post ${p.externalId}: "${c.texto}".`,
      );
    }
  }
  for (const r of corpus.reclamacoes) {
    idx.set(
      r.id,
      `Reclamacao ${r.id}: "${r.titulo}". Texto: "${r.texto}". Status: ${r.status ?? "n/d"}. Resposta da marca: ${r.resposta ? `"${r.resposta}"` : "sem resposta"}.`,
    );
  }
  return idx;
}

interface ClassificacaoIA {
  indice: number;
  status: ClaimStatus;
  nota?: string;
  textoAjustado?: string;
}

export async function verificar(
  corpus: Corpus,
  candidatos: ClaimCandidato[],
): Promise<ResultadoVerificacao> {
  const idx = indiceEvidencias(corpus);

  // Regra de ouro: sem suporte, rejeita na origem, sem gastar verificacao.
  const semSuporte: ClaimVerificada[] = [];
  const aVerificar: ClaimCandidato[] = [];
  for (const c of candidatos) {
    if (!c.suportes || c.suportes.length === 0) {
      semSuporte.push({
        texto: c.texto,
        tipoSuporte: c.tipoSuporte,
        suportes: [],
        status: "nao_sustentada",
        nota: "Sem evidencia ligada. Rejeitada na origem pela regra de ouro.",
        parte: c.parte,
        construto: c.construto,
      });
    } else {
      aVerificar.push(c);
    }
  }

  let classificadas: ClaimVerificada[] = [];
  if (aVerificar.length > 0) {
    const entrada = aVerificar.map((c, i) => ({
      indice: i,
      texto: c.texto,
      tipoSuporte: c.tipoSuporte,
      evidencias: c.suportes.map((id) => ({
        id,
        conteudo: idx.get(id) ?? "(suporte nao encontrado no corpus)",
      })),
    }));

    const resp = await chamarClaude<{ classificacoes: ClassificacaoIA[] }>({
      papel: "verificador",
      fixtureKey: "verificacao",
      system: [
        bloco(PROMPT_VERIFICADOR),
        await doutrina("fact-check-ve", "evidence-ledger"),
      ],
      conteudo: [
        blocoCacheavel(JSON.stringify(entrada, null, 2)),
        bloco(
          "Classifique cada afirmacao pelo indice. Olhe apenas as evidencias listadas. Metrica nao publica e sempre nao_sustentada. Quando imprecisa, devolva textoAjustado fiel ao dado.",
        ),
      ],
      ferramenta: {
        nome: "registrar_verificacao",
        descricao: "Classifica cada afirmacao contra as evidencias citadas.",
        schema: {
          type: "object",
          properties: {
            classificacoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indice: { type: "number" },
                  status: {
                    type: "string",
                    enum: ["confirmada", "imprecisa", "nao_sustentada"],
                  },
                  nota: { type: "string" },
                  textoAjustado: { type: "string" },
                },
                required: ["indice", "status"],
              },
            },
          },
          required: ["classificacoes"],
        },
        parse: (e) => e as { classificacoes: ClassificacaoIA[] },
      },
    });

    const porIndice = new Map<number, ClassificacaoIA>();
    for (const c of resp.dados?.classificacoes ?? []) porIndice.set(c.indice, c);

    classificadas = aVerificar.map((c, i) => {
      const cl = porIndice.get(i);
      // Sem retorno do verificador, rebaixa por seguranca.
      const status: ClaimStatus = cl?.status ?? "nao_sustentada";
      const texto =
        status === "imprecisa" && cl?.textoAjustado ? cl.textoAjustado : c.texto;
      return {
        texto,
        tipoSuporte: c.tipoSuporte,
        suportes: c.suportes,
        status,
        nota: cl?.nota,
        parte: c.parte,
        construto: c.construto,
      };
    });
  }

  const claims = [...classificadas, ...semSuporte];
  return {
    claims,
    confirmadas: claims.filter(
      (c) => c.status === "confirmada" || c.status === "imprecisa",
    ).length,
    descartadas: claims.filter((c) => c.status === "nao_sustentada").length,
  };
}

/** Afirmacoes que entram no relatorio (confirmadas e imprecisas ajustadas). */
export function afirmacoesValidas(r: ResultadoVerificacao): ClaimVerificada[] {
  return r.claims.filter(
    (c) => c.status === "confirmada" || c.status === "imprecisa",
  );
}
