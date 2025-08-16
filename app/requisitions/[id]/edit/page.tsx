"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, Clock, AlertTriangle, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { RequisitionService } from "@/lib/requisition-service"
import {
    type Requisition,
    Status,
    RegulationType,
    REGULATION_TYPE_LABELS,
    STATUS_LABELS,
    STATUS_COLORS,
    type ActionType
} from "@/types/requisitions"
import { type UpdateSchedulingData } from "@/lib/requisition-service"
import { UserRole } from "@/types/user"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditSchedulingPage() {
    return (
        <AuthGuard>
            <RoleGuard allowedRoles={[UserRole.ADMINISTRADOR, UserRole.SOLICITANTE_REGULADO]}>
                <EditSchedulingForm />
            </RoleGuard>
        </AuthGuard>
    )
}

function EditSchedulingForm() {
    const { user } = useAuth()
    const router = useRouter()
    const params = useParams()
    const requisitionId = params.id as string

    const [requisition, setRequisition] = useState<Requisition | null>(null)
    const [action, setAction] = useState<ActionType>("")
    const [cancelReason, setCancelReason] = useState("")
    const [reason, setReason] = useState("")
    const [sisregCode, setSisregCode] = useState("")
    const [regnutsCode, setRegnutsCode] = useState("")

    // Para reagendamento
    const [newScheduledDate, setNewScheduledDate] = useState<Date>(new Date())
    const [newScheduledTime, setNewScheduledTime] = useState("08:00")
    const [newScheduledLocation, setNewScheduledLocation] = useState("")
    const [newRegulationType, setNewRegulationType] = useState<RegulationType>(RegulationType.JOAO_PESSOA)
    const [newHasCompanion, setNewHasCompanion] = useState(false)

    const [loading, setLoading] = useState(false)
    const [loadingRequisition, setLoadingRequisition] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const loadRequisition = async () => {
            try {
                setLoadingRequisition(true)
                const data = await RequisitionService.getRequisition(requisitionId)
                if (data) {
                    setRequisition(data)
                    if (data.scheduledDate) setNewScheduledDate(data.scheduledDate)
                    if (data.scheduledLocation) setNewScheduledLocation(data.scheduledLocation)
                    if (data.regulationType) setNewRegulationType(data.regulationType)
                    if (data.hasCompanion) setNewHasCompanion(data.hasCompanion)
                    if (data.scheduledDate) {
                        const time = format(data.scheduledDate, "HH:mm")
                        setNewScheduledTime(time)
                    }
                    if (data.sisregCode) setSisregCode(data.sisregCode)
                    if (data.regnutsCode) setRegnutsCode(data.regnutsCode)
                } else {
                    setError("Requisição não encontrada")
                }
            } catch (error) {
                console.error("Erro ao carregar requisição:", error)
                setError("Erro ao carregar dados da requisição")
            } finally {
                setLoadingRequisition(false)
            }
        }
        loadRequisition()
    }, [requisitionId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!action) {
            setError("Selecione uma ação")
            return
        }

        if ((action === "cancel" || action === "archive" || action === "resolicit") && !cancelReason.trim()) {
            setError("Motivo é obrigatório para esta ação")
            return
        }

        if ((action === "sis_pendente" || action === "resolicit") && !sisregCode.trim() && !regnutsCode.trim()) {
            setError("É obrigatório preencher o Código SISREGIII ou o Código REGNUTS.")
            return
        }

        if (action === "reschedule" && !newScheduledLocation.trim()) {
            setError("Local de agendamento é obrigatório para reagendamento")
            return
        }

        try {
            setLoading(true)

            const updateData: Partial<UpdateSchedulingData> = {
                updatedBy: user?.uid || "",
                reason: reason || undefined,
                cancelReason: cancelReason || undefined,
                sisregCode: sisregCode || undefined,
                regnutsCode: regnutsCode || undefined,
            }

            switch (action) {
                case "cancel": updateData.status = Status.CANCELADO; break
                case "archive": updateData.status = Status.CANCELADO_ARQUIVADO; break
                case "resolicit": updateData.status = Status.RESOLICITADO; break
                case "complete": updateData.status = Status.REALIZADO; break
                case "sis_pendente": updateData.status = Status.SIS_PENDENTE; break
                case "reschedule":
                    const [hours, minutes] = newScheduledTime.split(":").map(Number)
                    const fullScheduledDate = new Date(newScheduledDate)
                    fullScheduledDate.setHours(hours, minutes)
                    updateData.status = Status.AGENDADO
                    updateData.newScheduledDate = fullScheduledDate
                    updateData.newScheduledLocation = newScheduledLocation
                    updateData.newRegulationType = newRegulationType
                    updateData.newHasCompanion = newHasCompanion
                    break
            }

            await RequisitionService.updateScheduling(requisitionId, updateData as UpdateSchedulingData)
            router.push("/requisitions")
        } catch (error) {
            console.error("Erro ao atualizar agendamento:", error)
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Ocorreu um erro desconhecido ao atualizar o agendamento.");
            }
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: Status) => {
        return <Badge className={`${STATUS_COLORS[status]} text-white`}>{STATUS_LABELS[status]}</Badge>
    }

    if (loadingRequisition) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Carregando requisição...</p>
                </div>
            </div>
        )
    }

    if (!requisition) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Requisição não encontrada</CardTitle>
                        <CardDescription>Não foi possível encontrar a requisição solicitada</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/requisitions">Voltar para Requisições</Link>
                        </Button>
                    </CardFooter>
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
                                <Link href={`/requisitions/${requisitionId}`}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Voltar
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Agendamento</h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="edit">Editar Agendamento</TabsTrigger>
                            <TabsTrigger value="history">
                                <History className="h-4 w-4 mr-2" />
                                Histórico
                                {requisition.schedulingHistory && requisition.schedulingHistory.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {requisition.schedulingHistory.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit">
                            <Card className="w-full max-w-2xl mx-auto">
                                <CardHeader>
                                    <CardTitle>Gerenciar Agendamento</CardTitle>
                                    <CardDescription>
                                        {requisition.patientName} - Protocolo: {requisition.protocol}
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-6 mb-6">
                                        {error && (
                                            <Alert variant="destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Informações atuais */}
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                                            <h3 className="font-medium mb-3">Agendamento Atual</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Status</p>
                                                    <div className="mt-1">{getStatusBadge(requisition.status)}</div>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Data/Hora</p>
                                                    <p>
                                                        {requisition.scheduledDate
                                                            ? format(requisition.scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                                            : "Não agendado"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Local</p>
                                                    <p>{requisition.scheduledLocation || "Não definido"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Acompanhante</p>
                                                    <p>{requisition.hasCompanion ? "Sim" : "Não"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seleção de ação */}
                                        <div className="space-y-2">
                                            <Label htmlFor="action">Ação a realizar *</Label>
                                            <Select value={action} onValueChange={(value: string) => { setAction(value as ActionType) }}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma ação" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sis_pendente">Aguardando Agendamento</SelectItem>
                                                    <SelectItem value="reschedule">Reagendar</SelectItem>
                                                    <SelectItem value="complete">Marcar como Realizado</SelectItem>
                                                    <SelectItem value="resolicit">Resolicitado</SelectItem>
                                                    <SelectItem value="cancel">Cancelar</SelectItem>
                                                    <SelectItem value="archive">Cancelar e Arquivar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Campos condicionais baseados na ação */}
                                        {(action === "sis_pendente" || action === "resolicit") && (
                                            <div className="space-y-4 border-t pt-4 animate-in fade-in-50">
                                                <h3 className="font-medium">Códigos de Regulação</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="sisregCode">Código SISREGIII</Label>
                                                        <Input id="sisregCode" value={sisregCode} onChange={(e) => setSisregCode(e.target.value)} placeholder="Código do SISREGIII" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="regnutsCode">Código REGNUTS</Label>
                                                        <Input id="regnutsCode" value={regnutsCode} onChange={(e) => setRegnutsCode(e.target.value)} placeholder="Código do REGNUTS" />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Preencha pelo menos um dos códigos acima.</p>
                                            </div>
                                        )}
                                        {action === "reschedule" && (
                                            <div className="space-y-4 border-t pt-4">
                                                <h3 className="font-medium">Novo Agendamento</h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="newScheduledDate">Nova Data *</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal",
                                                                        !newScheduledDate && "text-muted-foreground",
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {newScheduledDate
                                                                        ? format(newScheduledDate, "PPP", { locale: ptBR })
                                                                        : "Selecione uma data"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={newScheduledDate}
                                                                    onSelect={(date) => date && setNewScheduledDate(date)}
                                                                    initialFocus
                                                                    locale={ptBR}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="newScheduledTime">Novo Horário *</Label>
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                                            <Input
                                                                id="newScheduledTime"
                                                                type="time"
                                                                value={newScheduledTime}
                                                                onChange={(e) => setNewScheduledTime(e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="newScheduledLocation">Novo Local *</Label>
                                                        <Input
                                                            id="newScheduledLocation"
                                                            value={newScheduledLocation}
                                                            onChange={(e) => setNewScheduledLocation(e.target.value)}
                                                            placeholder="Nome da clínica ou hospital"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="newRegulationType">Tipo de Regulação *</Label>
                                                        <Select
                                                            value={newRegulationType}
                                                            onValueChange={(value) => setNewRegulationType(value as RegulationType)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione o tipo de regulação" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(RegulationType).map((type) => (
                                                                    <SelectItem key={type} value={type}>
                                                                        {REGULATION_TYPE_LABELS[type]}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="newHasCompanion"
                                                                checked={newHasCompanion}
                                                                onCheckedChange={(checked) => setNewHasCompanion(checked as boolean)}
                                                            />
                                                            <Label htmlFor="newHasCompanion">Tem direito a acompanhante</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Motivo para cancelamento/resolicitação */}
                                        {(action === "cancel" || action === "archive" || action === "resolicit") && (
                                            <div className="space-y-2">
                                                <Label htmlFor="cancelReason">Motivo *</Label>
                                                <Textarea
                                                    id="cancelReason"
                                                    value={cancelReason}
                                                    onChange={(e) => setCancelReason(e.target.value)}
                                                    placeholder="Descreva o motivo da ação"
                                                    rows={3}
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Observações gerais */}
                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Observações</Label>
                                            <Textarea
                                                id="reason"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Observações adicionais (opcional)"
                                                rows={3}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button variant="outline" asChild>
                                            <Link href={`/requisitions/${requisitionId}`}>Cancelar</Link>
                                        </Button>
                                        <Button type="submit" disabled={loading || !action}>
                                            {loading ? "Processando..." : "Confirmar Alteração"}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle>Histórico de Agendamentos</CardTitle>
                                    <CardDescription>Todas as alterações realizadas nesta requisição</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {requisition.schedulingHistory && requisition.schedulingHistory.length > 0 ? (
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
                                                                {format(history.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            {history.scheduledDate && (
                                                                <div>
                                                                    <p className="text-gray-500">Data/Hora</p>
                                                                    <p>{format(history.scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
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
                                                                    <p>{REGULATION_TYPE_LABELS[history.regulationType]}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-gray-500">Acompanhante</p>
                                                                <p>{history.hasCompanion ? "Sim" : "Não"}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500">Responsável</p>
                                                                <p>{history.scheduledBy}</p>
                                                            </div>
                                                            {history.canceledBy && (
                                                                <div>
                                                                    <p className="text-gray-500">Cancelado por</p>
                                                                    <p>{history.canceledBy}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {history.reason && (
                                                            <div className="mt-3">
                                                                <p className="text-gray-500 text-sm">Observações</p>
                                                                <p className="text-sm">{history.reason}</p>
                                                            </div>
                                                        )}

                                                        {history.cancelReason && (
                                                            <div className="mt-3">
                                                                <p className="text-gray-500 text-sm">Motivo do cancelamento</p>
                                                                <p className="text-sm text-red-600">{history.cancelReason}</p>
                                                            </div>
                                                        )}

                                                        {history.canceledAt && (
                                                            <div className="mt-3">
                                                                <p className="text-gray-500 text-sm">
                                                                    Cancelado em: {format(history.canceledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Nenhum histórico de agendamento encontrado</p>
                                            <p className="text-sm">As alterações aparecerão aqui quando forem realizadas</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
