// Transcricao de audio de Reels e videos via API OpenAI (gpt-4o-transcribe),
// PRD secao 6. Baixa o video do videoUrl e transcreve, para qualquer fonte de
// video (Instagram, TikTok, YouTube). No YouTube e o fallback quando nao ha
// legenda oficial. Com MOCK_EXTERNAL=1 le a transcricao de uma fixture, sem
// chamada paga.

import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { lerFixture, MOCK_EXTERNAL, requireEnv } from "@/lib/env";
import { custoTranscricao, registrarCustoEvent } from "@/lib/cost";
import type { PostColetado, TranscricaoItem } from "@/lib/pipeline/types";

const MODELO = "gpt-4o-transcribe";

let clienteSingleton: OpenAI | null = null;
function cliente(): OpenAI {
  if (!clienteSingleton) {
    clienteSingleton = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  }
  return clienteSingleton;
}

export async function transcreverAudio(
  post: PostColetado,
): Promise<TranscricaoItem | null> {
  if (post.tipoMidia !== "reel" && post.tipoMidia !== "video") return null;
  if (!post.videoUrl) return null;

  if (MOCK_EXTERNAL) {
    const mapa = await lerFixture<
      Record<string, { texto: string; idioma?: string }>
    >("whisper/transcricoes.json");
    const t = mapa[post.externalId];
    if (!t) return null;
    return {
      postExternalId: post.externalId,
      fonte: post.fonte,
      texto: t.texto,
      idioma: t.idioma ?? "pt",
      modelo: MODELO,
    };
  }

  // Resiliencia (PRD secao 15): a URL de video de TikTok/Instagram pode estar
  // ausente, ser uma pagina (nao midia) ou ter expirado entre a coleta e a
  // transcricao. Um video que nao transcreve e pulado (null), sem derrubar o
  // pipeline. A lacuna do que faltou e sinalizada no estagio de transcricao.
  try {
    const audio = await fetch(post.videoUrl);
    if (!audio.ok) return null;
    const buffer = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buffer, `${post.externalId}.mp4`, {
      type: "video/mp4",
    });

    const resposta = await cliente().audio.transcriptions.create({
      model: MODELO,
      file,
    });
    const duracao = (resposta as { duration?: number }).duration ?? 60;
    await registrarCustoEvent({
      fonte: post.fonte,
      descricao: `Transcricao ${post.externalId} (${MODELO})`,
      custoBRL: custoTranscricao(duracao),
    });

    return {
      postExternalId: post.externalId,
      fonte: post.fonte,
      texto: resposta.text,
      idioma: resposta.text ? "pt" : null,
      modelo: MODELO,
    };
  } catch {
    return null;
  }
}
