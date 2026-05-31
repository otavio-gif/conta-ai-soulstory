-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('marca', 'influenciador');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('rascunho', 'em_andamento', 'aguardando_aprovacao', 'concluido', 'reprovado');

-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('pendente', 'aguardando', 'aprovado', 'reprovado', 'ajuste');

-- CreateEnum
CREATE TYPE "CheckpointDecisao" AS ENUM ('aprovado', 'reprovado', 'ajuste');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pendente', 'confirmada', 'imprecisa', 'nao_sustentada');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('instagram', 'tiktok', 'youtube', 'reclame_aqui', 'seo_serp', 'mencoes');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ProjectType" NOT NULL DEFAULT 'marca',
    "briefing" TEXT NOT NULL,
    "janelaInicio" TIMESTAMP(3) NOT NULL,
    "janelaFim" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'rascunho',
    "custoAcumulado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "triggerRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "handle" TEXT,
    "url" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawArtifact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceId" TEXT,
    "fonte" "SourceKind" NOT NULL,
    "url" TEXT NOT NULL,
    "capturadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RawArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "externalId" TEXT,
    "fonte" "SourceKind" NOT NULL,
    "legenda" TEXT,
    "url" TEXT,
    "publicadoEm" TIMESTAMP(3),
    "raw" JSONB,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "postId" TEXT,
    "autor" TEXT,
    "texto" TEXT NOT NULL,
    "publicadoEm" TIMESTAMP(3),
    "raw" JSONB,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fonte" "SourceKind" NOT NULL,
    "externalId" TEXT,
    "titulo" TEXT,
    "url" TEXT,
    "publicadoEm" TIMESTAMP(3),
    "raw" JSONB,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "titulo" TEXT,
    "texto" TEXT NOT NULL,
    "resposta" TEXT,
    "status" TEXT,
    "avaliacao" DOUBLE PRECISION,
    "raw" JSONB,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerpResult" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "posicao" INTEGER,
    "titulo" TEXT,
    "url" TEXT,
    "snippet" TEXT,
    "tipo" TEXT,
    "raw" JSONB,

    CONSTRAINT "SerpResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rawArtifactId" TEXT,
    "fonte" "SourceKind" NOT NULL,
    "texto" TEXT NOT NULL,
    "idioma" TEXT,
    "modelo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrText" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rawArtifactId" TEXT,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcrText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "itemTipo" TEXT NOT NULL,
    "itemId" TEXT,
    "nome" TEXT NOT NULL,
    "valor" INTEGER,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "fonte" "SourceKind" NOT NULL,
    "capturadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipoSuporte" TEXT NOT NULL,
    "suportes" JSONB NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pendente',
    "notaVerificacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "otica" TEXT NOT NULL,
    "construto" TEXT,
    "parte" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportArtifact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "formato" TEXT NOT NULL DEFAULT 'docx',
    "storagePath" TEXT,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,
    "descricao" TEXT,
    "custoBRL" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" "CheckpointStatus" NOT NULL DEFAULT 'pendente',
    "payload" JSONB,
    "decisao" "CheckpointDecisao",
    "notas" TEXT,
    "tokenId" TEXT,
    "publicAccessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Source_projectId_idx" ON "Source"("projectId");

-- CreateIndex
CREATE INDEX "RawArtifact_projectId_idx" ON "RawArtifact"("projectId");

-- CreateIndex
CREATE INDEX "Post_projectId_idx" ON "Post"("projectId");

-- CreateIndex
CREATE INDEX "Comment_projectId_idx" ON "Comment"("projectId");

-- CreateIndex
CREATE INDEX "Video_projectId_idx" ON "Video"("projectId");

-- CreateIndex
CREATE INDEX "Complaint_projectId_idx" ON "Complaint"("projectId");

-- CreateIndex
CREATE INDEX "SerpResult_projectId_idx" ON "SerpResult"("projectId");

-- CreateIndex
CREATE INDEX "Transcript_projectId_idx" ON "Transcript"("projectId");

-- CreateIndex
CREATE INDEX "OcrText_projectId_idx" ON "OcrText"("projectId");

-- CreateIndex
CREATE INDEX "Metric_projectId_idx" ON "Metric"("projectId");

-- CreateIndex
CREATE INDEX "Claim_projectId_idx" ON "Claim"("projectId");

-- CreateIndex
CREATE INDEX "Finding_projectId_idx" ON "Finding"("projectId");

-- CreateIndex
CREATE INDEX "ReportArtifact_projectId_idx" ON "ReportArtifact"("projectId");

-- CreateIndex
CREATE INDEX "CostEvent_projectId_idx" ON "CostEvent"("projectId");

-- CreateIndex
CREATE INDEX "Checkpoint_projectId_idx" ON "Checkpoint"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Checkpoint_projectId_numero_key" ON "Checkpoint"("projectId", "numero");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawArtifact" ADD CONSTRAINT "RawArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawArtifact" ADD CONSTRAINT "RawArtifact_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerpResult" ADD CONSTRAINT "SerpResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrText" ADD CONSTRAINT "OcrText_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportArtifact" ADD CONSTRAINT "ReportArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostEvent" ADD CONSTRAINT "CostEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
