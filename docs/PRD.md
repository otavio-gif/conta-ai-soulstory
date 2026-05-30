# Soulstory | Conta A.I. | Diagnóstico de Visão Externa

> PRD (Product Requirements Document) versão 1.0. Operador único: Otavio (consultoria Soulstory).
> Idioma de todo o produto e entregáveis: Português do Brasil. Voz Soulstory. Sem travessão.
>
> Nota: este arquivo preserva o briefing original. Alguns trechos chegaram com lacunas de
> transcrição (palavras cortadas). Marcados com `[...]` para revisão do Otavio, sem invenção de conteúdo.

---

## 0. Princípios inegociáveis

Governam todas as decisões de implementação. Em conflito, eles vencem.

1. **Padrão de consultoria de elite.** Relatórios que embasam consultorias acima de R$ 100.000,00. Profundidade, rigor e clareza comparáveis a McKinsey ou BCG. Nada raso, genérico ou de achismo.
2. **Fidelidade factual total.** Zero invenção, zero estimativa. Toda afirmação rastreável a um dado bruto coletado e armazenado. Agentes verificadores auditam cada afirmação contra a fonte. Sem lastro, é rejeitada ou marcada como não sustentada.
3. **Arquitetura de agents, sub-agents e skills.** Orquestrador principal delega a sub-agentes especialistas, apoiados por skills versionadas.
4. **Somente métricas públicas.** Não estimamos engajamento. O não público (salvamentos e compartilhamentos de Instagram e TikTok) é reportado como indisponível, nunca inferido.
5. **Captura integral.** Dentro da janela, coletamos todos os dados públicos disponíveis. Profundidade acima de velocidade.
6. **Soberania do dado.** Dados brutos exclusivos da Soulstory, em ambiente controlado, com proveniência e retenção definidas.
7. **Human in the loop.** Mínimo 5 checkpoints de aprovação humana, começando pelo plano de coleta.
8. **Escopo: estritamente Visão Externa.** Percepção de consumidores e stakeholders, mídia espontânea e boca a boca. Sem Visão Interna, Cultura ou Mercado/Concorrência.
9. **Relatórios intermediários** também saem em soulstory-docx, anexados ao documento principal.

---

## 1. Problema identificado

No método de estratégia de branding da Ana Couto, o diagnóstico é a matéria-prima mais importante do projeto. Sem um bom diagnóstico, não se avança para Diretrizes nem para o DE/PARA. Dentro do diagnóstico, a Visão Externa (a percepção real de consumidores e stakeholders) revela o gap de percepção, os promotores, os detratores e os aceleradores de valor da marca.

Hoje a Visão Externa é coletada por pesquisa quali e quanti tradicional: entrevistas em profundidade, focus groups, painéis. É cara, lenta e amostral. Captura a percepção de dezenas de pessoas, em semanas.

Ao mesmo tempo, a percepção real da marca já existe, em volume, espalhada pela pegada digital pública: legendas e comentários no Instagram e no TikTok, vídeos e comentários no YouTube, reclamações e respostas no Reclame Aqui, resultados de busca no Google. Esse manancial é vasto, não estruturado e disperso. Lê-lo manualmente é inviável em escala.

**A dor concreta:** o consultor gasta semanas montando uma Visão Externa que fica amostral e parcial. Em um projeto que sustenta um contrato de seis dígitos, isso gera três riscos: gargalo de tempo, diagnóstico raso ou enviesado e, o pior, afirmações sem lastro em um documento que precisa ser inatacável.

---

## 2. Solução

Webapp de uso interno da Soulstory, com identidade visual Soulstory, onde Otavio insere um briefing em texto livre sobre a marca ou influenciador e a janela temporal (dias, meses ou anos).

A partir disso, um pipeline orquestrado de agentes:

1. Interpreta o briefing e monta um plano de coleta (fontes, perfis, palavras-chave, período, volume e custo estimado).
2. Coleta integralmente a pegada digital pública dentro da janela.
3. Transcreve áudio de Reels e vídeos, e faz OCR do texto dentro de carrosséis e imagens.
4. Analisa sob duas óticas combinadas: cientista de dados especialista em insights para marketing, e analista sênior de conteúdo e redes sociais.
5. Sintetiza os achados pela metodologia Ana Couto de Visão Externa.
6. Verifica cada afirmação contra os dados brutos por agentes de checagem.
7. Compõe o Diagnóstico de Visão Externa final em soulstory-docx, de 50 a 100 páginas, com forte suporte visual (gráficos e quadros) e os relatórios intermediários anexados.

O processo roda em background (pode levar horas) e pausa em pelo menos 5 checkpoints para aprovação humana, começando pelo plano.

O relatório tem **duas partes**:

- **Parte I, descritiva e exploratória.** Recorte panorâmico: como a marca é vista, do que falam, com que tom, o que viraliza e por quê, quais temas e quais dores aparecem.
- **Parte II, síntese estratégica formal.** Fecha o diagnóstico nos construtos do método: promotores, detratores, aceleradores, gap de percepção, insights de persona e leitura das três ondas de valor (produto, pessoas, propósito). Pronta para virar insumo do DE/PARA.

---

## 3. Funcionalidades principais

### 3.1 Entrada e planejamento
- Campo de briefing em **texto livre** que o agente interpreta para extrair: nome e variações da marca, perfis (Instagram, TikTok, YouTube), site, presença no Reclame Aqui, palavras-chave de menção, e a janela temporal.
- O recorte temporal considera **posts publicados dentro da janela** (e o conteúdo e engajamento associados).
- **Plano de coleta** apresentado no primeiro checkpoint, com fontes mapeadas, volume estimado e custo estimado.

### 3.2 Coleta e leitura de conteúdo (captura integral)

**Instagram (marca ou influenciador)**
- Análise da bio.
- Métricas públicas por post: curtidas, comentários e visualizações de Reels. Salvamentos e compartilhamentos não são públicos e são reportados como indisponíveis, sem estimativa.
- Análise de todas as legendas e de todos os comentários de todos os posts da janela.
- OCR e transcrição do texto dentro dos carrosséis.
- Transcrição do áudio dos Reels.
- Posts de terceiros que citam a marca (mídia espontânea).
- Análise individual dos top 10 posts em cada eixo público disponível: mais curtidos, mais comentados e, quando houver, mais vistos. Onde a métrica não é pública (salvos, compartilhados), o ranking é omitido e isso é declarado.
- Análise de viralização: fatores que explicam o desempenho dos posts de maior destaque.

**TikTok**
- Mesma lógica do Instagram, adaptada ao que é público (curtidas, comentários, compartilhamentos quando expostos, visualizações), com transcrição de áudio e OCR de texto em tela.

**YouTube**
- Transcrição do conteúdo dos vídeos da marca ou influenciador.
- Análise dos comentários desses vídeos.
- Vídeos de terceiros que falam sobre a marca e análise dos comentários deles.

**Reclame Aqui**
- Análise das reclamações e das respostas da marca.
- Indicadores públicos disponíveis (nota, índice de resposta e solução, quando expostos).

**SEO e busca no Google**
- O que aparece ao pesquisar a marca: SERP, sugestões, "as pessoas também perguntam", featured snippets.
- Volume e intenção das buscas associadas à marca.
- Conteúdo de terceiros que ranqueia sobre a marca.

### 3.3 Análise (as duas óticas, como sub-agentes)
- **Cientista de dados:** análise quantitativa, séries temporais, distribuições, correlações, padrões, gráficos e quadros, insights orientados a marketing.
- **Analista sênior de conteúdo e redes sociais:** análise qualitativa, tom e narrativa, sentimento, temas recorrentes, linguagem nativa do público, fatores de viralização e de rejeição.
- Todo achado carrega suporte visual quando ajudar a compreensão (gráficos, quadros, nuvens de tema, linhas do tempo).

### 3.4 Síntese metodológica (Visão Externa, Ana Couto)
- Gap de percepção: o que o público entende e valoriza versus o que a marca acredita entregar.
- Promotores, detratores e aceleradores, sob a ótica externa.
- Insights de persona a partir da percepção e do comportamento observados.
- Leitura das três ondas de valor: produto, pessoas (identificação) e propósito.
- Bloco de insumo para o DE/PARA.

### 3.5 Fidelidade e verificação
- Registro de evidências (evidence ledger): cada afirmação recebe um identificador que aponta para o dado bruto que a sustenta.
- Agentes verificadores que auditam cada afirmação contra a fonte.
- Marcação explícita de "dado não disponível" sempre que a métrica não for pública.

### 3.6 Composição e entrega
- Relatório final em soulstory-docx, de 50 a 100 páginas.
- Relatórios intermediários (por fonte) em soulstory-docx, anexados.
- Forte suporte visual em todo o documento.

### 3.7 Operação
- Estimador e medidor de custo, com guardrail de orçamento.
- Painel de checkpoints para aprovar, reprovar ou pedir ajuste em cada etapa.
- Cofre de dados e política de retenção.

### 3.8 Análises adicionais sugeridas (a partir da Fase 3)
- **Share of voice de menção** dentro da Visão Externa: quanto a marca é falada por terceiros versus por ela mesma (sem comparação com concorrentes).
- **Sentimento longitudinal:** como o sentimento se move ao longo da janela.
- **Mapa de temas e tópicos:** assuntos que orbitam a marca, agrupados.
- **Glossário de linguagem nativa:** como o público realmente fala da marca.
- **Análise de formato e horário de pico:** formatos e horários que performam, com base no público.
- **Linha do tempo de percepção:** marcos e inflexões na conversa pública dentro da janela.

---

## 4. Usuário

**Usuário humano: um só.** Otavio, consultor de branding da Soulstory. Domina a metodologia Ana Couto, é tecnicamente capaz com apoio de IA. A autenticação pode ser simples (uma porta de acesso protegida), sem multi-tenant, sem papéis, sem cobrança.

**Papéis de IA (agentes, não usuários):** orquestrador, coletores por fonte, transcritor e OCR, cientista de dados, analista sênior de conteúdo, sintetizador metodológico, verificadores de fato e compositor de relatório.

---

## 5. Quem vai usar

Apenas Otavio. Ferramenta de produção interna. Os relatórios é que circulam para clientes, sempre revisados e aprovados por ele.

---

## 6. Stack tecnológica

**Núcleo do app**
- Next.js (App Router) e React
- TypeScript
- Tailwind CSS e shadcn/ui
- Supabase (Postgres, storage e auth simples)
- Prisma sobre o Postgres do Supabase, para o evidence ledger e os artefatos com tipagem forte
- Vercel para o front e as rotas leves
- Claude Code como ambiente de definição dos agentes e skills

**Processamento em background (jobs longos)**
- Trigger.dev (recomendado) ou Inngest como fila e orquestração de tarefas duradouras, com checkpoints e retomada.
- Node.js nos workers.

**Inteligência**
- API Anthropic (Claude) para interpretação, análise, visão (OCR de carrossel) e redação.
- Whisper (OpenAI) para transcrição de áudio de Reels e vídeos.

**Coleta de dados**
- Apify para Instagram e TikTok (perfis, posts, comentários, mídia), modo assíncrono com retorno por webhook.
- YouTube Data API para metadados, vídeos e comentários, mais legendas oficiais quando existirem (Whisper como fallback).
- Firecrawl para Reclame Aqui e páginas de terceiros.
- DataForSEO para SERP do Google e YouTube, dados de palavra-chave, backlinks e on-page. Camada única de SEO e busca: barata, programática e suficiente.

**Geração de documento**
- Pipeline soulstory-docx (skill existente) para o relatório final e anexos.
- Biblioteca de gráficos em código (Plotly ou matplotlib) gerando imagens embutidas no docx.

**Notificação (opcional)**
- Resend para avisar quando um job longo terminar ou um checkpoint estiver pronto.

**Fora de escopo:** Stripe (não há cobrança, monousuário interno).

---

## 7. Referências de design

- **Design system Soulstory:** subido ao projeto pelo Otavio (tokens, componentes, fontes, paleta). Fonte de verdade da interface.
- **Identidade soulstory-docx:** paleta indigo, Cabin com EB Garamond e Consolas, callouts, cards numerados, fichas, tabelas indigo, capa e encerramento marcados.
- **Rigor de consultoria:** McKinsey e BCG como norte de densidade, hierarquia de informação e suporte visual.
- **Dashboard Elements** (referência interna do Otavio) como exemplo de qualidade de interface de dados.

---

## 8. Arquitetura de agentes

### 8.1 Agente orquestrador
Conduz o fluxo do briefing à entrega, controla os checkpoints, dispara os sub-agentes na ordem certa, monitora custo e mantém o estado do projeto. Coordena, não escreve conteúdo.

### 8.2 Sub-agentes especialistas
- **Intérprete de briefing e escopo:** transforma o texto livre em plano estruturado de coleta. Estima volume e custo.
- **Coletor Instagram**, **Coletor TikTok**, **Coletor YouTube**, **Coletor Reclame Aqui**, **Coletor SEO e SERP**, **Coletor de menções**: cada um coleta integralmente sua fonte e grava no cofre com proveniência.
- **Transcritor e OCR:** áudio via Whisper, texto de carrosséis e imagens via visão do Claude.
- **Cientista de dados:** análise quantitativa, estatística, gráficos e insights.
- **Analista sênior de conteúdo:** análise qualitativa, sentimento, narrativa, temas, viralização.
- **Sintetizador metodológico (Visão Externa):** consolida em gap de percepção, promotores, detratores, aceleradores, persona e ondas de valor.
- **Verificadores de fato (camada crítica):** auditam cada afirmação contra o dado bruto.
- **Compositor de relatório:** monta o soulstory-docx final e os anexos.
- **Editor de voz Soulstory:** pente fino de clareza, voz e regra de não usar travessão, sem mudar o conteúdo.

### 8.3 Skills

**Reaproveitar as skills existentes:**
- `soulstory-docx` para o documento e anexos.
- `decodificacao-valor` e `depara-branding` para ancorar a síntese metodológica e o DE/PARA.
- `buyer-persona` (metodologia 5 Rings) para insights de persona.
- `reels-analyzer` como base para leitura de Reels e vídeos curtos.
- `pdf-text-extractor` e `meeting-points-extractor` como apoio.

**Skills novas a criar:**
- `visao-externa-metodo`: doutrina do diagnóstico de Visão Externa, destilada das aulas de Estratégia.
- `evidence-ledger`: protocolo de registro de evidências e a regra "nenhuma afirmação sem fonte".
- `fact-check-ve`: protocolo de verificação de afirmações.
- `chart-builder-soulstory`: gráficos no padrão visual Soulstory para embutir no docx.
- `coletor-protocolos`: convenções de coleta, normalização e deduplicação por fonte.

---

## 9. Sistema de fidelidade factual

Espinha dorsal do projeto.

1. **Proveniência na coleta.** Cada dado bruto gravado com origem (URL), carimbo de data e payload original intacto, antes de qualquer análise.
2. **Registro de evidências (evidence ledger).** Toda afirmação candidata nasce como registro com: texto da afirmação, identificadores dos dados brutos que a sustentam, e tipo de suporte (citação direta, contagem, agregação, padrão observado).
3. **Regra de ouro.** Nenhuma afirmação entra no relatório sem ao menos uma evidência ligada. Sem evidência, é rejeitada na origem.
4. **Verificação independente.** Verificadores releem cada afirmação contra os dados apontados, em passada separada da redação, e classificam: confirmada, imprecisa (precisa ajuste) ou não sustentada (sai do relatório).
5. **Proibição de estimativa.** Onde a métrica não é pública, o relatório diz "dado não disponível publicamente". Nunca preenche com estimativa.
6. **Rastreabilidade na entrega.** Referências que ligam afirmações a evidências, e anexos com a base que sustenta as conclusões.

---

## 10. Fluxo e checkpoints (7, acima do mínimo de 5)

O job roda em background e pausa para aprovação humana. Em cada checkpoint o operador pode aprovar, reprovar ou pedir ajuste.

1. **Plano de coleta.** Fontes, perfis e palavras-chave interpretados, janela, volume e custo estimados.
2. **Inventário de coleta.** Dados brutos coletados, volume real por fonte e lacunas (perfis privados, conteúdo removido, métricas indisponíveis).
3. **Transcrições e OCR.** Amostra de qualidade.
4. **Análises.** Saídas do cientista de dados e do analista sênior, com gráficos e principais insights.
5. **Outline do relatório.** Estrutura da Parte I e da Parte II antes de redigir.
6. **Verificação factual.** Resultado da auditoria do evidence ledger, com afirmações descartadas.
7. **Draft final.** Documento soulstory-docx completo com anexos, para aprovação antes de fechar.

---

## 11. Modelo de dados (Supabase, esboço)

- `projects`: marca ou influenciador, tipo, briefing original, janela, status, custo acumulado.
- `sources`: fontes ativas por projeto.
- `raw_artifacts`: payloads brutos com URL de origem, data de captura e fonte. Imutáveis.
- `posts`, `comments`, `videos`, `complaints`, `serp_results`: dados normalizados por tipo.
- `transcripts` e `ocr_texts`: saídas de transcrição e OCR, ligadas ao artefato de origem.
- `metrics`: métricas públicas por item, com flag de disponibilidade.
- `claims`: o evidence ledger. Cada linha é uma afirmação com seus suportes e status de verificação.
- `findings`: achados consolidados por ótica e por construto metodológico.
- `report_artifacts`: seções do relatório e anexos gerados.
- `cost_events`: cada chamada paga (Apify, Whisper, DataForSEO, tokens) com custo, para medição e guardrail.

---

## 12. Coleta por fonte (notas)

- **Captura integral** dentro da janela, sem amostragem por padrão. Em volume muito alto, o sistema não corta dados: sinaliza volume e custo no checkpoint 1 e o operador decide.
- **Instagram e TikTok:** salvamentos e compartilhamentos não são públicos. Reportar como indisponível, sem estimar.
- **Reclame Aqui e páginas de terceiros:** Firecrawl, respeitando limites técnicos e termos de uso, com retomada em caso de bloqueio.
- **YouTube:** preferir legendas oficiais; Whisper como fallback.
- **Adaptação marca versus influenciador:** para influenciador, o Reclame Aqui costuma não se aplicar; a dimensão de produto das ondas de valor mapeia para conteúdo e ofertas do criador; "marca citada" vira "criador citado". Mesmo template, com essas considerações.

---

## 13. Orçamento e medição de custo

- **Guardrail:** alvo de até R$ 35,00 por mês de dados analisado. 3 meses, alvo de até R$ 105,00, e assim por diante.
- **Estimador no checkpoint 1:** projeta o custo antes de coletar e mostra ao operador.
- **Tratamento de estouro:** qualidade é prioridade. O guardrail é alerta, não teto rígido. Acima do alvo, o sistema pede aprovação explícita.
- **Medição contínua:** cada chamada paga vira um `cost_event`. O painel mostra o custo acumulado em tempo real.

---

## 14. Faseamento

**Fase 0, fundação.** Repo, design system Soulstory aplicado, schema Supabase e Prisma, esqueleto do orquestrador, fila de jobs (Trigger.dev), pipeline soulstory-docx ligado, UI de checkpoints e estimador de custo.
Aceite: um job de ponta a ponta com dado simulado, parando nos 7 checkpoints e gerando um docx mínimo no padrão.

**Fase 1, MVP vertical.** Instagram, transcrição e OCR, as duas óticas de análise, evidence ledger, verificação factual e relatório completo (Parte I e Parte II) em soulstory-docx com anexos.
Aceite: diagnóstico real de uma marca pequena, 50 páginas ou mais, zero afirmação sem lastro, dentro do fluxo de checkpoints.

**Fase 2, vídeo em escala.** TikTok e YouTube, incluindo vídeos de terceiros e seus comentários, transcrição e OCR em volume.
Aceite: as duas fontes integradas ao mesmo relatório, com viralização analisada.

**Fase 3, busca e mídia espontânea.** DataForSEO para SEO e busca no Google, coletor de menções, e as análises adicionais.
Aceite: relatório com a camada de busca e de mídia espontânea completa.

**Fase 4, refino.** Performance, robustez de coleta sob bloqueio, qualidade visual dos gráficos, revisão da voz Soulstory ponta a ponta.
Aceite: diagnóstico em padrão de entrega para cliente de seis dígitos.

---

## 15. Riscos e mitigações

- **Bloqueio e limites de scraping.** Apify e Firecrawl em modo assíncrono, retomada, tolerância a falha parcial com registro de lacunas.
- **Volume e custo em marcas grandes.** Estimador no checkpoint 1 e aprovação explícita de estouro.
- **Lacuna de métricas privadas.** Declarar indisponibilidade, sem estimar.
- **Alucinação ou afirmação sem lastro.** Evidence ledger e verificação como etapa obrigatória e bloqueante.
- **Qualidade de transcrição e OCR.** Checkpoint de amostra e legendas oficiais quando existirem.
- **Termos de uso e LGPD.** Uso interno, dados brutos sob controle, proveniência e retenção. Anonimização de autores de comentários quando o relatório circular.

---

## 16. Critérios de aceite (Definition of Done)

Um diagnóstico está pronto quando:
- Tem entre 50 e 100 páginas, em soulstory-docx, com anexos por fonte.
- Tem as duas partes: descritiva e síntese estratégica formal.
- Fecha em promotores, detratores, aceleradores, gap de percepção, persona e ondas de valor, com bloco de insumo para o DE/PARA.
- Tem suporte visual robusto e gráficos no padrão Soulstory.
- Não contém uma única afirmação sem evidência ligada e verificada.
- Declara explicitamente toda métrica indisponível.
- Passou pelos 7 checkpoints com aprovação humana.
- Está na voz Soulstory, em PT-BR, sem travessão.

---

## Apêndice A. Mapa metodológico (Visão Externa Ana Couto)

| Construto do método | Como nasce na Visão Externa digital | Onde aparece no relatório |
|---|---|---|
| Gap de percepção | Diferença entre o que o público fala e valoriza e o que a marca comunica | Parte II, abertura |
| Promotores | O que joga a favor da marca na percepção pública | Parte II |
| Detratores | O que drena valor na percepção pública (reclamações, críticas, rejeição) | Parte II |
| Aceleradores | Oportunidades visíveis na conversa pública que acelerariam valor | Parte II |
| Insights de persona | Perfis, dores e comportamentos derivados de comentários e engajamento | Parte II |
| Ondas de valor | Leitura de produto, pessoas (identificação) e propósito na percepção pública | Parte II |
| Insumo para o DE/PARA | Consolidação pronta para alimentar o keyframe estratégico | Parte II, fechamento |
| Retrato descritivo | Tom, temas, viralização, linguagem nativa, linha do tempo | Parte I |

---

## Apêndice B. Configuração de skills e conectores no Claude Code

### Skills
- Skills são pastas com um SKILL.md em `<projeto>/.claude/skills/<nome>/` (do projeto, versionadas) ou `~/.claude/skills/<nome>/` (pessoais).
- Colocar `visao-externa-metodo` e demais skills relevantes em `.claude/skills/` do projeto.
- Arquivo `.skill` é um zip: descompactar dentro de `.claude/skills/`.
- Doc: https://code.claude.com/docs/en/skills

### Subagentes
- Os agentes do PRD viram arquivos markdown em `<projeto>/.claude/agents/`, cada um com papel, ferramentas permitidas e instruções.

### Memória do projeto
- `CLAUDE.md` na raiz guarda o contexto permanente: princípios, padrões de qualidade e a regra de não usar travessão.

### Conectores MCP
- Servidores MCP registrados por `claude mcp add` ou arquivo de configuração na raiz. A coleta usa APIs comuns, não conectores MCP, então nenhum MCP é obrigatório para a coleta.
- Doc: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

### APIs comuns (não são conectores)
- Apify, Firecrawl, DataForSEO, YouTube Data API e Whisper são APIs chamadas pelo app e pelos workers com as chaves do projeto. Ficam em `.env` e como segredos na Vercel e Trigger.dev, nunca no código.

### Claude Code
- Instalar pelo pacote oficial `@anthropic-ai/claude-code`, com a versão de Node exigida. Doc: https://docs.claude.com/en/docs/claude-code/overview

---

## Apêndice C. Checklist de credenciais e acessos

### Anthropic e Claude (essencial)
- [ ] Claude Code instalado e autenticado.
- [ ] Chave de API da Anthropic com billing ativo.

### Git e GitHub (essencial)
- [ ] Git instalado. Conta no GitHub. Repositório privado criado.
- [ ] Acesso de push (chave SSH ou PAT fine-grained com escopo de repositório).
- [ ] Opcional: MCP do GitHub.

### Supabase (essencial)
- [ ] Conta e projeto novo (região próxima do Brasil).
- [ ] Chave pública (anon), chave service_role (secreta, só no servidor).
- [ ] String de conexão Postgres: pooled (runtime) e direta (migrations).
- [ ] Bucket de storage para artefatos brutos e mídia.

### Hospedagem e jobs (essencial)
- [ ] Conta na Vercel com o repositório conectado.
- [ ] Conta no Trigger.dev (ou Inngest) e a chave de API.

### APIs de coleta
- [ ] Apify (Fase 1, Instagram).
- [ ] Firecrawl (Fase 1, Reclame Aqui e terceiros).
- [ ] DataForSEO (Fase 3, SEO e busca).
- [ ] YouTube Data API (Fase 2).

### Transcrição
- [ ] OpenAI (Whisper). Fase 1 para Reels, Fase 2 para YouTube e TikTok.

### Notificação (opcional)
- [ ] Resend.

### Acesso ao app (monousuário)
- [ ] Senha de acesso ao webapp, ou login simples do Supabase.

> As variáveis de ambiente vão em `.env` (gitignored). Modelo em `.env.example`.
