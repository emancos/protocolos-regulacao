"use client"

import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { AuthGuard } from "@/components/auth-guard"
import { UserRoleBadge } from "@/components/user-role-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Mail, UserPlus, Users, Settings, Hospital } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { DebugUserInfo } from "@/components/debug-user-info"

function DashboardContent() {
    const { user, logout } = useAuth()
    const { userProfile, hasPermission } = useUser()

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
                    {/* Debug Info - Só para administradores */}
                    <DebugUserInfo />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Perfil do Usuário */}
                        <Card className="md:col-span-2 lg:col-span-1">
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
                                        <strong>Nome:</strong> {userProfile?.displayName || user?.displayName || "Não informado"}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>Email:</strong> {userProfile?.email || user?.email}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Settings className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        <strong>Perfil:</strong>
                                    </span>
                                    {userProfile ? (
                                        <UserRoleBadge role={userProfile.role} />
                                    ) : (
                                        <span className="text-xs text-gray-500">Carregando...</span>
                                    )}
                                </div>
                                {userProfile?.additionalInfo?.telefone && (
                                    <div className="flex items-center space-x-2">
                                        <Settings className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">
                                            <strong>Telefone:</strong> {userProfile.additionalInfo.telefone}
                                        </span>
                                    </div>
                                )}
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

                        {/* Ações Rápidas */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Ações Rápidas</CardTitle>
                                <CardDescription>Acesse as principais funcionalidades do sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {hasPermission("canCreateUsers") && (
                                    <Button asChild className="h-auto p-4 flex-col">
                                        <Link href="/register">
                                            <UserPlus className="h-6 w-6 mb-2" />
                                            <span>Adicionar Usuário</span>
                                        </Link>
                                    </Button>
                                )}

                                {hasPermission("canManageRoles") && (
                                    <Button asChild variant="outline" className="h-auto p-4 flex-col">
                                        <Link href="/admin/users">
                                            <Users className="h-6 w-6 mb-2" />
                                            <span>Gerenciar Usuários</span>
                                        </Link>
                                    </Button>
                                )}

                                {hasPermission("canManageHealthUnits") && (
                                    <Button asChild variant="outline" className="h-auto p-4 flex-col">
                                        <Link href="/admin/health-units">
                                            <Hospital className="h-6 w-6 mb-2" />
                                            <span>Unidades de Saúde</span>
                                        </Link>
                                    </Button>
                                )}

                                <Button asChild variant="outline" className="h-auto p-4 flex-col">
                                    <Link href="/requisitions">
                                        <Settings className="h-6 w-6 mb-2" />
                                        <span>Requisições</span>
                                    </Link>
                                </Button>

                                {hasPermission("canGenerateReports") && (
                                    <Button asChild variant="outline" className="h-auto p-4 flex-col">
                                        <Link href="/reports">
                                            <Settings className="h-6 w-6 mb-2" />
                                            <span>Relatórios</span>
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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
