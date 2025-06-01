"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RefreshCw, ChevronDown, ChevronUp, Bug } from "lucide-react"
import { UserRole } from "@/types/user"

export function DebugUserInfo() {
    const { user } = useAuth()
    const { userProfile, loading, refreshProfile, isRole } = useUser()
    const [isOpen, setIsOpen] = useState(false)

    // Só mostra para administradores
    if (!isRole(UserRole.ADMINISTRADOR)) {
        return null
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full max-w-2xl mx-auto mb-6">
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Bug className="h-5 w-5 text-orange-500" />
                                <CardTitle className="text-lg">Debug do Sistema</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    Admin Only
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        refreshProfile()
                                    }}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                </Button>
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                        </div>
                        <CardDescription>Informações técnicas do sistema de autenticação</CardDescription>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-sm text-blue-600 dark:text-blue-400">Firebase Auth:</h4>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <p>
                                        <span className="text-gray-500">UID:</span> {user?.uid || "Não logado"}
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Email:</span> {user?.email || "N/A"}
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Nome:</span> {user?.displayName || "N/A"}
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Verificado:</span>{" "}
                                        <Badge variant={user?.emailVerified ? "default" : "secondary"} className="text-xs">
                                            {user?.emailVerified ? "Sim" : "Não"}
                                        </Badge>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 text-sm text-green-600 dark:text-green-400">Perfil Firestore:</h4>
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <Badge variant="secondary">Carregando...</Badge>
                                </div>
                            ) : userProfile ? (
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <p>
                                            <span className="text-gray-500">UID:</span> {userProfile.uid}
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Email:</span> {userProfile.email}
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Nome:</span> {userProfile.displayName}
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Perfil:</span>{" "}
                                            <Badge variant="default" className="text-xs">
                                                {userProfile.role}
                                            </Badge>
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Ativo:</span>{" "}
                                            <Badge variant={userProfile.isActive ? "default" : "destructive"} className="text-xs">
                                                {userProfile.isActive ? "Sim" : "Não"}
                                            </Badge>
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Criado:</span> {userProfile.createdAt.toLocaleDateString("pt-BR")}
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Telefone:</span> {userProfile.additionalInfo?.telefone || "N/A"}
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Criado por:</span> {userProfile.createdBy || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                    <Badge variant="destructive">Perfil não encontrado no Firestore</Badge>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 text-sm text-purple-600 dark:text-purple-400">Status do Sistema:</h4>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={user ? "default" : "destructive"} className="text-xs">
                                    Auth: {user ? "✓ Conectado" : "✗ Desconectado"}
                                </Badge>
                                <Badge variant={userProfile ? "default" : "destructive"} className="text-xs">
                                    Perfil: {userProfile ? "✓ Carregado" : "✗ Não encontrado"}
                                </Badge>
                                <Badge variant={user?.uid === userProfile?.uid ? "default" : "destructive"} className="text-xs">
                                    Sync: {user?.uid === userProfile?.uid ? "✓ Sincronizado" : "✗ Dessincronizado"}
                                </Badge>
                            </div>
                        </div>

                        {/* Informações técnicas adicionais */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">Informações Técnicas:</h4>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
                                <p>
                                    <span className="text-gray-500">Última auth:</span>{" "}
                                    {user?.metadata.lastSignInTime
                                        ? new Date(user.metadata.lastSignInTime).toLocaleString("pt-BR")
                                        : "N/A"}
                                </p>
                                <p>
                                    <span className="text-gray-500">Criação auth:</span>{" "}
                                    {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString("pt-BR") : "N/A"}
                                </p>
                                <p>
                                    <span className="text-gray-500">Provider:</span> {user?.providerData[0]?.providerId || "N/A"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
