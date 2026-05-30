"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CheckpointView } from "@/components/checkpoint-types";
import type { CheckpointPayload, Decisao } from "@/lib/pipeline/types";
import { CHECKPOINTS } from "@/lib/pipeline/types";
import { formatBRL } from "@/lib/utils";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1 text-sm last:border-b-0">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function DetalhePayload({ payload }: { payload: CheckpointPayload }) {
  switch (payload.id) {
    case "plano_coleta": {
      const { plano } = payload;
      return (
        <div className="space-y-1">
          <Linha rotulo="Marca" valor={plano.marca} />
          <Linha rotulo="Fontes" valor={plano.fontes.map((f) => f.kind).join(", ")} />
          <Linha rotulo="Palavras-chave" valor={plano.palavrasChave.join(", ")} />
          <Linha rotulo="Custo estimado" valor={formatBRL(plano.custo.totalBRL)} />
          <Linha
            rotulo="Guardrail"
            valor={`${formatBRL(plano.custo.guardrailBRL)} (${plano.custo.dentroDoGuardrail ? "dentro" : "acima"})`}
          />
        </div>
      );
    }
    case "inventario_coleta": {
      const { inventario } = payload;
      return (
        <div className="space-y-1">
          <Linha rotulo="Artefatos brutos" valor={String(inventario.totalArtefatos)} />
          <Linha rotulo="Lacunas" valor={String(inventario.lacunas.length)} />
          <Linha
            rotulo="Metricas indisponiveis"
            valor={inventario.metricasIndisponiveis.join(", ")}
          />
        </div>
      );
    }
    case "transcricoes_ocr": {
      const { amostra } = payload;
      return (
        <div className="space-y-2">
          <Linha rotulo="Transcricoes" valor={String(amostra.totalTranscricoes)} />
          <Linha rotulo="OCR" valor={String(amostra.totalOcr)} />
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {amostra.amostras.map((a, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">{a.origem}</span>: {a.trecho}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "analises": {
      const { analise } = payload;
      return (
        <ul className="space-y-2 text-sm">
          {analise.insights.map((ins, i) => (
            <li key={i}>
              <span className="font-medium">{ins.titulo}</span>{" "}
              <span className="text-muted-foreground">({ins.otica})</span>
              <p className="text-muted-foreground">{ins.conteudo}</p>
            </li>
          ))}
        </ul>
      );
    }
    case "outline": {
      const { outline } = payload;
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Parte I</p>
            <ul className="text-muted-foreground">
              {outline.parteI.map((s, i) => (
                <li key={i}>{s.titulo}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Parte II</p>
            <ul className="text-muted-foreground">
              {outline.parteII.map((s, i) => (
                <li key={i}>{s.titulo}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    case "verificacao_factual": {
      const { verificacao } = payload;
      return (
        <div className="space-y-2">
          <Linha rotulo="Confirmadas" valor={String(verificacao.confirmadas)} />
          <Linha rotulo="Descartadas" valor={String(verificacao.descartadas)} />
          <ul className="mt-2 space-y-1 text-sm">
            {verificacao.claims.map((c, i) => (
              <li key={i}>
                <span className="text-muted-foreground">[{c.status}]</span> {c.texto}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "draft_final": {
      return (
        <div className="space-y-1">
          <Linha rotulo="Documento" valor={payload.spec.projeto.nome} />
          <Linha
            rotulo="Armazenamento"
            valor={payload.storagePath ?? "gerado"}
          />
          <p className="pt-2 text-sm text-muted-foreground">
            Draft soulstory-docx pronto para aprovacao final.
          </p>
        </div>
      );
    }
    default:
      return null;
  }
}

export function CheckpointCard({
  checkpoint,
  onDecisao,
}: {
  checkpoint: CheckpointView;
  onDecisao: (decisao: Decisao, notas?: string) => Promise<void>;
}) {
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState<Decisao | null>(null);

  const def = CHECKPOINTS.find((c) => c.numero === checkpoint.numero);

  async function decidir(decisao: Decisao) {
    setEnviando(decisao);
    try {
      await onDecisao(decisao, notas || undefined);
    } finally {
      setEnviando(null);
    }
  }

  return (
    <Card className="border-ring">
      <CardHeader>
        <CardTitle>
          Checkpoint {checkpoint.numero}: {checkpoint.titulo}
        </CardTitle>
        <CardDescription>{def?.descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkpoint.payload ? (
          <DetalhePayload payload={checkpoint.payload} />
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados para revisar.</p>
        )}

        <Textarea
          placeholder="Notas (opcional): contexto para aprovar, reprovar ou pedir ajuste."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => decidir("aprovado")}
            disabled={enviando !== null}
          >
            {enviando === "aprovado" ? "Aprovando..." : "Aprovar"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => decidir("ajuste")}
            disabled={enviando !== null}
          >
            {enviando === "ajuste" ? "Enviando..." : "Pedir ajuste"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => decidir("reprovado")}
            disabled={enviando !== null}
          >
            {enviando === "reprovado" ? "Reprovando..." : "Reprovar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
