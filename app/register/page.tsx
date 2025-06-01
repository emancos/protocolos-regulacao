"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { FirebaseError } from "firebase/app"
import { UserService } from "@/lib/user-service"
import { UserRole, ROLE_LABELS } from "@/types/user"
import { Separator } from "@/components/ui/separator"
import { InputMask } from "@/components/ui/input-mask"

function RegisterForm() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [telefone, setTelefone] = useState("")
    const [cpf, setCpf] = useState("")
    const [unidadeSaude, setUnidadeSaude] = useState("")
    const [especialidade, setEspecialidade] = useState("")
    const [crm, setCrm] = useState("")
    const [role, setRole] = useState<UserRole>(UserRole.PACIENTE)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const { userProfile, isRole } = useUser()
    const router = useRouter()

    const isAdmin = isRole(UserRole.ADMINISTRADOR)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("As senhas não coincidem")
            return
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres")
            return
        }

        if (!telefone) {
            setError("Telefone é obrigatório")
            return
        }

        /* if (!cpf) {
            setError("CPF é obrigatório")
            return
        } */

        // Validações específicas por perfil
        if (role === UserRole.SOLICITANTE || role === UserRole.SOLICITANTE_REGULADO) {
            if (!unidadeSaude) {
                setError("Unidade de Saúde é obrigatória para este perfil")
                return
            }
            if (!especialidade) {
                setError("Especialidade é obrigatória para este perfil")
                return
            }
        }

        setLoading(true)

        try {
            // 1. Registra o usuário no Firebase Authentication
            const { user } = await register(email, password, name)

            // 2. Cria o perfil do usuário no Firestore
            const additionalInfo = {
                telefone,
                cpf,
                unidadeSaude: unidadeSaude || "",
                especialidade: especialidade || "",
                crm: crm || "",
            }

            // Se não for admin, força o perfil como PACIENTE
            const finalRole = isAdmin ? role : UserRole.PACIENTE

            await UserService.createUserProfile(
                user.uid,
                email,
                name,
                finalRole,
                userProfile?.uid || "system",
                additionalInfo,
            )

            router.push("/dashboard")
        } catch (error) {
            console.error("Erro no registro:", error)

            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "auth/email-already-in-use":
                        setError("Este email já está em uso")
                        break
                    case "auth/invalid-email":
                        setError("Email inválido")
                        break
                    case "auth/weak-password":
                        setError("Senha muito fraca. Use pelo menos 6 caracteres")
                        break
                    case "auth/operation-not-allowed":
                        setError("Operação não permitida. Entre em contato com o administrador")
                        break
                    default:
                        setError(`Erro ao criar conta: ${error.code}`)
                }
            } else {
                setError("Erro inesperado. Tente novamente")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-2xl font-bold">Cadastrar Novo Usuário</CardTitle>
                    </div>
                    <CardDescription>Crie uma nova conta para outro usuário no sistema</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Dados básicos */}
                            <div className="space-y-2 md:col-span-2">
                                <h3 className="text-lg font-medium">Dados de Acesso</h3>
                                <Separator />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome completo *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Nome do usuário"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha *</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirme a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Dados pessoais */}
                            <div className="space-y-2 md:col-span-2">
                                <h3 className="text-lg font-medium">Dados Pessoais</h3>
                                <Separator />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone *</Label>
                                <InputMask
                                    id="telefone"
                                    mask="(99) 99999-9999"
                                    placeholder="(00) 00000-0000"
                                    value={telefone}
                                    onChange={(e: { target: { value: React.SetStateAction<string> } }) => setTelefone(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF </Label>
                                <InputMask
                                    id="cpf"
                                    mask="999.999.999-99"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={(e: { target: { value: React.SetStateAction<string> } }) => setCpf(e.target.value)}
                                />
                            </div>

                            {/* Perfil e permissões */}
                            <div className="space-y-2 md:col-span-2">
                                <h3 className="text-lg font-medium">Perfil e Permissões</h3>
                                <Separator />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Perfil do Usuário *</Label>
                                <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={!isAdmin}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um perfil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(UserRole).map((roleOption) => (
                                            <SelectItem key={roleOption} value={roleOption}>
                                                {ROLE_LABELS[roleOption]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!isAdmin && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Apenas administradores podem criar usuários com outros perfis
                                    </p>
                                )}
                            </div>

                            {/* Campos condicionais baseados no perfil */}
                            {(role === UserRole.SOLICITANTE || role === UserRole.SOLICITANTE_REGULADO) && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="unidadeSaude">Unidade de Saúde *</Label>
                                        <Input
                                            id="unidadeSaude"
                                            placeholder="Nome da unidade"
                                            value={unidadeSaude}
                                            onChange={(e) => setUnidadeSaude(e.target.value)}
                                            required={role === UserRole.SOLICITANTE || role === UserRole.SOLICITANTE_REGULADO}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="especialidade">Especialidade *</Label>
                                        <Input
                                            id="especialidade"
                                            placeholder="Especialidade médica"
                                            value={especialidade}
                                            onChange={(e) => setEspecialidade(e.target.value)}
                                            required={role === UserRole.SOLICITANTE || role === UserRole.SOLICITANTE_REGULADO}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="crm">CRM</Label>
                                        <Input id="crm" placeholder="Número do CRM" value={crm} onChange={(e) => setCrm(e.target.value)} />
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Criando conta..." : "Criar conta"}
                        </Button>
                        <p className="text-sm text-center text-gray-600">
                            <Link href="/dashboard" className="text-blue-600 hover:underline">
                                Voltar ao Dashboard
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <AuthGuard>
            <RegisterForm />
        </AuthGuard>
    )
}
