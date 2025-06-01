"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { RoleGuard } from "@/components/role-guard"
import { UserRoleBadge } from "@/components/user-role-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { type UserProfile, UserRole, ROLE_LABELS } from "@/types/user"
import { UserService } from "@/lib/user-service"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Users, UserCheck, UserX, RefreshCw } from "lucide-react"
import Link from "next/link"

function UsersManagement() {
    const { userProfile } = useUser()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [message, setMessage] = useState("")

    const loadUsers = async () => {
        try {
            setLoading(true)
            const allUsers = await UserService.getAllUsers()
            setUsers(allUsers)
        } catch (error) {
            console.error("Erro ao carregar usuários:", error)
            setMessage("Erro ao carregar usuários")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (!userProfile) return

        try {
            setUpdating(userId)
            await UserService.updateUserRole(userId, newRole, userProfile.uid)
            await loadUsers()
            setMessage(`Perfil atualizado com sucesso`)
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error)
            setMessage("Erro ao atualizar perfil")
        } finally {
            setUpdating(null)
        }
    }

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            setUpdating(userId)
            await UserService.updateUserProfile(userId, { isActive: !currentStatus })
            await loadUsers()
            setMessage(`Usuário ${!currentStatus ? "ativado" : "desativado"} com sucesso`)
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Erro ao alterar status:", error)
            setMessage("Erro ao alterar status do usuário")
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Voltar
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <Button onClick={loadUsers} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Atualizar
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {message && (
                        <Alert className="mb-6">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Usuários do Sistema
                                    </CardTitle>
                                    <CardDescription>Gerencie perfis e permissões dos usuários</CardDescription>
                                </div>
                                <Badge variant="secondary">
                                    {users.length} usuário{users.length !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                    <p>Carregando usuários...</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Perfil</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Criado em</TableHead>
                                            <TableHead>Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.uid}>
                                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <UserRoleBadge role={user.role} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                                        {user.isActive ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{user.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Select
                                                            value={user.role}
                                                            onValueChange={(value: UserRole) => handleRoleChange(user.uid, value)}
                                                            disabled={updating === user.uid || user.uid === userProfile?.uid}
                                                        >
                                                            <SelectTrigger className="w-40">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(UserRole).map((role) => (
                                                                    <SelectItem key={role} value={role}>
                                                                        {ROLE_LABELS[role]}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => toggleUserStatus(user.uid, user.isActive)}
                                                            disabled={updating === user.uid || user.uid === userProfile?.uid}
                                                        >
                                                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

export default function UsersPage() {
    return (
        <RoleGuard allowedRoles={[UserRole.ADMINISTRADOR]}>
            <UsersManagement />
        </RoleGuard>
    )
}
