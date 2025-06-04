"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Calendar, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { RequisitionService } from "@/lib/requisition-service"
import { type Requisition, Status, Priority, PRIORITY_LABELS, STATUS_LABELS } from "@/types/requisitions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function RequisitionDetailPage() {
    return (
        <AuthGuard>
            <RequisitionDetail />
        </AuthGuard>
    )
}

function RequisitionDetail() {
    const params = useParams()
    // const router = useRouter()
    const requisitionId = params.id as string

    const [requisition, setRequisition] = useState<Requisition | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useState("details")

    const formatDateSafely = (date: Date | undefined | null, formatString = "dd/MM/yyyy") => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return "Data inválida"
        }
        try {
            return format(date, formatString, { locale: ptBR })
        } catch (error) {
            console.error("Erro ao formatar data:", error)
            return "Data inválida"
        }
    }

    const formatDateTimeSafely = (date: Date | undefined | null) => {
        return formatDateSafely(date, "dd/MM/yyyy 'às' HH:mm")
    }

    useEffect(() => {
        const loadRequisition = async () => {
            try {
                setLoading(true)
                const data = await RequisitionService.getRequisition(requisitionId)
                if (data) {
                    setRequisition(data)
                } else {
                    setError("Requisição não encontrada")
                }
            } catch (error) {
                console.error("Erro ao carregar requisição:", error)
                setError("Erro ao carregar dados da requisição")
            } finally {
                setLoading(false)
            }
        }

        loadRequisition()
    }, [requisitionId])

    const getPriorityBadge = (priority: Priority) => {
        switch (priority) {
            case Priority.P1:
                return <Badge className="bg-red-500">P1</Badge>
            case Priority.P2:
                return <Badge className="bg-orange-500">P2</Badge>
            case Priority.P3:
                return <Badge className="bg-yellow-500">P3</Badge>
            case Priority.P4:
                return <Badge className="bg-green-500">P4</Badge>
            default:
                return <Badge>{priority}</Badge>
        }
    }

    const getStatusBadge = (status: Status) => {
        switch (status) {
            case Status.PENDENTE:
                return <Badge variant="outline">Pendente</Badge>
            case Status.AGENDADO:
                return <Badge className="bg-blue-500">Agendado</Badge>
            case Status.REALIZADO:
                return <Badge className="bg-green-500">Realizado</Badge>
            case Status.CANCELADO:
                return <Badge variant="destructive">Cancelado</Badge>
            case Status.SIS_PENDENTE:
                return <Badge variant="secondary">SIS Pendente</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Carregando requisição...</p>
                </div>
            </div>
        )
    }

    if (error || !requisition) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Erro</CardTitle>
                        <CardDescription>{error || "Requisição não encontrada"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/requisitions">Voltar para Requisições</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/requisitions">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Voltar
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detalhes da Requisição</h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Protocolo: {requisition.protocol}
                                    </CardTitle>
                                    <CardDescription>Criado em {formatDateTimeSafely(requisition.createdAt)}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(requisition.status)}
                                    {getPriorityBadge(requisition.priority)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                                    {requisition.images && requisition.images.length > 0 && (
                                        <TabsTrigger value="images">
                                            Imagens{" "}
                                            <Badge variant="secondary" className="ml-2">
                                                {requisition.images.length}
                                            </Badge>
                                        </TabsTrigger>
                                    )}
                                    {requisition.status === Status.AGENDADO && <TabsTrigger value="schedule">Agendamento</TabsTrigger>}
                                </TabsList>

                                <TabsContent value="details">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-medium">Dados do Paciente</h3>
                                                <Separator className="my-2" />
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Nome</p>
                                                        <p>{requisition.patientName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Cartão SUS</p>
                                                        <p>{requisition.susCard}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Telefones</p>
                                                        <div className="space-y-1">
                                                            {requisition.phones.map((phone, index) => (
                                                                <div key={index} className="flex items-center">
                                                                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                                                    <span>{phone}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-medium">Dados da Requisição</h3>
                                                <Separator className="my-2" />
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                                        <p>{STATUS_LABELS[requisition.status]}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Prioridade</p>
                                                        <p>{PRIORITY_LABELS[requisition.priority]}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Data de Recebimento</p>
                                                        <div className="flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                                            <span>{formatDateSafely(requisition.receivedDate)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-medium">Procedimentos</h3>
                                                <Separator className="my-2" />
                                                <div className="space-y-2">
                                                    {requisition.procedures.map((proc, index) => (
                                                        <Card key={index} className="p-3">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-medium">{proc.name}</p>
                                                                </div>
                                                                {proc.quantity > 1 && (
                                                                    <Badge variant="outline" className="ml-2">
                                                                        {proc.quantity}x
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {requisition.images && requisition.images.length > 0 && (
                                    <TabsContent value="images">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Imagens Anexadas</h3>
                                            <Separator className="my-2" />
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {requisition.images.map((image, index) => (
                                                    <div key={index} className="relative group">
                                                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                                <img
                                                                    src={image.url || "/placeholder.svg"}
                                                                    alt={image.name}
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                                    onError={(e) => {
                                                                        // Fallback para ícone se a imagem falhar ao carregar
                                                                        e.currentTarget.style.display = "none"
                                                                        const parent = e.currentTarget.parentElement
                                                                        if (parent) {
                                                                            const icon = document.createElement("div")
                                                                            icon.className = "flex items-center justify-center h-full w-full"
                                                                            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>`
                                                                            parent.appendChild(icon)
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="mt-2">
                                                                <p className="text-xs font-medium truncate" title={image.name}>
                                                                    {image.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(image.size / 1024).toFixed(1)} KB • {formatDateSafely(image.uploadedAt)}
                                                                </p>
                                                            </div>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}

                                {requisition.status === Status.AGENDADO && (
                                    <TabsContent value="schedule">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Informações do Agendamento</h3>
                                            <Separator className="my-2" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Data Agendada</p>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                        <span>{requisition.scheduledDate && formatDateTimeSafely(requisition.scheduledDate)}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Local</p>
                                                    <p>{requisition.scheduledLocation}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Tipo de Regulação</p>
                                                    <p>{requisition.regulationType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Agendado em</p>
                                                    <p>{requisition.scheduledAt && formatDateTimeSafely(requisition.scheduledAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}
                            </Tabs>

                            <div className="mt-6 flex justify-between">
                                <Button variant="outline" asChild>
                                    <Link href="/requisitions">Voltar para Lista</Link>
                                </Button>
                                {requisition.status === Status.PENDENTE && (
                                    <Button asChild>
                                        <Link href={`/requisitions/${requisitionId}/schedule`}>Agendar</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
