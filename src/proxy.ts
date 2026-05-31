import { NextResponse, type NextRequest } from "next/server";

export const AUTH_COOKIE = "soulstory_auth";

// Porta unica de acesso (PRD secao 4): monousuario, sem papeis. O cookie e
// setado por /api/login apos conferir APP_ACCESS_PASSWORD.
// Convencao "proxy" do Next 16 (sucessora de middleware).
export function proxy(request: NextRequest) {
  const autenticado = request.cookies.get(AUTH_COOKIE)?.value === "1";

  if (!autenticado) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protege tudo, exceto a tela de login, a rota de login e estaticos.
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
