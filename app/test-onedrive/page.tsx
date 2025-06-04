/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Cloud, FolderPlus } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

export default function TestOneDrivePage() {
    return (
        <AuthGuard>
            <TestOneDriveContent />
        </AuthGuard>
    )
}

function TestOneDriveContent() {
    const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
    const [folderStatus, setFolderStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
    const [listStatus, setListStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
    const [message, setMessage] = useState("")
    const [driveItems, setDriveItems] = useState<any[]>([])
    const [currentPath, setCurrentPath] = useState("")

    const testConnection = async () => {
        setConnectionStatus("testing")
        try {
            const response = await fetch("/api/test-onedrive", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "test-connection" }),
            })

            const result = await response.json()

            if (result.success) {
                setConnectionStatus("success")
                setMessage(result.message)
            } else {
                setConnectionStatus("error")
                setMessage(result.message)
            }
        } catch (error) {
            setConnectionStatus("error")
            setMessage(error instanceof Error ? error.message : "Erro desconhecido")
        }
    }

    const testFolderCreation = async () => {
        setFolderStatus("testing")
        try {
            const response = await fetch("/api/test-onedrive", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "test-folder" }),
            })

            const result = await response.json()

            if (result.success) {
                setFolderStatus("success")
                setMessage(result.message)
            } else {
                setFolderStatus("error")
                setMessage(result.message)
            }
        } catch (error) {
            setFolderStatus("error")
            setMessage(error instanceof Error ? error.message : "Erro desconhecido")
        }
    }

    const listDriveItems = async (path = "") => {
        setListStatus("testing")
        setDriveItems([])
        try {
            const response = await fetch("/api/test-onedrive", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "list-items", path }),
            })

            const result = await response.json()

            if (result.success) {
                setListStatus("success")
                setDriveItems(result.items || [])
                setCurrentPath(path)
                setMessage(result.message)
            } else {
                setListStatus("error")
                setMessage(result.message)
            }
        } catch (error) {
            setListStatus("error")
            setMessage(error instanceof Error ? error.message : "Erro desconhecido")
        }
    }

    const navigateToFolder = (folderName: string) => {
        const newPath = currentPath ? `${currentPath}/${folderName}` : folderName
        listDriveItems(newPath)
    }

    const navigateUp = () => {
        const pathParts = currentPath.split("/").filter((p) => p.length > 0)
        pathParts.pop()
        const newPath = pathParts.join("/")
        listDriveItems(newPath)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("pt-BR")
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "testing":
                return <Badge variant="secondary">Testando...</Badge>
            case "success":
                return <Badge className="bg-green-500">✓ Funcionando</Badge>
            case "error":
                return <Badge variant="destructive">✗ Erro</Badge>
            default:
                return <Badge variant="outline">Não testado</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Teste de Conexão OneDrive</h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Verifique se a integração com o OneDrive está funcionando corretamente
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna da esquerda - Testes */}
                    <div className="space-y-6">
                        {/* Teste de Conexão */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Cloud className="h-5 w-5 text-blue-600" />
                                        <CardTitle>Conexão com OneDrive</CardTitle>
                                    </div>
                                    {getStatusBadge(connectionStatus)}
                                </div>
                                <CardDescription>Testa a autenticação e acesso ao Microsoft Graph API</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={testConnection} disabled={connectionStatus === "testing"} className="w-full">
                                    {connectionStatus === "testing" ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Testando...
                                        </>
                                    ) : (
                                        "Testar Conexão"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Teste de Criação de Pasta */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FolderPlus className="h-5 w-5 text-green-600" />
                                        <CardTitle>Criação de Pastas</CardTitle>
                                    </div>
                                    {getStatusBadge(folderStatus)}
                                </div>
                                <CardDescription>Testa a criação da estrutura de pastas para protocolos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={testFolderCreation} disabled={folderStatus === "testing"} className="w-full">
                                    {folderStatus === "testing" ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Testando...
                                        </>
                                    ) : (
                                        "Testar Criação de Pasta"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Informações de Configuração */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuração Atual</CardTitle>
                                <CardDescription>Variáveis de ambiente configuradas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        {process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm">MICROSOFT_CLIENT_ID</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">Pasta base: {process.env.ONEDRIVE_BASE_FOLDER || "Protocolos"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Message Display */}
                        {message && (
                            <Alert>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-center space-x-4">
                            <Button asChild variant="outline">
                                <Link href="/dashboard">Voltar ao Dashboard</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/requisitions/new">Testar Upload</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Coluna da direita - Explorador de arquivos */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FolderPlus className="h-5 w-5 text-purple-600" />
                                        <CardTitle>Explorador OneDrive</CardTitle>
                                    </div>
                                    {getStatusBadge(listStatus)}
                                </div>
                                <CardDescription>Navegue pelos arquivos e pastas do OneDrive</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex space-x-2">
                                    <Button onClick={() => listDriveItems("")} disabled={listStatus === "testing"} className="flex-1">
                                        {listStatus === "testing" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Carregando...
                                            </>
                                        ) : (
                                            "Listar Raiz"
                                        )}
                                    </Button>
                                    {currentPath && (
                                        <Button onClick={navigateUp} variant="outline">
                                            ← Voltar
                                        </Button>
                                    )}
                                </div>

                                {currentPath && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">📁 Caminho atual: /{currentPath}</div>
                                )}

                                {driveItems.length > 0 && (
                                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                                        <div className="divide-y">
                                            {driveItems.map((item, index) => (
                                                <div key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2 flex-1">
                                                            {item.type === "folder" ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => navigateToFolder(item.name)}
                                                                    className="p-0 h-auto font-normal justify-start"
                                                                >
                                                                    📁 {item.name}
                                                                </Button>
                                                            ) : (
                                                                <div className="flex items-center space-x-2">
                                                                    <span>📄</span>
                                                                    <span className="text-sm">{item.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 text-right">
                                                            {item.type === "file" && <div>{formatFileSize(item.size)}</div>}
                                                            <div>{formatDate(item.lastModifiedDateTime)}</div>
                                                        </div>
                                                    </div>
                                                    {item.type === "file" && item.downloadUrl && (
                                                        <div className="mt-2">
                                                            <Button asChild variant="outline" size="sm">
                                                                <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
                                                                    Download
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {listStatus === "success" && driveItems.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">📂 Pasta vazia</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
