"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function isoDaysAgo(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default function NovoDiagnostico() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"marca" | "influenciador">("marca");
  const [briefing, setBriefing] = useState("");
  const [janelaInicio, setJanelaInicio] = useState(isoDaysAgo(90));
  const [janelaFim, setJanelaFim] = useState(isoDaysAgo(0));
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome || undefined,
        tipo,
        briefing,
        janelaInicio: new Date(janelaInicio).toISOString(),
        janelaFim: new Date(janelaFim).toISOString(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCarregando(false);
    if (res.ok) {
      router.push(`/projects/${data.id}`);
    } else {
      setErro(data.erro ?? "Falha ao criar o diagnostico.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        Voltar
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Novo diagnostico</CardTitle>
          <CardDescription>
            Descreva a marca ou influenciador em texto livre e defina a janela.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={criar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome (opcional)</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Cafes Serra Azul"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value as "marca" | "influenciador")
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="marca">Marca</option>
                <option value="influenciador">Influenciador</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="briefing">Briefing</Label>
              <Textarea
                id="briefing"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Quem e a marca, perfis, site, presenca no Reclame Aqui, palavras-chave de mencao."
                className="min-h-40"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Janela: inicio</Label>
                <Input
                  id="inicio"
                  type="date"
                  value={janelaInicio}
                  onChange={(e) => setJanelaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fim">Janela: fim</Label>
                <Input
                  id="fim"
                  type="date"
                  value={janelaFim}
                  onChange={(e) => setJanelaFim(e.target.value)}
                />
              </div>
            </div>

            {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

            <Button type="submit" disabled={carregando}>
              {carregando ? "Criando..." : "Criar e iniciar pipeline"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
