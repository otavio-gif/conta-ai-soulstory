# Geracao de documento: contrato com a skill soulstory-docx

O pipeline nao gera o `.docx` diretamente. Ele produz um `ReportSpec` (JSON) e
entrega ao adaptador `adapter.ts`, que tem dois caminhos.

## Caminho 1 (preferido): skill soulstory-docx

Setar a variavel de ambiente `SOULSTORY_DOCX_CMD` com o comando que invoca a
skill. O adaptador chama:

```
<SOULSTORY_DOCX_CMD> <caminho-do-report-spec.json> <caminho-de-saida.docx>
```

O build script le o JSON de entrada, gera o documento no padrao indigo
Soulstory (reusando o helper `.claude/skills/soulstory-docx/scripts/soulstory.js`,
instalado no repo) e grava no caminho de saida. Na Fase 1:

```
SOULSTORY_DOCX_CMD="node scripts/soulstory-docx-build.js"
```

O `ReportSpec` agora carrega elementos visuais (callouts, cards, tabelas,
graficos e glossario) e o build script os mapeia para os componentes do helper.
Os graficos vem como PNG referenciados por caminho no campo `graficos`.

## Caminho 2 (fallback): gerador embutido

Sem `SOULSTORY_DOCX_CMD`, o adaptador usa a lib `docx` e gera um documento
minimo valido (capa, resumo dos checkpoints, Parte I, Parte II, registro de
evidencias e anexos). Serve para a Fase 0 fechar de ponta a ponta.

## Contrato ReportSpec

A forma canonica esta em `src/lib/pipeline/types.ts` (`ReportSpec`). Resumo:

```jsonc
{
  "projeto": { "nome": "...", "tipo": "marca|influenciador", "janela": { "inicio": "ISO", "fim": "ISO" } },
  "geradoEm": "ISO",
  "resumoCheckpoints": [{ "numero": 1, "titulo": "...", "resumo": "..." }],
  "parteI":  { "titulo": "...", "secoes": [{ "titulo": "...", "paragrafos": ["..."] }] },
  "parteII": { "titulo": "...", "secoes": [{ "titulo": "...", "paragrafos": ["..."] }] },
  "evidencias": [{ "afirmacao": "...", "status": "confirmada|imprecisa|nao_sustentada|pendente", "suporte": "..." }],
  "anexos": [{ "titulo": "...", "descricao": "..." }]
}
```

Regras do projeto: PT-BR, voz Soulstory, sem travessao em nenhum texto do
documento.
