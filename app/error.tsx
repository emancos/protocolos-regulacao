"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <CardTitle>Algo deu errado!</CardTitle>
                    <CardDescription>
                        Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={reset} className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar novamente
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
