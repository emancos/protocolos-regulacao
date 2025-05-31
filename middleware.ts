import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
    // Rotas que requerem autenticação
    const protectedRoutes = ["/dashboard"]

    // Rotas públicas que usuários autenticados não deveriam acessar
    const authRoutes = ["/login", "/register"]

    const { pathname } = request.nextUrl

    // Para rotas protegidas, deixamos o AuthGuard do lado cliente lidar com a autenticação
    // pois o Firebase Auth funciona principalmente no cliente

    // Redireciona usuários já autenticados das páginas de auth
    // Nota: Esta verificação seria mais robusta com tokens do servidor
    if (authRoutes.includes(pathname)) {
        // Aqui você poderia verificar um cookie de sessão se implementado
        // Por simplicidade, deixamos o redirecionamento para o lado cliente
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
