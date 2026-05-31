// Teste de conexao das APIs externas (degrau 1 do primeiro run real).
// Faz uma chamada minima e barata a cada servico so para confirmar que a chave
// e valida e funciona, antes de qualquer run pago de verdade. Nao roda o
// pipeline, nao usa Trigger.dev nem webhook. Nunca imprime o valor de segredo.
//
// Rodar: pnpm smoke:apis
//
// Custo: praticamente zero. Anthropic gasta fracao de centavo (max_tokens 1),
// Firecrawl consome 1 credito, YouTube 1 unidade de cota. OpenAI, Apify e
// DataForSEO usam endpoints de conta, que sao gratuitos.

// Carrega o .env para process.env (Node 20.12+). Feito antes de qualquer import
// que leia variavel de ambiente em tempo de modulo (ex.: o cliente Prisma).
process.loadEnvFile(".env");

type Resultado = {
  servico: string;
  ok: boolean;
  detalhe: string;
};

const TIMEOUT_MS = 20000;

/** fetch com timeout, para uma chamada travada nao segurar o teste todo. */
async function buscar(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function exige(nome: string): string {
  const v = process.env[nome];
  if (!v) throw new Error(`variavel ${nome} vazia no .env`);
  return v;
}

async function testarAnthropic(): Promise<Resultado> {
  const servico = "Anthropic (Claude)";
  try {
    const key = exige("ANTHROPIC_API_KEY");
    const resp = await buscar("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "oi" }],
      }),
    });
    if (!resp.ok) {
      const corpo = await resp.text();
      return { servico, ok: false, detalhe: `HTTP ${resp.status}: ${corpo.slice(0, 160)}` };
    }
    const j = (await resp.json()) as { model?: string };
    return { servico, ok: true, detalhe: `respondeu com ${j.model ?? "modelo ok"}` };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e) };
  }
}

async function testarOpenAI(): Promise<Resultado> {
  const servico = "OpenAI (Whisper/transcricao)";
  try {
    const key = exige("OPENAI_API_KEY");
    const resp = await buscar("https://api.openai.com/v1/models", {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!resp.ok) {
      const corpo = await resp.text();
      return { servico, ok: false, detalhe: `HTTP ${resp.status}: ${corpo.slice(0, 160)}` };
    }
    const j = (await resp.json()) as { data?: unknown[] };
    return { servico, ok: true, detalhe: `chave valida, ${j.data?.length ?? 0} modelos disponiveis` };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e) };
  }
}

async function testarYoutube(): Promise<Resultado> {
  const servico = "YouTube Data API v3";
  try {
    const key = exige("YOUTUBE_API_KEY");
    const url = `https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=${encodeURIComponent(key)}`;
    const resp = await buscar(url);
    if (!resp.ok) {
      const corpo = await resp.text();
      return { servico, ok: false, detalhe: `HTTP ${resp.status}: ${corpo.slice(0, 200)}` };
    }
    const j = (await resp.json()) as { items?: unknown[] };
    return { servico, ok: true, detalhe: `chave valida, API v3 habilitada (${j.items?.length ?? 0} idiomas)` };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e) };
  }
}

async function testarFirecrawl(): Promise<Resultado> {
  const servico = "Firecrawl";
  try {
    const key = exige("FIRECRAWL_API_KEY");
    const resp = await buscar("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: "https://example.com", formats: ["markdown"] }),
    });
    if (!resp.ok) {
      const corpo = await resp.text();
      return { servico, ok: false, detalhe: `HTTP ${resp.status}: ${corpo.slice(0, 160)}` };
    }
    return { servico, ok: true, detalhe: "scrape de pagina de teste funcionou (1 credito)" };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e) };
  }
}

async function testarApify(): Promise<Resultado> {
  const servico = "Apify (Instagram/TikTok)";
  try {
    const token = exige("APIFY_TOKEN");
    const resp = await buscar(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(token)}`);
    if (!resp.ok) {
      const corpo = await resp.text();
      return { servico, ok: false, detalhe: `HTTP ${resp.status}: ${corpo.slice(0, 160)}` };
    }
    const j = (await resp.json()) as { data?: { plan?: { id?: string } } };
    return { servico, ok: true, detalhe: `token valido, plano ${j.data?.plan?.id ?? "ok"}` };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e) };
  }
}

async function testarDataForSeo(): Promise<Resultado> {
  const servico = "DataForSEO (busca/SERP)";
  try {
    const login = exige("DATAFORSEO_LOGIN");
    const senha = exige("DATAFORSEO_PASSWORD");
    const basic = Buffer.from(`${login}:${senha}`).toString("base64");
    const resp = await buscar("https://api.dataforseo.com/v3/appendix/user_data", {
      headers: { authorization: `Basic ${basic}` },
    });
    if (!resp.ok) {
      const corpo = await resp.text();
      return { servico, ok: false, detalhe: `HTTP ${resp.status}: ${corpo.slice(0, 160)}` };
    }
    const j = (await resp.json()) as {
      tasks?: Array<{ result?: Array<{ money?: { balance?: number; currency?: string } }> }>;
    };
    const money = j.tasks?.[0]?.result?.[0]?.money;
    const saldo = money ? `saldo ${money.balance} ${money.currency ?? ""}`.trim() : "login valido";
    return { servico, ok: true, detalhe: saldo };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e) };
  }
}

async function testarBanco(): Promise<Resultado> {
  const servico = "Supabase Postgres (DATABASE_URL)";
  try {
    exige("DATABASE_URL");
    // Import dinamico: so depois do loadEnvFile, para o Prisma ler a URL certa.
    const { prisma } = await import("@/lib/db");
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return { servico, ok: true, detalhe: "conexao ok" };
  } catch (e) {
    return { servico, ok: false, detalhe: String(e).slice(0, 200) };
  }
}

async function main(): Promise<void> {
  console.log("Teste de conexao das APIs (chamadas minimas, sem rodar o pipeline)");
  console.log("=================================================================\n");

  const testes = [
    testarAnthropic,
    testarOpenAI,
    testarYoutube,
    testarFirecrawl,
    testarApify,
    testarDataForSeo,
    testarBanco,
  ];

  const resultados: Resultado[] = [];
  for (const t of testes) {
    const r = await t();
    const marca = r.ok ? "OK  " : "FALHA";
    console.log(`[${marca}] ${r.servico}: ${r.detalhe}`);
    resultados.push(r);
  }

  const ok = resultados.filter((r) => r.ok).length;
  const total = resultados.length;
  console.log(`\n${ok} de ${total} servicos responderam. ` +
    (ok === total ? "Tudo pronto para montar a infra." : "Resolver as falhas acima antes de seguir."));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
