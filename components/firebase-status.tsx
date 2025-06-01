"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function FirebaseStatus() {
    const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Tenta acessar o auth para verificar se o Firebase está configurado
                await auth.authStateReady()
                setStatus("connected")
            } catch (error) {
                console.error("Erro na conexão com Firebase:", error)
                setStatus("error")
            }
        }

        checkConnection()
    }, [])

    if (status === "loading") {
        return (
            <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Conectando...
            </Badge>
        )
    }

    if (status === "connected") {
        return (
            <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                <CheckCircle className="h-3 w-3" />
                Banco de dados conectado
            </Badge>
        )
    }

    return (
        <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Erro na Conexão
        </Badge>
    )
}
