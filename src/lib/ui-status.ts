import type { BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  aguardando_aprovacao: "Aguardando aprovacao",
  concluido: "Concluido",
  reprovado: "Reprovado",
};

export const PROJECT_STATUS_VARIANT: Record<string, Variant> = {
  rascunho: "muted",
  em_andamento: "secondary",
  aguardando_aprovacao: "warning",
  concluido: "success",
  reprovado: "destructive",
};

export const CHECKPOINT_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aguardando: "Aguardando decisao",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  ajuste: "Ajuste solicitado",
};

export const CHECKPOINT_STATUS_VARIANT: Record<string, Variant> = {
  pendente: "muted",
  aguardando: "warning",
  aprovado: "success",
  reprovado: "destructive",
  ajuste: "secondary",
};
