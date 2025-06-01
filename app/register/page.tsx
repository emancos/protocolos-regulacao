"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { FirebaseError } from "firebase/app"

function RegisterForm() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const router = useRouter()

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

        setLoading(true)

        try {
            await register(email, password, name)
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
                        setError("Erro ao criar conta. Tente novamente")
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
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Cadastrar Novo Usuário</CardTitle>
                    <CardDescription className="text-center">Crie uma nova conta para outro usuário</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo</Label>
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
                            <Label htmlFor="email">Email</Label>
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
                            <Label htmlFor="password">Senha</Label>
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
                            <Label htmlFor="confirmPassword">Confirmar senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirme a senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full mt-4" disabled={loading}>
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
