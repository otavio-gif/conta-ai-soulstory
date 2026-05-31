// Transcricao de audio dos Reels via API OpenAI (gpt-4o-transcribe), PRD secao
// 6. Baixa o mp4 do payload do Apify e transcreve. Com MOCK_EXTERNAL=1 le a
// transcricao de uma fixture, sem chamada paga.

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

export async function transcreverReel(
  post: PostColetado,
): Promise<TranscricaoItem | null> {
  if (post.tipoMidia !== "reel" || !post.videoUrl) return null;

  if (MOCK_EXTERNAL) {
    const mapa = await lerFixture<
      Record<string, { texto: string; idioma?: string }>
    >("whisper/transcricoes.json");
    const t = mapa[post.externalId];
    if (!t) return null;
    return {
      postExternalId: post.externalId,
      texto: t.texto,
      idioma: t.idioma ?? "pt",
      modelo: MODELO,
    };
  }

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
    fonte: "instagram",
    descricao: `Transcricao Reel ${post.externalId} (${MODELO})`,
    custoBRL: custoTranscricao(duracao),
  });

  return {
    postExternalId: post.externalId,
    texto: resposta.text,
    idioma: "pt",
    modelo: MODELO,
  };
}
