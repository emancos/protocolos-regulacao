"use client"

import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function DebugUserInfo() {
    const { user } = useAuth()
    const { userProfile, loading, refreshProfile } = useUser()

    return (
        <Card className="w-full max-w-2xl mx-auto mt-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Debug - Informações do Usuário</CardTitle>
                        <CardDescription>Informações para debug do sistema de autenticação</CardDescription>
                    </div>
                    <Button onClick={refreshProfile} size="sm" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Recarregar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">Firebase Auth:</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                        <p>
                            <strong>UID:</strong> {user?.uid || "Não logado"}
                        </p>
                        <p>
                            <strong>Email:</strong> {user?.email || "N/A"}
                        </p>
                        <p>
                            <strong>Nome:</strong> {user?.displayName || "N/A"}
                        </p>
                        <p>
                            <strong>Verificado:</strong> {user?.emailVerified ? "Sim" : "Não"}
                        </p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Perfil Firestore:</h4>
                    {loading ? (
                        <Badge variant="secondary">Carregando...</Badge>
                    ) : userProfile ? (
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                            <p>
                                <strong>UID:</strong> {userProfile.uid}
                            </p>
                            <p>
                                <strong>Email:</strong> {userProfile.email}
                            </p>
                            <p>
                                <strong>Nome:</strong> {userProfile.displayName}
                            </p>
                            <p>
                                <strong>Perfil:</strong> {userProfile.role}
                            </p>
                            <p>
                                <strong>Ativo:</strong> {userProfile.isActive ? "Sim" : "Não"}
                            </p>
                            <p>
                                <strong>Criado em:</strong> {userProfile.createdAt.toLocaleString("pt-BR")}
                            </p>
                            <p>
                                <strong>Telefone:</strong> {userProfile.additionalInfo?.telefone || "N/A"}
                            </p>
                        </div>
                    ) : (
                        <Badge variant="destructive">Perfil não encontrado</Badge>
                    )}
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Status:</h4>
                    <div className="flex gap-2">
                        <Badge variant={user ? "default" : "destructive"}>Auth: {user ? "Conectado" : "Desconectado"}</Badge>
                        <Badge variant={userProfile ? "default" : "destructive"}>
                            Perfil: {userProfile ? "Carregado" : "Não encontrado"}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
