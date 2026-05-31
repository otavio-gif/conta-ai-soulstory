import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CheckpointView } from "@/components/checkpoint-types";
import { CHECKPOINTS } from "@/lib/pipeline/types";
import {
  CHECKPOINT_STATUS_LABEL,
  CHECKPOINT_STATUS_VARIANT,
} from "@/lib/ui-status";
import { cn } from "@/lib/utils";

export function CheckpointPanel({
  checkpoints,
}: {
  checkpoints: CheckpointView[];
}) {
  const porNumero = new Map(checkpoints.map((c) => [c.numero, c]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Checkpoints (7)</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {CHECKPOINTS.map((def) => {
            const atual = porNumero.get(def.numero);
            const status = atual?.status ?? "pendente";
            const ativo = status === "aguardando";
            return (
              <li
                key={def.numero}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2",
                  ativo && "border-ring bg-accent/40",
                )}
              >
                <span className="text-sm">
                  <span className="text-muted-foreground">{def.numero}.</span>{" "}
                  {def.titulo}
                </span>
                <Badge variant={CHECKPOINT_STATUS_VARIANT[status]}>
                  {CHECKPOINT_STATUS_LABEL[status]}
                </Badge>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
