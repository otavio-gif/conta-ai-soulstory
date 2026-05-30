# Geracao de documento: contrato com a skill soulstory-docx

O pipeline nao gera o `.docx` diretamente. Ele produz um `ReportSpec` (JSON) e
entrega ao adaptador `adapter.ts`, que tem dois caminhos.

## Caminho 1 (preferido): skill soulstory-docx

Setar a variavel de ambiente `SOULSTORY_DOCX_CMD` com o comando que invoca a
skill. O adaptador chama:

```
<SOULSTORY_DOCX_CMD> <caminho-do-report-spec.json> <caminho-de-saida.docx>
```

A skill le o JSON de entrada, gera o documento no padrao indigo Soulstory e
grava no caminho de saida. Exemplo:

```
SOULSTORY_DOCX_CMD="python .claude/skills/soulstory-docx/build.py"
```

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
