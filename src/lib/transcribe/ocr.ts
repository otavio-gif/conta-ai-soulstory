// OCR de carrosseis via visao do Claude (PRD secao 3.2 e 6). Extrai o texto que
// aparece nas imagens do post. Com MOCK_EXTERNAL=1 a resposta vem de fixture
// (seam do proprio chamarClaude).

import { bloco, blocoImagemUrl, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_OCR } from "@/lib/ai/prompts";
import type { OcrItem, PostColetado } from "@/lib/pipeline/types";

export async function ocrCarrossel(post: PostColetado): Promise<OcrItem | null> {
  if (post.tipoMidia !== "carrossel" || post.imagens.length === 0) return null;

  const resp = await chamarClaude({
    papel: "ocr",
    fixtureKey: `ocr-${post.externalId}`,
    system: [bloco(PROMPT_OCR), await doutrina("coletor-protocolos")],
    conteudo: [
      bloco(
        `Transcreva todo o texto visivel nas imagens do post ${post.externalId}.`,
      ),
      ...post.imagens.slice(0, 10).map(blocoImagemUrl),
    ],
    maxTokens: 2048,
  });

  const texto = resp.texto.trim();
  if (!texto) return null;
  return { postExternalId: post.externalId, texto };
}
