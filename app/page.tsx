import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { FirebaseStatus } from "@/components/firebase-status"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header com botão de tema */}
        <div className="flex justify-between items-center mb-8">
          <FirebaseStatus />
          <ThemeToggle />
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Secretaria municipal de
            <span className="text-blue-600 dark:text-blue-400"> Saúde</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Sistema de gerenciamento de protocolos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login">Fazer Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Criar Conta</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Crie sua conta
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Fácil de Usar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Acesse a interface para criar novos protocolos
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle>Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Gerenciar protocolos
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
