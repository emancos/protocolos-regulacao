"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Calendar, Phone, FileText, Edit, History, ArchiveRestore, Hash, Building, MapPin, User, SquareActivity } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { RequisitionService } from "@/lib/requisition-service"
import { type Requisition, Status, Priority, PRIORITY_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/types/requisitions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/contexts/user-context"
import { ImageWithFallback } from "@/components/Image-with-fallback"
import { HealthDataService } from "@/lib/health-data-service"
import { HealthAgent, HealthUnit } from "@/types/health-data"

export default function RequisitionDetailPage() {
    return (
        <AuthGuard>
            <RequisitionDetail />
        </AuthGuard>
    )
}

function RequisitionDetail() {
    const params = useParams()
    const { hasPermission } = useUser()
    const requisitionId = params.id as string

    const [requisition, setRequisition] = useState<Requisition | null>(null)
    const [healthUnit, setHealthUnit] = useState<HealthUnit | null>(null)
    const [healthAgent, setHealthAgent] = useState<HealthAgent | null>(null)
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
                setLoading(true);
                const requisitionData = await RequisitionService.getRequisitionById(requisitionId);
                if (requisitionData) {
                    setRequisition(requisitionData);

                    // Buscar dados relacionados
                    if (requisitionData.healthUnitId) {
                        const unitData = await HealthDataService.getHealthUnitById(requisitionData.healthUnitId);
                        setHealthUnit(unitData);
                    }
                    if (requisitionData.healthAgentId) {
                        const agentData = await HealthDataService.getHealthAgentById(requisitionData.healthAgentId);
                        setHealthAgent(agentData);
                    }

                } else {
                    setError("Requisição não encontrada");
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
        return <Badge className={`${STATUS_COLORS[status]} text-white`}>{STATUS_LABELS[status]}</Badge>
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
                                    {requisition.schedulingHistory && requisition.schedulingHistory.length > 0 && (
                                        <TabsTrigger value="history">
                                            <History className="h-4 w-4 mr-2" />
                                            Histórico
                                            <Badge variant="secondary" className="ml-2">
                                                {requisition.schedulingHistory.length}
                                            </Badge>
                                        </TabsTrigger>
                                    )}
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
                                                {(healthUnit || healthAgent) && (
                                                    <div>
                                                        <h3 className="text-lg font-medium">Unidade e Agente de Saúde</h3>
                                                        <Separator className="my-2" />
                                                        <div className="space-y-3">
                                                            {healthUnit && (
                                                                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                                                                    <p className="font-semibold flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />Unidade: {healthUnit.name}</p>
                                                                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /> {healthUnit.location}</div>
                                                                    <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3 w-3" /> Enf. Resp.: {healthUnit.responsible_nurse}</div>
                                                                </div>
                                                            )}
                                                            {healthAgent && (
                                                                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                                                                    <p className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />Agente: {healthAgent.name}</p>
                                                                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {healthAgent.phone_number}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-medium">Dados da Requisição</h3>
                                                <Separator className="my-2" />
                                                <div className="space-y-2">
                                                    {requisition.procedures.map((proc, index) => (
                                                        <div key={index} className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold flex items-center gap-2"><SquareActivity className="h-6 w-6 text-muted-foreground" />{proc.name}</p>
                                                            </div>
                                                            {proc.quantity > 1 && (
                                                                <Badge variant="outline" className="ml-2">
                                                                    {proc.quantity}x
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                                        <p>{STATUS_LABELS[requisition.status]}</p>
                                                    </div>
                                                    {requisition?.sisregCode && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Código SISREGIII</p>
                                                            <div className="flex items-center"><Hash className="h-3 w-3 mr-1 text-gray-400" /><span>{requisition.sisregCode}</span></div>
                                                        </div>
                                                    )}
                                                    {requisition?.regnutsCode && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Código REGNUTS</p>
                                                            <div className="flex items-center"><Hash className="h-3 w-3 mr-1 text-gray-400" /><span>{requisition.regnutsCode}</span></div>
                                                        </div>
                                                    )}
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
                                    </div>
                                </TabsContent>

                                {requisition.images && requisition.images.length > 0 && (
                                    <TabsContent value="images">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Imagens Anexadas</h3>
                                            <Separator className="my-2" />
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {requisition.images.map((image, index) => (
                                                    <div key={index} className="group">
                                                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                                                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                                <ImageWithFallback
                                                                    src={image.url}
                                                                    alt={image.name}
                                                                    className="transition-transform group-hover:scale-105"
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
                                                    <p className="text-sm font-medium text-gray-500">Acompanhante</p>
                                                    <p>{requisition.hasCompanion ? "Permitido" : "Não permitido"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Agendado em</p>
                                                    <p>{requisition.scheduledAt && formatDateTimeSafely(requisition.scheduledAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}

                                {requisition.schedulingHistory && requisition.schedulingHistory.length > 0 && (
                                    <TabsContent value="history">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Histórico de Agendamentos</h3>
                                            <Separator className="my-2" />
                                            <div className="space-y-4">
                                                {requisition.schedulingHistory
                                                    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                                                    .map((history, index) => (
                                                        <div key={history.id} className="border rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center space-x-2">
                                                                    {getStatusBadge(history.status)}
                                                                    <span className="text-sm text-gray-500">
                                                                        #{requisition.schedulingHistory!.length - index}
                                                                    </span>
                                                                </div>
                                                                <span className="text-sm text-gray-500">
                                                                    {formatDateTimeSafely(history.scheduledAt)}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                {history.scheduledDate && (
                                                                    <div>
                                                                        <p className="text-gray-500">Data/Hora</p>
                                                                        <p>{formatDateTimeSafely(history.scheduledDate)}</p>
                                                                    </div>
                                                                )}
                                                                {history.scheduledLocation && (
                                                                    <div>
                                                                        <p className="text-gray-500">Local</p>
                                                                        <p>{history.scheduledLocation}</p>
                                                                    </div>
                                                                )}
                                                                {history.regulationType && (
                                                                    <div>
                                                                        <p className="text-gray-500">Regulação</p>
                                                                        <p>{history.regulationType}</p>
                                                                    </div>
                                                                )}
                                                                {history.sisregCode && (
                                                                    <div><p className="text-gray-500">Cód. SISREGIII</p><p>{history.sisregCode}</p></div>
                                                                )}
                                                                {history.regnutsCode && (
                                                                    <div><p className="text-gray-500">Cód. REGNUTS</p><p>{history.regnutsCode}</p></div>
                                                                )}
                                                                <div>
                                                                    <p className="text-gray-500">Acompanhante</p>
                                                                    <p>{history.hasCompanion ? "Sim" : "Não"}</p>
                                                                </div>
                                                            </div>

                                                            {history.reason && (
                                                                <div className="mt-3">
                                                                    <p className="text-gray-500 text-sm">Observações</p>
                                                                    <p className="text-sm">{history.reason}</p>
                                                                </div>
                                                            )}

                                                            {history.cancelReason && (
                                                                <div className="mt-3">
                                                                    <p className="text-gray-500 text-sm">Motivo</p>
                                                                    <p className="text-sm text-red-600">{history.cancelReason}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}
                            </Tabs>

                            <div className="mt-6 flex justify-between">
                                <Button variant="outline" asChild>
                                    <Link href="/requisitions">Voltar para Lista</Link>
                                </Button>
                                <div className="flex space-x-2">
                                    {/* 1. Botão AGENDAR: Aparece apenas para status pendentes */}
                                    {(requisition.status === Status.PENDENTE ||
                                        requisition.status === Status.SIS_PENDENTE ||
                                        requisition.status === Status.RESOLICITADO) &&
                                        hasPermission("canApproveRequests") && (
                                            <Button asChild>
                                                <Link href={`/requisitions/${requisitionId}/schedule`}>Agendar</Link>
                                            </Button>
                                        )}

                                    {/* 2. Botão EDITAR: Aparece para todos, EXCETO os cancelados/arquivados */}
                                    {requisition.status !== Status.CANCELADO &&
                                        requisition.status !== Status.CANCELADO_ARQUIVADO &&
                                        hasPermission("canApproveRequests") && (
                                            <Button asChild variant="outline">
                                                <Link href={`/requisitions/${requisitionId}/edit`}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar Solicitação
                                                </Link>
                                            </Button>
                                        )}

                                    {/* 3. Botão ATIVAR: Aparece APENAS para os cancelados/arquivados */}
                                    {(requisition.status === Status.CANCELADO ||
                                        requisition.status === Status.CANCELADO_ARQUIVADO) &&
                                        hasPermission("canApproveRequests") && (
                                            <Button asChild>
                                                <Link href={`/requisitions/${requisition.id}/edit`}>
                                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                                    Ativar Protocolo
                                                </Link>
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
