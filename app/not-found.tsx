import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-6xl font-bold text-gray-400 mb-4">404</CardTitle>
                    <CardDescription className="text-xl">Página não encontrada</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-6">A página que você está procurando não existe ou foi movida.</p>
                    <Button asChild>
                        <Link href="/">
                            <Home className="h-4 w-4 mr-2" />
                            Voltar ao início
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
