"use client"

import type React from "react"

import { ArrowLeft } from "lucide-react"

import { useState, useEffect } from "react"
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
import { FirebaseError } from "firebase/app"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            router.push("/dashboard")
        }
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            await login(email, password)
            router.push("/dashboard")
        } catch (error) {
            console.error("Erro no login:", error)

            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "auth/user-not-found":
                        setError("Usuário não encontrado")
                        break
                    case "auth/wrong-password":
                        setError("Senha incorreta")
                        break
                    case "auth/invalid-email":
                        setError("Email inválido")
                        break
                    case "auth/too-many-requests":
                        setError("Muitas tentativas. Tente novamente mais tarde")
                        break
                    case "auth/invalid-credential":
                        setError("Credenciais inválidas. Verifique seu email e senha")
                        break
                    default:
                        setError("Erro ao fazer login. Verifique suas credenciais")
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
            <div className="absolute top-4 left-4">
                <Link href="/">
                    <Button variant="outline" className="w-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />Voltar
                    </Button>
                </Link>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                    <CardDescription className="text-center">Entre com suas credenciais para acessar sua conta</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
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
                                    placeholder="Sua senha"
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
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                        <p className="text-sm text-center text-gray-600">
                            Esqueceu sua senha?{" "}
                            <Link href="/forgot-password" className="text-blue-600 hover:underline">
                                Recuperar
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
