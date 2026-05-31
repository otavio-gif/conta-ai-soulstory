/*
 * Gera o conjunto de fixtures de larga escala (marca grande) em
 * tests/fixtures/grande, para provar volume, tamanho do relatorio (80 a 100
 * paginas) e o comportamento do pipeline em escala, sem credenciais:
 *
 *   pnpm fixtures:gerar:grande
 *
 * O conjunto sobrescreve so os arquivos de alto volume (corpus e saidas de
 * modelo). Tudo que nao for sobrescrito cai para a fixture base (ver env.ts).
 * As saidas de modelo referenciam os externalIds reais gerados aqui, para que a
 * verificacao factual confirme e o relatorio fique lastreado de ponta a ponta.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const RAIZ = path.join(process.cwd(), "tests", "fixtures", "grande");

// Volumes de marca grande, calibrados para a faixa de entrega de 80 a 100
// paginas (PRD secao 14): centenas de pecas e milhares de comentarios.
const N_IG = 70;
const N_TT = 55;
const N_YT = 30;
const N_MEN_WEB = 12;
const N_MEN_TT = 18;
const N_MEN_YT = 15;
const N_MEN_IG = 20;
const COMENTARIOS_POR_PECA = 6;

const MARCA = "Aurora Cafes Especiais";
const HANDLE = "auroracafes";
const JANELA = { inicio: "2026-02-01T00:00:00.000Z", fim: "2026-03-31T23:59:59.000Z" };

const rand = (() => {
  let s = 42;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
})();

function dataNaJanela(i: number, total: number): string {
  // Espalha as pecas pelos dois meses da janela (fev e mar de 2026).
  const inicio = new Date(JANELA.inicio).getTime();
  const fim = new Date(JANELA.fim).getTime();
  return new Date(inicio + ((fim - inicio) * i) / Math.max(1, total)).toISOString();
}

const LEGENDAS = [
  `Origem rastreavel: a ${MARCA} mostra a fazenda parceira e o lote de torra da semana`,
  `Ritual da manha com ${MARCA}, do moedor a xicara, sem pressa`,
  `Torra media da ${MARCA} para quem gosta de doce de caramelo no final`,
  `Bastidores do controle de qualidade dos graos na ${MARCA}`,
  `Como a ${MARCA} escolhe os produtores da Mantiqueira`,
  `Receita de coado perfeito com o cafe da ${MARCA}`,
];
const COMENTARIOS = [
  "Esse cafe mudou minha manha, sabor de caramelo de verdade",
  "Amo saber de onde vem o grao, confianca total na marca",
  "Pedi e chegou rapido, embalagem linda e cheiro otimo",
  "Achei caro mas a qualidade compensa cada centavo",
  "Queria mais opcoes de torra clara, fica a sugestao",
  "Atendimento atencioso quando perguntei sobre o lote",
];

function comentarios(pecaId: string, projetoPrefixo: string) {
  return Array.from({ length: COMENTARIOS_POR_PECA }, (_, j) => ({
    id: `${pecaId}_c${j + 1}`,
    postId: pecaId,
    videoId: pecaId,
    aweme_id: pecaId,
    ownerUsername: `${projetoPrefixo}_user_${(j + 1) * 7}`,
    uniqueId: `${projetoPrefixo}_user_${(j + 1) * 7}`,
    text: COMENTARIOS[(j + Math.floor(rand() * 6)) % COMENTARIOS.length],
    timestamp: dataNaJanela(j, COMENTARIOS_POR_PECA),
    createTimeISO: dataNaJanela(j, COMENTARIOS_POR_PECA),
  }));
}

// ----- Corpus bruto -----

const brandIds: string[] = []; // ids de pecas proprias, para as saidas de modelo
const pecaIds: string[] = []; // todas as pecas (proprias + mencoes), para sentimento

function gerarInstagram() {
  const posts = [];
  const comentariosBrutos: unknown[] = [];
  for (let i = 0; i < N_IG; i++) {
    const id = `ig_g_${String(i + 1).padStart(4, "0")}`;
    const tipo = i % 4 === 0 ? "Sidecar" : i % 3 === 0 ? "Video" : "Image";
    posts.push({
      id,
      shortCode: id,
      type: tipo,
      ownerUsername: HANDLE,
      biography: i === 0 ? `${MARCA}: cafe especial de origem rastreavel.` : undefined,
      caption: LEGENDAS[i % LEGENDAS.length],
      url: `https://instagram.com/p/${id}`,
      timestamp: dataNaJanela(i, N_IG),
      displayUrl: `https://cdn.exemplo/${id}.jpg`,
      images: tipo === "Sidecar" ? [`https://cdn.exemplo/${id}_1.jpg`, `https://cdn.exemplo/${id}_2.jpg`] : [],
      videoUrl: tipo === "Video" ? `https://cdn.exemplo/${id}.mp4` : undefined,
      likesCount: 400 + Math.floor(rand() * 5000),
      commentsCount: 10 + Math.floor(rand() * 300),
      videoViewCount: tipo === "Video" ? 5000 + Math.floor(rand() * 80000) : undefined,
    });
    comentariosBrutos.push(...comentarios(id, "ig"));
    brandIds.push(id);
    pecaIds.push(id);
  }
  return { posts, comentariosBrutos };
}

function gerarTiktok() {
  const videos = [];
  const comentariosBrutos: unknown[] = [];
  for (let i = 0; i < N_TT; i++) {
    const id = `tt_g_${String(i + 1).padStart(4, "0")}`;
    videos.push({
      id,
      createTimeISO: dataNaJanela(i, N_TT),
      authorMeta: { name: HANDLE, signature: i === 0 ? `${MARCA} no TikTok` : "" },
      authorUniqueId: HANDLE,
      text: LEGENDAS[i % LEGENDAS.length],
      webVideoUrl: `https://www.tiktok.com/@${HANDLE}/video/${id}`,
      videoUrl: `https://cdn.exemplo/${id}.mp4`,
      diggCount: 200 + Math.floor(rand() * 9000),
      commentCount: 5 + Math.floor(rand() * 400),
      playCount: 10000 + Math.floor(rand() * 200000),
      shareCount: 10 + Math.floor(rand() * 800),
    });
    comentariosBrutos.push(...comentarios(id, "tt"));
    brandIds.push(id);
    pecaIds.push(id);
  }
  return { videos, comentariosBrutos };
}

function gerarYoutube() {
  const videos = [];
  const comentarios: Record<string, unknown[]> = {};
  const captions: Record<string, { texto: string; idioma: string }> = {};
  for (let i = 0; i < N_YT; i++) {
    const id = `yt_g_${String(i + 1).padStart(4, "0")}`;
    videos.push({
      id,
      snippet: { title: LEGENDAS[i % LEGENDAS.length], publishedAt: dataNaJanela(i, N_YT) },
      statistics: {
        viewCount: String(3000 + Math.floor(rand() * 120000)),
        likeCount: String(100 + Math.floor(rand() * 6000)),
        commentCount: String(2 + Math.floor(rand() * 300)),
      },
    });
    comentarios[id] = Array.from({ length: COMENTARIOS_POR_PECA }, (_, j) => ({
      id: `${id}_c${j + 1}`,
      snippet: {
        topLevelComment: {
          id: `${id}_c${j + 1}`,
          snippet: {
            authorDisplayName: `yt_user_${(j + 1) * 5}`,
            textDisplay: COMENTARIOS[(j + i) % COMENTARIOS.length],
            publishedAt: dataNaJanela(j, COMENTARIOS_POR_PECA),
          },
        },
      },
    }));
    // Metade dos videos com legenda oficial (exercita a via preferida).
    if (i % 2 === 0) captions[id] = { texto: `${LEGENDAS[i % LEGENDAS.length]}. Transcricao oficial da legenda do video.`, idioma: "pt" };
    brandIds.push(id);
    pecaIds.push(id);
  }
  return { videos, comentarios, captions };
}

function gerarMencoes() {
  const web = Array.from({ length: N_MEN_WEB }, (_, i) => ({
    url: `https://portal-noticias.exemplo/materia-${i + 1}`,
    titulo: `${MARCA} cresce no mercado de cafe especial`,
    texto: `Reportagem cita a ${MARCA} como referencia em origem rastreavel e torra artesanal.`,
    autor: `redacao_${i + 1}`,
  }));
  web.forEach((m) => pecaIds.push(`web:${m.url}`));

  const tiktok = Array.from({ length: N_MEN_TT }, (_, i) => {
    const id = `tt_m_${String(i + 1).padStart(3, "0")}`;
    pecaIds.push(`tiktok:${id}`);
    return {
      id,
      createTimeISO: dataNaJanela(i, N_MEN_TT),
      authorMeta: { name: `criador_${i + 1}` },
      authorUniqueId: `criador_${i + 1}`,
      text: `Provei a ${MARCA} e recomendo, sabor incrivel`,
      webVideoUrl: `https://www.tiktok.com/@criador_${i + 1}/video/${id}`,
      diggCount: 100 + Math.floor(rand() * 4000),
      commentCount: 2 + Math.floor(rand() * 150),
      playCount: 5000 + Math.floor(rand() * 90000),
      shareCount: 5 + Math.floor(rand() * 300),
    };
  });

  const youtube = Array.from({ length: N_MEN_YT }, (_, i) => {
    const id = `yt_m_${String(i + 1).padStart(3, "0")}`;
    pecaIds.push(`youtube:${id}`);
    return {
      id,
      snippet: { title: `Review do cafe da ${MARCA}`, publishedAt: dataNaJanela(i, N_MEN_YT) },
      statistics: { viewCount: String(2000 + Math.floor(rand() * 70000)), likeCount: String(50 + Math.floor(rand() * 3000)), commentCount: String(1 + Math.floor(rand() * 120)) },
    };
  });
  const youtubeComentarios: Record<string, unknown[]> = {};
  for (const v of youtube) {
    youtubeComentarios[v.id] = Array.from({ length: 3 }, (_, j) => ({
      id: `${v.id}_c${j + 1}`,
      snippet: { topLevelComment: { id: `${v.id}_c${j + 1}`, snippet: { authorDisplayName: `viewer_${j}`, textDisplay: `Tambem gosto da ${MARCA}`, publishedAt: dataNaJanela(j, 3) } } },
    }));
  }

  const instagram = Array.from({ length: N_MEN_IG }, (_, i) => {
    const id = `ig_m_${String(i + 1).padStart(3, "0")}`;
    pecaIds.push(`instagram:${id}`);
    return {
      id,
      shortCode: id,
      type: "Image",
      ownerUsername: `perfil_${i + 1}`,
      caption: `Meu ritual com a ${MARCA} pela manha`,
      url: `https://instagram.com/p/${id}`,
      timestamp: dataNaJanela(i, N_MEN_IG),
      displayUrl: `https://cdn.exemplo/${id}.jpg`,
      likesCount: 50 + Math.floor(rand() * 2000),
      commentsCount: 1 + Math.floor(rand() * 100),
    };
  });

  return { web, tiktok, youtube, youtubeComentarios, instagram };
}

// ----- Saidas de modelo consistentes com os ids gerados -----

function paragrafo(tema: string, n: number): string {
  return (
    `${tema}. A leitura da percepcao publica da ${MARCA} mostra um padrao consistente ao longo da janela, ` +
    `ancorado em evidencia coletada e verificada, sem nenhuma estimativa. O publico reage de forma recorrente ` +
    `a origem rastreavel e a torra, e a marca colhe confianca quando expoe os bastidores. Este paragrafo ${n} ` +
    `consolida o ponto com densidade de consultoria, conectando o dado bruto a uma conclusao pratica para o time de marca.`
  );
}

function secoesRedacao(titulos: string[], grafico?: string) {
  return titulos.map((titulo) => ({
    titulo,
    paragrafos: Array.from({ length: 9 }, (_, i) => paragrafo(titulo, i + 1)),
    callouts: [{ eyebrow: "Leitura", texto: `${titulo}: o sinal aparece de forma consistente na conversa publica da ${MARCA}.` }],
    cards: [
      { numero: "01", titulo: "Sinal", texto: "O que a percepcao publica evidencia, lastreado em dado bruto." },
      { numero: "02", titulo: "Implicacao", texto: "O que isso sugere para a marca, sem extrapolar o dado." },
    ],
    graficos: grafico ? [grafico] : [],
  }));
}

async function escrever(rel: string, dados: unknown) {
  const caminho = path.join(RAIZ, rel);
  await fs.mkdir(path.dirname(caminho), { recursive: true });
  await fs.writeFile(caminho, JSON.stringify(dados, null, 2), "utf8");
}

async function main() {
  await fs.rm(RAIZ, { recursive: true, force: true });

  const ig = gerarInstagram();
  const tt = gerarTiktok();
  const yt = gerarYoutube();
  const men = gerarMencoes();

  // Corpus bruto por fonte.
  await escrever("apify/instagram-posts.json", ig.posts);
  await escrever("apify/instagram-comments.json", ig.comentariosBrutos);
  await escrever("apify/instagram-profile.json", { biography: `${MARCA}: cafe especial de origem rastreavel.` });
  await escrever("tiktok/tiktok-videos.json", tt.videos);
  await escrever("tiktok/tiktok-comments.json", tt.comentariosBrutos);
  await escrever("tiktok/tiktok-profile.json", { signature: `${MARCA} no TikTok` });
  await escrever("youtube/youtube-videos.json", yt.videos);
  await escrever("youtube/youtube-comments.json", yt.comentarios);
  await escrever("youtube/captions.json", yt.captions);
  await escrever("youtube/channel.json", { snippet: { description: `${MARCA} no YouTube` } });
  await escrever("mencoes/web-terceiros.json", men.web);
  await escrever("mencoes/tiktok-terceiros.json", men.tiktok);
  await escrever("mencoes/youtube-terceiros.json", men.youtube);
  await escrever("mencoes/youtube-terceiros-comentarios.json", men.youtubeComentarios);
  await escrever("mencoes/instagram-terceiros.json", men.instagram);

  // Whisper: transcricao de fallback para parte dos videos (reels e TikTok).
  const videoIds = brandIds.filter((id) => id.startsWith("tt_g_")).slice(0, 40);
  const transcricoes: Record<string, { texto: string; idioma: string }> = {};
  for (const id of videoIds) transcricoes[id] = { texto: `Conteudo falado sobre a ${MARCA}, torra e origem.`, idioma: "pt" };
  await escrever("whisper/transcricoes.json", transcricoes);

  // Interprete: plano de coleta da marca grande, com todas as fontes ativas.
  await escrever("anthropic/interprete.json", {
    dados: {
      marca: MARCA,
      tipo: "marca",
      instagramHandle: HANDLE,
      reclameAquiUrl: "https://www.reclameaqui.com.br/empresa/aurora-cafes/",
      tiktokHandle: HANDLE,
      youtubeHandle: HANDLE,
      palavrasChave: ["cafe especial", "torra artesanal", "origem rastreavel"],
      termosBusca: [MARCA, "Aurora Cafes", "cafe Aurora"],
      dominiosMarca: ["auroracafes.com.br"],
      volumeInstagram: N_IG,
      volumeReclameAqui: 30,
      volumeTiktok: N_TT,
      volumeYoutube: N_YT,
      volumeSeoSerp: 3,
      volumeMencoes: N_MEN_WEB + N_MEN_TT + N_MEN_YT + N_MEN_IG,
    },
  });

  // Analista por post (default por papel): insights e glossario, sem claims (os
  // claims lastreados vem das analises deterministicas e da sintese).
  await escrever("anthropic/analista_conteudo.default.json", {
    dados: {
      insights: [
        { titulo: "Origem rastreavel ancora a confianca", conteudo: `O publico responde a procedencia exposta pela ${MARCA}.`, suportes: [] },
      ],
      claims: [],
      termosNativos: [
        { termo: "torra media", definicao: "Como o publico chama o perfil de torra equilibrado da marca." },
        { termo: "cafe de origem", definicao: "Termo do publico para o cafe com fazenda e lote rastreaveis." },
      ],
    },
  });
  await escrever("anthropic/ocr.default.json", { texto: `Texto em tela do carrossel da ${MARCA}: origem, torra e ritual.` });

  // Cientista: claims quantitativos lastreados, mais a de salvamentos sem
  // suporte (rejeitada na origem pela regra de ouro: prova a descartada).
  const top = brandIds.slice(0, 3);
  await escrever("anthropic/cientista.json", {
    dados: {
      insights: [
        { titulo: "Reels lideram o alcance publico", conteudo: "Os videos concentram as maiores visualizacoes publicas na janela.", suportes: top },
      ],
      claims: [
        { texto: `As pecas de maior alcance da ${MARCA} estao entre os videos da janela.`, tipoSuporte: "agregacao", suportes: top, parte: "I" },
        { texto: "A marca tem alto indice de salvamentos no Instagram.", tipoSuporte: "agregacao", suportes: [], parte: "I" },
      ],
    },
  });

  // Viralizacao: fatores de destaque dos itens de maior alcance.
  await escrever("anthropic/viralizacao.json", {
    dados: {
      insights: [{ titulo: "Origem e bastidores puxam o alcance", conteudo: "Os itens que mostram fazenda e torra se destacam em visualizacoes.", suportes: top }],
      claims: [{ texto: "Os itens de bastidores de torra estao entre os de maior visualizacao publica.", tipoSuporte: "padrao_observado", suportes: top }],
    },
  });

  // Sentimento: classifica TODAS as pecas (proprias e mencoes) por externalId.
  await escrever("anthropic/sentimento.json", {
    dados: {
      classificacoes: pecaIds.map((id, i) => ({
        externalId: id,
        sentimento: i % 5 === 0 ? "negativo" : i % 3 === 0 ? "neutro" : "positivo",
      })),
    },
  });

  // Temas: 10 temas, cada um lastreado num lote real de pecas.
  const nomesTema = [
    "Origem e rastreabilidade", "Perfil de torra", "Ritual e preparo", "Preco e custo-beneficio",
    "Atendimento e suporte", "Entrega e logistica", "Sustentabilidade", "Comunidade e produtores",
    "Embalagem e presente", "Sabor e notas sensoriais",
  ];
  const lote = Math.ceil(brandIds.length / nomesTema.length);
  await escrever("anthropic/temas.json", {
    dados: {
      temas: nomesTema.map((tema, i) => ({
        tema,
        descricao: `O tema ${tema} aparece de forma recorrente na conversa publica sobre a ${MARCA}, sustentado por pecas reais da janela.`,
        itens: brandIds.slice(i * lote, i * lote + Math.min(lote, 12)),
      })),
    },
  });

  // Sintese: um achado e um claim por construto, lastreados em pecas reais.
  const construtos = ["gap_percepcao", "promotores", "detratores", "aceleradores", "persona", "ondas_valor", "depara"];
  await escrever("anthropic/sintese.json", {
    dados: {
      findings: construtos.map((c, i) => ({
        construto: c,
        titulo: `Sintese de ${c}`,
        conteudo: `Leitura de ${c} da ${MARCA} consolidada a partir das oticas, sem dado novo.`,
        suportes: brandIds.slice(i * 4, i * 4 + 4),
      })),
      claims: construtos.map((c, i) => ({
        texto: `Conclusao de ${c} lastreada na percepcao publica da ${MARCA}.`,
        tipoSuporte: "padrao_observado",
        suportes: brandIds.slice(i * 4, i * 4 + 4),
        construto: c,
      })),
    },
  });

  // Verificacao: confirma por indice. Generoso (cobre qualquer contagem de claims).
  await escrever("anthropic/verificacao.json", {
    dados: { classificacoes: Array.from({ length: 4000 }, (_, i) => ({ indice: i, status: "confirmada" })) },
  });

  // Redacao densa das duas partes (varias secoes, paragrafos longos).
  await escrever("anthropic/redacao-parte-1.json", {
    dados: {
      secoes: secoesRedacao(
        ["Como a marca e vista", "Viralizacao e desempenho publico", "Linguagem nativa do publico", "Linha do tempo da conversa", "Formatos e horarios de pico", "Sentimento ao longo da janela"],
        "engajamento-curtidas",
      ),
    },
  });
  await escrever("anthropic/redacao-parte-2.json", {
    dados: {
      secoes: secoesRedacao(
        ["Gap de percepcao", "Promotores", "Detratores", "Aceleradores", "Insights de persona", "Ondas de valor", "Insumo para o DE/PARA"],
      ),
    },
  });

  console.log(
    `Fixtures de larga escala geradas em tests/fixtures/grande:\n` +
      `  ${N_IG} posts IG, ${N_TT} videos TT, ${N_YT} videos YT, ${men.web.length + men.tiktok.length + men.youtube.length + men.instagram.length} mencoes.\n` +
      `  ${pecaIds.length} pecas no total, ${pecaIds.length * 0 + brandIds.length} proprias.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
