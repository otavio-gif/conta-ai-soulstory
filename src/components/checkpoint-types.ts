import type { CheckpointPayload } from "@/lib/pipeline/types";

export interface CheckpointView {
  id: string;
  numero: number;
  titulo: string;
  status: string;
  notas: string | null;
  payload: CheckpointPayload | null;
}
