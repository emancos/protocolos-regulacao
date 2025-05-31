"use client"

import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Mail } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

function DashboardContent() {
    const { user, logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error("Erro ao fazer logout:", error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <Button onClick={handleLogout} variant="outline">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Card className="max-w-md mx-auto">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback>
                                        <User className="h-10 w-10" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle>Bem-vindo!</CardTitle>
                            <CardDescription>Você está logado com sucesso</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                    <strong>Nome:</strong> {user?.displayName || "Não informado"}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                    <strong>Email:</strong> {user?.email}
                                </span>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500">
                                    Última autenticação:{" "}
                                    {user?.metadata.lastSignInTime
                                        ? new Date(user.metadata.lastSignInTime).toLocaleString("pt-BR")
                                        : "Não disponível"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    )
}
