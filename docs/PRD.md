# Conta A.I. | Soulstory | Diagnóstico de Visão Externa

**PRD (Product Requirements Document)**
Versão 1.0 · Destino: Claude Code · Operador único: Otavio (consultoria Soulstory)
Idioma de todo o produto e de todos os entregáveis: Português do Brasil. Voz Soulstory. Sem travessão em nenhum texto.

---

## 0. Princípios inegociáveis

Estes princípios governam todas as decisões de implementação. Quando houver conflito, eles vencem.

1. **Padrão de consultoria de elite.** Os relatórios embasam consultorias que custam mais de R$ 100.000,00. O nível de profundidade, rigor e clareza precisa ser comparável ao de uma McKinsey ou BCG. Nada raso, nada genérico, nada de "achismo".
2. **Fidelidade factual total.** Zero invenção. Zero estimativa. Toda afirmação no relatório precisa ser rastreável a um dado bruto coletado e armazenado. Agentes verificadores auditam cada afirmação contra a fonte antes de qualquer entrega. Afirmação sem lastro é rejeitada ou marcada explicitamente como "dado não disponível".
3. **Arquitetura de agents, sub-agents e skills.** O sistema é orquestrado por um agente principal que delega a sub-agentes especialistas, todos apoiados por skills versionadas.
4. **Somente métricas públicas.** Não estimamos nem extrapolamos engajamento. O que não é público (salvamentos e compartilhamentos de Instagram e TikTok, por exemplo) é reportado como indisponível, nunca inferido.
5. **Captura integral.** Dentro da janela definida, coletamos todos os dados públicos disponíveis. Profundidade acima de velocidade.
6. **Soberania do dado.** Os dados brutos ficam exclusivamente com a Soulstory, em ambiente controlado, com proveniência e retenção definidas.
7. **Human in the loop.** No mínimo 5 checkpoints de aprovação humana, começando pelo plano de coleta.
8. **Escopo: estritamente Visão Externa.** Percepção de consumidores e demais stakeholders, mais mídia espontânea e boca a boca. Sem camada de Visão Interna, Cultura ou Mercado/Concorrência.
9. **Entregável final em soulstory-docx.** Todos os relatórios intermediários também saem em soulstory-docx, anexados ao documento principal.

---

## 1. Problema identificado

No método de estratégia de branding da Ana Couto, o diagnóstico é a matéria-prima mais importante do projeto. Sem um bom diagnóstico, não se avança para as Diretrizes nem para o DE/PARA. Dentro do diagnóstico, a Visão Externa (a percepção real de consumidores e stakeholders) é o que revela o gap de percepção, os promotores, os detratores e os aceleradores de valor da marca.

Hoje essa Visão Externa é coletada por pesquisa quali e quanti tradicional: entrevistas em profundidade, focus groups, painéis. É cara, lenta e amostral. Captura a percepção de algumas dezenas de pessoas, em semanas de trabalho.

Ao mesmo tempo, a percepção real da marca já existe, em volume, espalhada pela pegada digital pública: legendas e comentários no Instagram e no TikTok, vídeos e comentários no YouTube, reclamações e respostas no Reclame Aqui, resultados de busca no Google e conteúdo de terceiros que cita a marca. Esse manancial é vasto, não estruturado e disperso. Lê-lo manualmente é inviável em escala.

**A dor concreta:** o consultor gasta semanas montando uma Visão Externa que, mesmo assim, fica amostral e parcial. Em um projeto que sustenta um contrato de seis dígitos, isso gera três riscos críticos: gargalo de tempo, diagnóstico raso ou enviesado, e, o pior de todos, afirmações sem lastro em um documento que precisa ser inatacável.

---

## 2. Solução

Um webapp de uso interno da Soulstory, com a identidade visual Soulstory, onde Otavio insere um briefing em texto livre sobre a marca ou influenciador e a janela temporal a analisar (dias, meses ou anos).

A partir disso, um pipeline orquestrado de agentes:

1. Interpreta o briefing e monta um plano de coleta (fontes, perfis, palavras-chave, período, volume e custo estimado).
2. Coleta integralmente a pegada digital pública dentro da janela.
3. Transcreve áudio de Reels e vídeos, e faz OCR do texto dentro de carrosséis e imagens.
4. Analisa tudo sob duas óticas combinadas: um cientista de dados especialista em insights para marketing, e um analista sênior de conteúdo e redes sociais.
5. Sintetiza os achados pela metodologia Ana Couto de Visão Externa.
6. Verifica cada afirmação contra os dados brutos por meio de agentes de checagem.
7. Compõe o Diagnóstico de Visão Externa final em soulstory-docx, de 50 a 100 páginas, com forte suporte visual (gráficos e quadros) e os relatórios intermediários anexados.

O processo roda em background (pode levar horas) e pausa em pelo menos 5 checkpoints para aprovação humana, começando pelo plano.

O relatório tem **duas partes**:

- **Parte I, descritiva e exploratória.** Recorte mais livre, panorâmico, que retrata a marca por dentro da percepção pública: como ela é vista, do que falam, com que tom, o que viraliza e por quê, quais temas e quais dores aparecem.
- **Parte II, síntese estratégica formal.** Fecha o diagnóstico nos construtos do método: promotores, detratores e aceleradores, gap de percepção, insights de persona e leitura das três ondas de valor (produto, pessoas, propósito). Sai pronta para virar insumo do DE/PARA.

---

## 3. Funcionalidades principais

### 3.1 Entrada e planejamento
- Campo de briefing em **texto livre** que o agente interpreta para extrair: nome e variações da marca, perfis (Instagram, TikTok, YouTube), site, presença no Reclame Aqui, palavras-chave de menção, e a janela temporal.
- O recorte temporal considera **posts publicados dentro da janela** (e o conteúdo e engajamento associados a eles).
- **Plano de coleta** apresentado ao operador no primeiro checkpoint, com fontes mapeadas, volume estimado e custo estimado.

### 3.2 Coleta e leitura de conteúdo (captura integral)

**Instagram (marca ou influenciador)**
- Análise da bio.
- Métricas públicas por post: curtidas, comentários e visualizações de Reels. Salvamentos e compartilhamentos não são públicos e serão reportados como indisponíveis, sem estimativa.
- Análise de todas as legendas dos posts da janela.
- Análise de todos os comentários de todos os posts da janela.
- OCR e transcrição do texto dentro dos carrosséis.
- Transcrição do áudio dos Reels.
- Posts de terceiros que citam a marca (mídia espontânea).
- Análise individual dos top 10 posts em cada eixo público disponível: mais curtidos, mais comentados e, quando houver, mais vistos. Onde a métrica não é pública (salvos, compartilhados), o ranking é omitido e isso é declarado.
- Análise de viralização: fatores que explicam o desempenho dos posts de maior destaque.

**TikTok**
- Mesma lógica do Instagram, adaptada ao que é público na plataforma (curtidas, comentários, compartilhamentos quando expostos publicamente, visualizações), com transcrição de áudio e OCR de texto em tela.

**YouTube**
- Transcrição do conteúdo dos vídeos da marca ou influenciador.
- Análise dos comentários desses vídeos.
- Vídeos de terceiros que falam sobre a marca.
- Análise dos comentários desses vídeos de terceiros.

**Reclame Aqui**
- Análise das reclamações dentro da janela.
- Análise das respostas da marca.
- Indicadores públicos disponíveis (nota, índice de resposta e solução, quando expostos).

**SEO e busca no Google**
- O que aparece quando se pesquisa a marca: SERP, sugestões, "as pessoas também perguntam", featured snippets.
- Volume e intenção das buscas associadas à marca.
- Conteúdo de terceiros que ranqueia sobre a marca.

### 3.3 Análise (as duas óticas, como sub-agentes)
- **Cientista de dados:** análise quantitativa, séries temporais, distribuições, correlações, identificação de padrões, geração de gráficos e quadros, e insights orientados a marketing.
- **Analista sênior de conteúdo e redes sociais:** análise qualitativa, leitura de tom e narrativa, sentimento, temas recorrentes, linguagem nativa do público, fatores de viralização e de rejeição.
- Todo achado precisa carregar suporte visual quando ajudar a compreensão (gráficos, quadros, nuvens de tema, linhas do tempo).

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
- Cofre de dados brutos com proveniência e retenção.

### 3.8 Análises adicionais sugeridas (entram a partir da Fase 3)
- **Share of voice de menção** dentro da Visão Externa: quanto a marca é falada por terceiros versus por ela mesma (sem comparação com concorrentes, para respeitar o recorte VE).
- **Sentimento longitudinal:** como o sentimento se move ao longo da janela.
- **Mapa de temas e tópicos:** os assuntos que orbitam a marca, agrupados.
- **Glossário de linguagem nativa:** como o público realmente fala da marca (matéria-prima valiosa para copy e para a Plataforma de Branding depois).
- **Análise de formato e horário de pico:** que formatos e horários performam, com base no que é público.
- **Linha do tempo de percepção:** marcos e inflexões na conversa pública sobre a marca dentro da janela.

---

## 4. Usuário (persona e tipos de usuário)

**Usuário humano: um só.** Otavio, consultor de branding da Soulstory. Domina a metodologia Ana Couto, é tecnicamente capaz com apoio de IA, e opera o sistema do briefing à entrega. Por ser monousuário, a camada de autenticação pode ser simples (uma porta de acesso protegida), sem multi-tenant, sem papéis, sem cobrança.

**Papéis de IA dentro do sistema (não são usuários, são agentes):** orquestrador, coletores por fonte, transcritor e OCR, cientista de dados, analista sênior de conteúdo, sintetizador metodológico, verificadores de fato e compositor de relatório. Detalhados na seção 8.

---

## 5. Quem vai usar o sistema

Apenas Otavio. O sistema é uma ferramenta de produção interna da Soulstory, não um produto para terceiros. Os relatórios gerados é que circulam para os clientes de consultoria, sempre revisados e aprovados por ele.

---

## 6. Stack tecnológica

**Núcleo do app**
- Next.js (App Router) e React
- TypeScript
- Tailwind CSS e shadcn/ui
- Supabase (Postgres, storage e auth simples)
- Prisma sobre o Postgres do Supabase, para modelar o evidence ledger e os artefatos com tipagem forte
- Vercel para o front e as rotas leves
- Claude Code como ambiente de desenvolvimento e de definição dos agentes e skills

**Processamento em background (jobs longos)**
- Trigger.dev ou Inngest como fila e orquestração de tarefas duradouras (a coleta e a redação estouram o timeout de função serverless). Recomendação: Trigger.dev, pela boa modelagem de tarefas longas com checkpoints e retomada.
- Node.js nos workers.

**Inteligência**
- API Anthropic (Claude) para interpretação, análise, visão (OCR de carrossel) e redação do relatório.
- Whisper (OpenAI) para transcrição de áudio de Reels e vídeos.

**Coleta de dados**
- Apify para Instagram e TikTok (perfis, posts, comentários, mídia), com actors rodando em modo assíncrono e retorno por webhook.
- YouTube Data API para metadados, vídeos e comentários, mais legendas oficiais quando existirem (e Whisper como fallback de transcrição).
- Firecrawl para Reclame Aqui e para páginas de terceiros (menções e conteúdo que cita a marca).
- DataForSEO para SERP do Google e YouTube, dados de palavra-chave, backlinks e on-page, em modelo pago por uso. É a fonte única de SEO e busca do projeto: camada barata, programática e suficiente para toda a Análise SEO e de pesquisas no Google.

**Geração de documento**
- Pipeline soulstory-docx (skill existente) para o relatório final e os anexos.
- Biblioteca de gráficos em código (Plotly ou matplotlib) gerando imagens embutidas no docx.

**Notificação (opcional, baixa prioridade)**
- Resend para avisar o operador quando um job longo terminar ou um checkpoint estiver pronto.

**Fora de escopo da stack:** Stripe (não há cobrança, monousuário interno).

---

## 7. Referências de design

- **Design system Soulstory:** será subido ao projeto no Claude Code pelo próprio Otavio (tokens, componentes, fontes, paleta). É a fonte de verdade da interface.
- **Identidade soulstory-docx** (skill existente): paleta indigo, Cabin com EB Garamond e Consolas, callouts, cards numerados, fichas, tabelas indigo, capa e encerramento marcados. É a referência do documento.
- **Rigor de consultoria:** estética e estrutura de relatórios McKinsey e BCG como norte de densidade, hierarquia de informação e suporte visual.
- **Dashboard Elements** (referência interna do próprio Otavio) como exemplo de qualidade de interface de dados na casa.

---

## 8. Arquitetura de agentes (agents, sub-agents e skills)

O sistema é um pipeline orquestrado. Cada etapa tem um sub-agente especialista. Tudo apoiado por skills versionadas no Claude Code.

### 8.1 Agente orquestrador
Conduz o fluxo do briefing à entrega, controla os checkpoints, dispara os sub-agentes na ordem certa, monitora custo e mantém o estado do projeto. Não escreve conteúdo: coordena.

### 8.2 Sub-agentes especialistas
- **Intérprete de briefing e escopo:** transforma o texto livre em um plano estruturado de coleta. Estima volume e custo.
- **Coletor Instagram**, **Coletor TikTok**, **Coletor YouTube**, **Coletor Reclame Aqui**, **Coletor SEO e SERP**, **Coletor de menções** (conteúdo de terceiros que cita a marca): cada um coleta integralmente sua fonte e grava no cofre com proveniência.
- **Transcritor e OCR:** áudio de Reels e vídeos via Whisper, texto de carrosséis e imagens via visão do Claude.
- **Cientista de dados:** análise quantitativa, estatística, gráficos e insights para marketing.
- **Analista sênior de conteúdo:** análise qualitativa, sentimento, narrativa, temas, viralização.
- **Sintetizador metodológico (Visão Externa):** consolida os achados em gap de percepção, promotores, detratores, aceleradores, persona e ondas de valor, alimentado pela skill da metodologia.
- **Verificadores de fato (camada crítica):** auditam cada afirmação contra o dado bruto. Detalhado na seção 9.
- **Compositor de relatório:** monta o soulstory-docx final e os anexos.
- **Editor de voz Soulstory:** passa o pente fino de clareza, voz e regra de não usar travessão, sem mudar o conteúdo.

### 8.3 Skills

**Reaproveitar as skills existentes do Otavio:**
- `soulstory-docx` para o documento e os anexos.
- `decodificacao-valor` e `depara-branding` para ancorar a síntese metodológica e o bloco de insumo do DE/PARA.
- `buyer-persona` (metodologia 5 Rings) para os insights de persona.
- `reels-analyzer` como base para a leitura de Reels e vídeos curtos.
- `pdf-text-extractor` e `meeting-points-extractor` como apoio onde fizer sentido.

**Skills novas a criar:**
- `visao-externa-metodo`: a doutrina do diagnóstico de Visão Externa (este projeto), destilada das aulas de Estratégia. Define o que cada construto significa e como derivá-lo só de evidência externa.
- `evidence-ledger`: o protocolo de registro de evidências e a regra "nenhuma afirmação sem fonte".
- `fact-check-ve`: o protocolo de verificação de afirmações.
- `chart-builder-soulstory`: gráficos no padrão visual Soulstory para embutir no docx.
- `coletor-protocolos`: convenções de coleta, normalização e deduplicação por fonte.

---

## 9. Sistema de fidelidade factual

Esta é a espinha dorsal do projeto. Um documento que sustenta um contrato de R$ 100 mil não pode ter uma única frase sem lastro.

1. **Proveniência na coleta.** Todo dado bruto é gravado com origem (URL), carimbo de data e payload original intacto, antes de qualquer análise.
2. **Registro de evidências (evidence ledger).** Toda afirmação candidata a entrar no relatório nasce como um registro com: o texto da afirmação, os identificadores dos dados brutos que a sustentam, e o tipo de suporte (citação direta, contagem, agregação, padrão observado).
3. **Regra de ouro.** Nenhuma afirmação entra no relatório sem ao menos uma evidência ligada. Afirmação sem evidência é rejeitada na origem.
4. **Verificação independente.** Agentes verificadores releem cada afirmação contra os dados brutos apontados, em uma passada separada da redação, e classificam: confirmada, imprecisa (precisa ajuste) ou não sustentada (sai do relatório).
5. **Proibição de estimativa.** Onde a métrica não é pública (salvos, compartilhados de Instagram), o relatório diz "dado não disponível publicamente". Nunca preenche com estimativa.
6. **Rastreabilidade na entrega.** O relatório final pode exibir referências discretas que ligam afirmações a evidências, e os anexos trazem a base que sustenta as conclusões.

---

## 10. Fluxo e checkpoints (mínimo 5)

O job roda em background e pausa para aprovação humana nos pontos abaixo. Em cada checkpoint, o operador pode aprovar, reprovar ou pedir ajuste.

1. **Plano de coleta.** Fontes mapeadas, perfis e palavras-chave interpretados do briefing, janela, volume estimado e custo estimado.
2. **Inventário de coleta.** Dados brutos coletados, volume real por fonte e lacunas encontradas (perfis privados, conteúdo removido, métricas indisponíveis).
3. **Transcrições e OCR.** Amostra de qualidade das transcrições de áudio e dos OCR de carrossel.
4. **Análises.** Saídas do cientista de dados e do analista sênior, com os gráficos e os principais insights.
5. **Outline do relatório.** Estrutura da Parte I (descritiva) e da Parte II (síntese), antes de redigir as 50 a 100 páginas.
6. **Verificação factual.** Resultado da auditoria do evidence ledger, com afirmações confirmadas, ajustadas e descartadas.
7. **Draft final.** Documento soulstory-docx completo com anexos, para aprovação antes de fechar.

(São 7 pontos, acima do mínimo de 5, começando pelo plano, como pedido.)

---

## 11. Modelo de dados (Supabase, esboço)

Tabelas principais (a refinar na implementação):
- `projects`: marca ou influenciador, tipo, briefing original, janela, status, custo acumulado.
- `sources`: fontes ativas por projeto (Instagram, TikTok, YouTube, Reclame Aqui, SERP, menções).
- `raw_artifacts`: payloads brutos com URL de origem, data de captura e fonte. Imutáveis.
- `posts`, `comments`, `videos`, `complaints`, `serp_results`: dados normalizados por tipo.
- `transcripts` e `ocr_texts`: saídas de transcrição e OCR, ligadas ao artefato de origem.
- `metrics`: métricas públicas por item, com flag de disponibilidade.
- `claims`: o evidence ledger. Cada linha é uma afirmação com seus suportes e o status de verificação.
- `findings`: achados consolidados por ótica e por construto metodológico.
- `reports`: versões do relatório e anexos gerados.
- `cost_events`: cada chamada paga (Apify, Whisper, DataForSEO, tokens) com custo, para medição e guardrail.

---

## 12. Coleta por fonte (notas de especificação)

- **Captura integral** dentro da janela. Sem amostragem por padrão. Onde o volume for muito alto, o sistema não corta dados: ele sinaliza no checkpoint 1 o volume e o custo, e o operador decide.
- **Instagram e TikTok:** salvamentos e compartilhamentos não são públicos. Reportar como indisponível, sem estimar.
- **Reclame Aqui e páginas de terceiros:** coletar via Firecrawl, respeitando limites técnicos e termos de uso, com retomada em caso de bloqueio.
- **YouTube:** preferir legendas oficiais; usar Whisper como fallback.
- **Adaptação marca versus influenciador:** para influenciador, o Reclame Aqui costuma não se aplicar e a dimensão de produto das ondas de valor mapeia para conteúdo e ofertas do criador; "marca citada" vira "criador citado". O template é o mesmo, com essas considerações automáticas.

---

## 13. Orçamento e medição de custo

- **Guardrail:** alvo de até R$ 35,00 por mês de dados analisado. Uma análise de 3 meses tem alvo de até R$ 105,00, e assim por diante.
- **Estimador no checkpoint 1:** o sistema projeta o custo antes de coletar e mostra ao operador.
- **Tratamento de estouro:** como qualidade é prioridade e há disposição de gastar mais por mais qualidade, o guardrail é um alerta, não um teto rígido. Acima do alvo, o sistema pede aprovação explícita para seguir.
- **Medição contínua:** cada chamada paga vira um `cost_event`. O painel mostra o custo acumulado em tempo real.

---

## 14. Faseamento

**Fase 0, fundação.**
Repo, design system Soulstory aplicado, schema do Supabase e Prisma, esqueleto do orquestrador, fila de jobs (Trigger.dev), pipeline soulstory-docx ligado, UI de checkpoints e estimador de custo.
Aceite: um job de ponta a ponta com dado simulado, parando nos 7 checkpoints e gerando um docx mínimo no padrão.

**Fase 1, MVP vertical.**
Instagram e Reclame Aqui, transcrição e OCR, as duas óticas de análise, evidence ledger, verificação factual e relatório completo (Parte I e Parte II) em soulstory-docx com anexos.
Aceite: diagnóstico real de uma marca pequena, 50 páginas ou mais, zero afirmação sem lastro, dentro do fluxo de checkpoints.

**Fase 2, vídeo em escala.**
TikTok e YouTube, incluindo vídeos de terceiros que falam da marca e seus comentários, transcrição e OCR em volume.
Aceite: as duas fontes integradas ao mesmo relatório, com a viralização analisada.

**Fase 3, busca e mídia espontânea.**
DataForSEO para SEO e busca no Google, coletor de menções, e as análises adicionais (share of voice de menção, sentimento longitudinal, mapa de temas, glossário de linguagem nativa, linha do tempo de percepção).
Aceite: relatório com a camada de busca e de mídia espontânea completa.

**Fase 4, refino.**
Performance, robustez de coleta sob bloqueio, qualidade visual dos gráficos, e revisão da voz Soulstory ponta a ponta.
Aceite: um diagnóstico de marca grande, 80 a 100 páginas, em padrão de entrega para cliente de seis dígitos.

---

## 15. Riscos e mitigações

- **Bloqueio e limites de scraping.** Mitigar com Apify e Firecrawl em modo assíncrono, retomada, e tolerância a falha parcial com registro de lacunas.
- **Volume e custo em marcas grandes.** A captura integral pode estourar o alvo de orçamento. Mitigar com o estimador no checkpoint 1 e aprovação explícita de estouro.
- **Lacuna de métricas privadas.** Salvos e compartilhados não são públicos. Mitigar declarando a indisponibilidade, sem nunca estimar.
- **Risco de alucinação ou afirmação sem lastro.** Mitigar com o evidence ledger e a camada de verificação como etapa obrigatória e bloqueante.
- **Qualidade de transcrição e OCR.** Mitigar com checkpoint de amostra e com legendas oficiais quando existirem.
- **Termos de uso e LGPD.** Uso interno da Soulstory, dados brutos sob controle, com proveniência e política de retenção. Anonimização de autores de comentários quando o relatório circular para cliente.

---

## 16. Critérios de aceite (Definition of Done)

Um diagnóstico está pronto para entrega quando:
- Tem entre 50 e 100 páginas, em soulstory-docx, com os anexos por fonte.
- Tem as duas partes: descritiva e síntese estratégica formal.
- Fecha em promotores, detratores, aceleradores, gap de percepção, persona e ondas de valor, com bloco de insumo para o DE/PARA.
- Tem suporte visual robusto e gráficos no padrão Soulstory.
- Não contém uma única afirmação sem evidência ligada e verificada.
- Declara explicitamente toda métrica indisponível.
- Passou pelos 7 checkpoints com aprovação humana.
- Está na voz Soulstory, em PT-BR, sem travessão.

---

## Apêndice A. Mapa metodológico (Visão Externa Ana Couto para seções do relatório)

| Construto do método | Como nasce na Visão Externa digital | Onde aparece no relatório |
|---|---|---|
| Gap de percepção | Diferença entre o que o público fala e valoriza e o que a marca comunica | Parte II, abertura da síntese |
| Promotores | O que a percepção pública já impulsiona a favor da marca | Parte II |
| Detratores | O que drena valor na percepção pública (reclamações, críticas, rejeição) | Parte II |
| Aceleradores | Oportunidades visíveis na conversa pública que acelerariam valor | Parte II |
| Insights de persona | Perfis, dores e comportamentos derivados de comentários e engajamento | Parte II |
| Ondas de valor | Leitura de produto, pessoas (identificação) e propósito na percepção pública | Parte II |
| Insumo para o DE/PARA | Consolidação pronta para alimentar o keyframe estratégico | Parte II, fechamento |
| Retrato descritivo | Tom, temas, viralização, linguagem nativa, linha do tempo | Parte I |

---

## Apêndice B. Configuração de skills e conectores no Claude Code

Passos para deixar o ambiente pronto. Skills, subagentes e conectores ficam no repositório, versionados com o projeto.

### Skills
- As skills do Claude Code são pastas no sistema de arquivos, cada uma com um SKILL.md. Ficam em `<projeto>/.claude/skills/<nome>/` (skills do projeto, compartilhadas via git) ou em `~/.claude/skills/<nome>/` (skills pessoais, em todos os projetos).
- Coloque a `visao-externa-metodo` e as demais skills relevantes (`soulstory-docx`, `decodificacao-valor`, `depara-branding`, `buyer-persona`) em `.claude/skills/` do projeto, para versionar junto com o código.
- O arquivo `.skill` é um zip: descompacte dentro de `.claude/skills/` para virar a pasta da skill.
- Doc oficial: https://code.claude.com/docs/en/skills

### Subagentes
- Os agentes do PRD (orquestrador, coletores, cientista de dados, analista de conteúdo, verificadores, compositor) viram arquivos markdown em `<projeto>/.claude/agents/`, cada um com seu papel, ferramentas permitidas e instruções.

### Memória do projeto
- Um arquivo `CLAUDE.md` na raiz do repositório guarda o contexto permanente do projeto: princípios inegociáveis, padrões de qualidade e a regra de não usar travessão.

### Conectores MCP
- No Claude Code, os servidores MCP são registrados por linha de comando (`claude mcp add`) ou em um arquivo `.mcp.json` na raiz do projeto. A mesma URL de servidor MCP usada no claude.ai funciona aqui, mas a configuração é independente: o conector não atravessa sozinho de uma superfície para a outra.
- Registre no Claude Code apenas os MCP que você quiser usar de dentro do fluxo (por exemplo, GitHub para gerenciar o repositório). A coleta de dados do projeto usa APIs comuns, não conectores MCP, então nenhum MCP é obrigatório para a coleta. Conectores que exigem login passam por um fluxo de OAuth na configuração.
- Doc oficial de conectores: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

### APIs comuns (não são conectores)
- Apify, Firecrawl, DataForSEO, YouTube Data API e Whisper não são conectores do Claude: são APIs que o próprio app e os workers chamam com as suas chaves. Ficam em variáveis de ambiente (`.env`) e como segredos na hospedagem (Vercel e Trigger.dev), nunca no código.

### Claude Code
- Instale pelo pacote oficial `@anthropic-ai/claude-code`, conferindo a versão de Node exigida na doc de instalação: https://docs.claude.com/en/docs/claude-code/overview

---

## Apêndice C. Checklist de credenciais e acessos

Reúna estes dados antes e durante a construção, para fornecer com agilidade. Está marcado o que é essencial nas Fases 0 e 1 e o que pode esperar fases seguintes.

### Anthropic e Claude (essencial)
- [ ] Claude Code instalado e autenticado.
- [ ] Chave de API da Anthropic (console da Anthropic, em API Keys), com billing ativo. O app usa a API para análise, visão (OCR) e redação. É separada da assinatura do Claude Code.

### Git e GitHub (essencial)
- [ ] Git instalado na máquina.
- [ ] Conta no GitHub.
- [ ] Repositório privado criado para o projeto.
- [ ] Acesso de push configurado: chave SSH ou Personal Access Token (fine-grained, escopo de repositório).
- [ ] Opcional: MCP do GitHub, se quiser que o agente gerencie issues e PRs.

### Supabase (essencial)
- [ ] Conta no Supabase e projeto novo criado (região próxima do Brasil).
- [ ] URL do projeto.
- [ ] Chave pública (anon).
- [ ] Chave service_role (secreta, só no servidor).
- [ ] String de conexão do Postgres: a pooled (Prisma em runtime) e a direta (migrations).
- [ ] Bucket de storage criado para os artefatos brutos e mídia.

### Hospedagem e jobs (essencial)
- [ ] Conta na Vercel, com o repositório conectado.
- [ ] Conta no Trigger.dev (ou Inngest) e a chave de API, para os jobs longos.

### APIs de coleta
- [ ] Apify: conta e API token. Essencial na Fase 1 (Instagram).
- [ ] Firecrawl: conta e API key. Essencial na Fase 1 (Reclame Aqui e páginas de terceiros).
- [ ] DataForSEO: conta, login (e-mail) e senha de API, com o depósito mínimo. Fase 3 (SEO e busca).
- [ ] YouTube Data API: projeto no Google Cloud, API v3 habilitada e API key. Fase 2 (YouTube).

### Transcrição
- [ ] OpenAI: API key para o Whisper (áudio de Reels e vídeos). Essencial quando entrar transcrição (Fase 1 para Reels, Fase 2 para YouTube e TikTok).

### Notificação (opcional)
- [ ] Resend: API key e domínio verificado, se quiser aviso por e-mail quando um relatório ou checkpoint ficar pronto.

### Acesso ao app (monousuário)
- [ ] Uma senha de acesso ao webapp, já que é só você. Se preferir, o login simples do Supabase resolve sem senha extra.

### Modelo de .env para preencher

O modelo de variáveis fica em `.env.example` na raiz. Copie para `.env` (que é
gitignored) e preencha com os valores reais. As chaves nunca entram neste
documento nem em qualquer arquivo versionado.

```
# Anthropic
ANTHROPIC_API_KEY=""

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
DATABASE_URL=""
DIRECT_URL=""
DATABASE_PASSWORD=""

# Jobs em background
TRIGGER_SECRET_KEY=""
TRIGGER_PROJECT_REF=""

# Coleta
APIFY_TOKEN=""
FIRECRAWL_API_KEY=""
DATAFORSEO_LOGIN=""
DATAFORSEO_PASSWORD=""
YOUTUBE_API_KEY=""

# Transcrição
OPENAI_API_KEY=""

# Notificação
RESEND_API_KEY=""

# Acesso ao app (monousuário)
APP_ACCESS_PASSWORD=""

# Geração de documento (skill soulstory-docx). Se vazio, usa o fallback embutido.
SOULSTORY_DOCX_CMD=""
SOULSTORY_REPORT_BUCKET="report-artifacts"
```

Regra de segurança: o `.env` nunca vai para o git. Guarde os segredos também no painel da Vercel e do Trigger.dev. Como há custo por uso em Apify, DataForSEO, Whisper e API da Anthropic, configure alertas de cobrança em cada um, alinhados ao guardrail de orçamento do projeto.
