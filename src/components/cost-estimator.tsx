import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustoEstimado } from "@/lib/pipeline/types";
import { formatBRL } from "@/lib/utils";

export function CostEstimator({
  custoAcumulado,
  estimado,
}: {
  custoAcumulado: number;
  estimado: CustoEstimado | null;
}) {
  const acimaDoGuardrail = estimado ? !estimado.dentroDoGuardrail : false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Custo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Acumulado (real)</span>
          <span className="font-medium">{formatBRL(custoAcumulado)}</span>
        </div>

        {estimado ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimado (plano)</span>
              <span className="font-medium">
                {formatBRL(estimado.totalBRL)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Guardrail ({estimado.mesesJanela} mes(es))
              </span>
              <span>{formatBRL(estimado.guardrailBRL)}</span>
            </div>
            {acimaDoGuardrail ? (
              <Badge variant="warning">
                Acima do alvo. Requer aprovacao explicita.
              </Badge>
            ) : (
              <Badge variant="success">Dentro do alvo.</Badge>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            A estimativa aparece no Checkpoint 1 (plano de coleta).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
