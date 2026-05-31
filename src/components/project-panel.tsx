"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckpointCard } from "@/components/checkpoint-card";
import { CheckpointPanel } from "@/components/checkpoint-panel";
import type { CheckpointView } from "@/components/checkpoint-types";
import { CostEstimator } from "@/components/cost-estimator";
import type {
  CheckpointPayload,
  CustoEstimado,
  Decisao,
} from "@/lib/pipeline/types";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from "@/lib/ui-status";

interface ProjectState {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  custoAcumulado: number;
  checkpoints: Array<{
    id: string;
    numero: number;
    titulo: string;
    status: string;
    notas: string | null;
    payload: CheckpointPayload | null;
  }>;
  reportArtifacts: Array<{
    id: string;
    titulo: string;
    storagePath: string | null;
    bytes: number | null;
  }>;
}

export function ProjectPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectState | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setErro("Nao foi possivel carregar o projeto.");
      return;
    }
    const data = await res.json();
    setProject(data.project as ProjectState);
  }, [projectId]);

  useEffect(() => {
    // carregar() faz setState apenas apos o fetch (microtask), nao de forma
    // sincrona; o aviso do lint e falso-positivo para o caso de polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    const t = setInterval(carregar, 3000);
    return () => clearInterval(t);
  }, [carregar]);

  async function decidir(checkpointId: string, decisao: Decisao, notas?: string) {
    const res = await fetch(`/api/checkpoints/${checkpointId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisao, notas }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.erro ?? "Falha ao registrar a decisao.");
    }
    await carregar();
  }

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  if (erro && !project) {
    return <p className="p-6 text-sm text-destructive">{erro}</p>;
  }
  if (!project) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>;
  }

  const views: CheckpointView[] = project.checkpoints.map((c) => ({
    id: c.id,
    numero: c.numero,
    titulo: c.titulo,
    status: c.status,
    notas: c.notas,
    payload: c.payload,
  }));

  const atual = views.find((c) => c.status === "aguardando") ?? null;

  const plano = views.find((c) => c.payload?.id === "plano_coleta")?.payload;
  const estimado: CustoEstimado | null =
    plano && plano.id === "plano_coleta" ? plano.plano.custo : null;

  const relatorio = project.reportArtifacts[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-primary">{project.nome}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
              {PROJECT_STATUS_LABEL[project.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">{project.tipo}</span>
          </div>
        </div>
        <Button variant="outline" onClick={sair}>
          Sair
        </Button>
      </header>

      {erro ? <p className="mb-4 text-sm text-destructive">{erro}</p> : null}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {atual ? (
            <CheckpointCard
              checkpoint={atual}
              onDecisao={(d, n) => decidir(atual.id, d, n)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Nenhum checkpoint aguardando
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {project.status === "concluido"
                  ? "Diagnostico concluido."
                  : project.status === "reprovado"
                    ? "Fluxo encerrado."
                    : "O pipeline esta processando. Aguarde o proximo checkpoint."}
              </CardContent>
            </Card>
          )}

          {relatorio ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Relatorio gerado</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{relatorio.titulo}</p>
                <p className="text-muted-foreground">
                  {relatorio.storagePath}
                  {relatorio.bytes ? ` (${relatorio.bytes} bytes)` : ""}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <CostEstimator
            custoAcumulado={project.custoAcumulado}
            estimado={estimado}
          />
          <CheckpointPanel checkpoints={views} />
        </div>
      </div>
    </main>
  );
}
