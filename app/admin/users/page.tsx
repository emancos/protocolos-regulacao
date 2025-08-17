"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@/contexts/user-context"
import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { UserService } from "@/lib/user-service"
import { type UserProfile, UserRole, ROLE_LABELS } from "@/types/user"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { InputMask } from "@/components/ui/input-mask"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Users, UserCheck, UserX, RefreshCw, Plus, Edit, Eye, EyeOff } from "lucide-react"

// --- DIÁLOGO PARA UTILIZADORES ---
function UserDialog({ open, onOpenChange, onSave, user, adminUid }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: () => void, user?: UserProfile | null, adminUid?: string }) {
    const [formData, setFormData] = useState({
        displayName: '', email: '', password: '', confirmPassword: '', role: UserRole.SOLICITANTE,
        telefone: '', cpf: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isEditMode = !!user;

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName,
                email: user.email,
                password: '',
                confirmPassword: '',
                role: user.role,
                telefone: user.additionalInfo?.telefone || '',
                cpf: user.additionalInfo?.cpf || '',
            });
        } else {
            setFormData({
                displayName: '', email: '', password: '', confirmPassword: '', role: UserRole.SOLICITANTE,
                telefone: '', cpf: ''
            });
        }
        setError('');
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isEditMode && formData.password !== formData.confirmPassword) {
            return setError("As senhas não coincidem.");
        }
        if (!isEditMode && formData.password.length < 6) {
            return setError("A senha deve ter pelo menos 6 caracteres.");
        }

        setIsSaving(true);
        try {
            const additionalInfo = {
                telefone: formData.telefone,
                cpf: formData.cpf,
            };

            if (isEditMode) {
                if (!user) return;
                await UserService.updateUserProfile(user.uid, {
                    displayName: formData.displayName,
                    role: formData.role,
                    additionalInfo,
                    updatedBy: adminUid,
                });
            } else {
                if (!adminUid) throw new Error("Admin UID não encontrado.");
                await UserService.createNewAuthUserAndProfile({
                    email: formData.email,
                    password: formData.password,
                    displayName: formData.displayName,
                    role: formData.role,
                    additionalInfo,
                }, adminUid);
            }
            onSave();
            onOpenChange(false);
        } catch (err) {
            console.error("Erro ao salvar utilizador:", err);
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Utilizador' : 'Adicionar Novo Utilizador'}</DialogTitle>
                    <DialogDescription>Preencha as informações do utilizador.</DialogDescription>
                </DialogHeader>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <form onSubmit={handleSubmit} id="user-form" className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2"><h3 className="font-medium">Dados de Acesso</h3><Separator /></div>
                        <div className="space-y-2"><Label htmlFor="displayName">Nome completo *</Label><Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={isEditMode} /></div>
                        {!isEditMode && (
                            <>
                                <div className="space-y-2"><Label htmlFor="password">Senha *</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!isEditMode} placeholder="Mínimo 6 caracteres" /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div>
                                <div className="space-y-2"><Label htmlFor="confirmPassword">Confirmar senha *</Label><Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required /></div>
                            </>
                        )}
                        <div className="space-y-2 md:col-span-2"><h3 className="font-medium">Dados Pessoais</h3><Separator /></div>
                        <div className="space-y-2"><Label htmlFor="telefone">Telefone *</Label><InputMask id="telefone" mask="(99) 99999-9999" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><InputMask id="cpf" mask="999.999.999-99" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} /></div>
                        <div className="space-y-2 md:col-span-2"><h3 className="font-medium">Perfil e Permissões</h3><Separator /></div>
                        <div className="space-y-2"><Label htmlFor="role">Perfil do Utilizador *</Label><Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.values(UserRole).map((roleOption) => (<SelectItem key={roleOption} value={roleOption}>{ROLE_LABELS[roleOption]}</SelectItem>))}</SelectContent></Select></div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="user-form" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function UsersManagement() {
    const { userProfile } = useUser()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [message, setMessage] = useState("")

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true)
            const allUsers = await UserService.getAllUsers()
            setUsers(allUsers)
        } catch (error) {
            console.error("Erro ao carregar utilizadores:", error)
            setMessage("Erro ao carregar utilizadores")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            setUpdating(userId)
            await UserService.updateUserProfile(userId, { isActive: !currentStatus, updatedBy: userProfile?.uid })
            await loadUsers()
            setMessage(`Utilizador ${!currentStatus ? "ativado" : "desativado"} com sucesso`)
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Erro ao alterar status:", error)
            setMessage("Erro ao alterar status do utilizador")
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
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerir Utilizadores</h1>
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Utilizadores do Sistema
                                </CardTitle>
                                <CardDescription>Gerencie perfis e permissões dos utilizadores</CardDescription>
                            </div>
                            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" />Adicionar Utilizador</Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                    <p>A carregar utilizadores...</p>
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
                                                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                                        {user.isActive ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{user.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button variant="outline" size="icon" onClick={() => handleEdit(user)} disabled={user.uid === userProfile?.uid}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
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
            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={loadUsers}
                user={selectedUser}
                adminUid={userProfile?.uid}
            />
        </div>
    )
}

export default function UsersPage() {
    return (
        <AuthGuard>
            <RoleGuard allowedRoles={[UserRole.ADMINISTRADOR]}>
                <UsersManagement />
            </RoleGuard>
        </AuthGuard>
    )
}
