import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE } from "@/proxy";

const schema = z.object({ senha: z.string() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisicao invalida." }, { status: 400 });
  }

  const esperada = process.env.APP_ACCESS_PASSWORD;
  if (!esperada) {
    return NextResponse.json(
      { erro: "APP_ACCESS_PASSWORD nao configurada." },
      { status: 500 },
    );
  }

  if (parsed.data.senha !== esperada) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
