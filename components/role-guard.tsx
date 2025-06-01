"use client"

import type React from "react"
import { useUser } from "@/contexts/user-context"
import type { UserRole } from "@/types/user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles: UserRole[]
    fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { userProfile, loading } = useUser()

    if (loading) {
        return <LoadingSpinner />
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <CardTitle>Perfil não encontrado</CardTitle>
                        <CardDescription>Não foi possível carregar seu perfil de usuário</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!allowedRoles.includes(userProfile.role)) {
        if (fallback) {
            return <>{fallback}</>
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <CardTitle>Acesso Negado</CardTitle>
                        <CardDescription>Você não tem permissão para acessar esta página</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Seu perfil atual: <strong>{userProfile.role}</strong>
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <>{children}</>
}
