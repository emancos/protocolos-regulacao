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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { RequisitionService } from "@/lib/requisition-service"
import { type Requisition, RegulationType, REGULATION_TYPE_LABELS } from "@/types/requisitions"
import { UserRole } from "@/types/user"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ScheduleRequisitionPage() {
    return (
        <AuthGuard>
            <RoleGuard allowedRoles={[UserRole.ADMINISTRADOR, UserRole.SOLICITANTE_REGULADO]}>
                <ScheduleRequisitionForm />
            </RoleGuard>
        </AuthGuard>
    )
}

function ScheduleRequisitionForm() {
    const { user } = useAuth()
    const router = useRouter()
    const params = useParams()
    const requisitionId = params.id as string

    const [requisition, setRequisition] = useState<Requisition | null>(null)
    const [scheduledDate, setScheduledDate] = useState<Date>(new Date())
    const [scheduledTime, setScheduledTime] = useState("08:00")
    const [scheduledLocation, setScheduledLocation] = useState("")
    const [regulationType, setRegulationType] = useState<RegulationType>(RegulationType.JOAO_PESSOA)
    const [hasCompanion, setHasCompanion] = useState(false)
    const [reason, setReason] = useState("")

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

        if (!scheduledLocation) {
            setError("Local de agendamento é obrigatório")
            return
        }

        try {
            setLoading(true)

            // Combinar data e hora
            const [hours, minutes] = scheduledTime.split(":").map(Number)
            const fullScheduledDate = new Date(scheduledDate)
            fullScheduledDate.setHours(hours, minutes)

            await RequisitionService.scheduleRequisition(requisitionId, {
                scheduledDate: fullScheduledDate,
                scheduledLocation,
                regulationType,
                hasCompanion,
                scheduledBy: user?.uid || "",
                reason: reason || "Agendamento inicial",
            })

            router.push("/requisitions")
        } catch (error) {
            console.error("Erro ao agendar requisição:", error)
            setError("Erro ao agendar requisição. Tente novamente.")
        } finally {
            setLoading(false)
        }
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
                                <Link href="/requisitions">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Voltar
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendar Requisição</h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Card className="w-full max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Agendar Procedimento</CardTitle>
                            <CardDescription>
                                Agendamento para {requisition.patientName} - {requisition.procedures.length} procedimento(s)
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Informações da Requisição */}
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Protocolo</p>
                                                    <p>{requisition.protocol}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Paciente</p>
                                                    <p>{requisition.patientName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Procedimentos</p>
                                                    <div className="space-y-1">
                                                        {requisition.procedures.map((proc, index) => (
                                                            <p key={index} className="text-sm">
                                                                {proc.name} {proc.quantity > 1 && `(${proc.quantity}x)`}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Cartão SUS</p>
                                                    <p>{requisition.susCard}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                                                    <p>{requisition.phones[0]}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Data de Recebimento</p>
                                                    <p>{format(requisition.receivedDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dados do Agendamento */}
                                    <div className="space-y-2">
                                        <Label htmlFor="scheduledDate">Data do Agendamento *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !scheduledDate && "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {scheduledDate ? format(scheduledDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={scheduledDate}
                                                    onSelect={(date) => date && setScheduledDate(date)}
                                                    initialFocus
                                                    locale={ptBR}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="scheduledTime">Horário do Agendamento *</Label>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                            <Input
                                                id="scheduledTime"
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="scheduledLocation">Local do Agendamento *</Label>
                                        <Input
                                            id="scheduledLocation"
                                            value={scheduledLocation}
                                            onChange={(e) => setScheduledLocation(e.target.value)}
                                            placeholder="Nome da clínica ou hospital"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="regulationType">Tipo de Regulação *</Label>
                                        <Select
                                            value={regulationType}
                                            onValueChange={(value) => setRegulationType(value as RegulationType)}
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
                                                id="hasCompanion"
                                                checked={hasCompanion}
                                                onCheckedChange={(checked: boolean) => setHasCompanion(checked as boolean)}
                                            />
                                            <Label htmlFor="hasCompanion">Tem direito a acompanhante</Label>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Marque se o paciente tem direito a levar um acompanhante na consulta/exame
                                        </p>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="reason">Observações</Label>
                                        <Textarea
                                            id="reason"
                                            value={reason}
                                            onChange={(e: { target: { value: React.SetStateAction<string> } }) => setReason(e.target.value)}
                                            placeholder="Observações sobre o agendamento (opcional)"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" asChild>
                                    <Link href="/requisitions">Cancelar</Link>
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Agendando..." : "Confirmar Agendamento"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    )
}
