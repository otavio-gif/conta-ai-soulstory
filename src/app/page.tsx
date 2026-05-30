import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from "@/lib/ui-status";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projetos = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Diagnostico de Visao Externa
          </h1>
          <p className="text-sm text-muted-foreground">
            Conta A.I. Soulstory. Metodo Ana Couto.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Novo diagnostico</Link>
        </Button>
      </header>

      {projetos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum diagnostico ainda</CardTitle>
            <CardDescription>
              Crie o primeiro com um briefing em texto livre e a janela temporal.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {projetos.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`}>
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{p.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.tipo} · custo {formatBRL(p.custoAcumulado)}
                      </p>
                    </div>
                    <Badge variant={PROJECT_STATUS_VARIANT[p.status]}>
                      {PROJECT_STATUS_LABEL[p.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
