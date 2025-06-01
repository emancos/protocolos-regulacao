"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"
import { CheckCircle, Database, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function TestConnectionPage() {
    const [authStatus, setAuthStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
    const [firestoreStatus, setFirestoreStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
    const [message, setMessage] = useState("")

    const testAuth = async () => {
        setAuthStatus("testing")
        try {
            await auth.authStateReady()
            setAuthStatus("success")
            setMessage("Firebase Auth está funcionando corretamente!")
        } catch (error) {
            setAuthStatus("error")
            setMessage(`Erro no Auth: ${error}`)
        }
    }

    const testFirestore = async () => {
        setFirestoreStatus("testing")
        try {
            // Tenta criar um documento de teste
            const testCollection = collection(db, "test")
            const docRef = await addDoc(testCollection, {
                message: "Teste de conexão",
                timestamp: new Date(),
            })

            // Tenta ler o documento
            await getDocs(testCollection)

            // Remove o documento de teste
            await deleteDoc(doc(db, "test", docRef.id))

            setFirestoreStatus("success")
            setMessage("Firestore está funcionando corretamente!")
        } catch (error) {
            setFirestoreStatus("error")
            setMessage(`Erro no Firestore: ${error}`)
        }
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
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Teste de Conexão Firebase</h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Verifique se todos os serviços do Firebase estão funcionando corretamente
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Firebase Auth Test */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    <CardTitle>Firebase Authentication</CardTitle>
                                </div>
                                {getStatusBadge(authStatus)}
                            </div>
                            <CardDescription>Testa a conexão com o Firebase Auth</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={testAuth} disabled={authStatus === "testing"} className="w-full">
                                {authStatus === "testing" ? "Testando..." : "Testar Authentication"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Firestore Test */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Database className="h-5 w-5 text-green-600" />
                                    <CardTitle>Cloud Firestore</CardTitle>
                                </div>
                                {getStatusBadge(firestoreStatus)}
                            </div>
                            <CardDescription>Testa operações de leitura e escrita no Firestore</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={testFirestore} disabled={firestoreStatus === "testing"} className="w-full">
                                {firestoreStatus === "testing" ? "Testando..." : "Testar Firestore"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Analytics Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5 text-purple-600" />
                                <CardTitle>Firebase Analytics</CardTitle>
                            </div>
                            <CardDescription>Analytics está configurado e funcionará automaticamente</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Configurado com MEASUREMENT_ID</span>
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
                            <Link href="/">Voltar ao Início</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/login">Ir para Login</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
