"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { InputMask } from "@/components/ui/input-mask"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Plus, Trash2, ArrowLeft, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { RequisitionService } from "@/lib/requisition-service"
import { Priority, Status, PRIORITY_LABELS } from "@/types/requisitions"
import { HEALTH_UNITS, HEALTH_AGENTS, type HealthUnit, type HealthAgent } from "@/types/health-units"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProcedureSelector } from "@/components/procedure-selector"
import { ImageUpload } from "@/components/image-upload"
import type { ProcedureItem } from "@/types/procedures"

interface ImageFile {
    id: string
    file?: File
    preview?: string
    name: string
    size: number
    url?: string
    uploaded?: boolean
    uploading?: boolean
    error?: string
    oneDriveId?: string
}

export default function NewRequisitionPage() {
    return (
        <AuthGuard>
            <NewRequisitionForm />
        </AuthGuard>
    )
}

function NewRequisitionForm() {
    const { user } = useAuth()
    const router = useRouter()

    const [protocol, setProtocol] = useState("")
    const [patientName, setPatientName] = useState("")
    const [priority, setPriority] = useState<Priority>(Priority.P3)
    const [susCard, setSusCard] = useState("")
    const [receivedDate, setReceivedDate] = useState<Date>(new Date())
    const [phones, setPhones] = useState<string[]>([""])
    const [status, setStatus] = useState<Status>(Status.PENDENTE)
    const [healthUnitId, setHealthUnitId] = useState("")
    const [healthAgentId, setHealthAgentId] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [duplicateWarning, setDuplicateWarning] = useState<string>("")
    const [procedures, setProcedures] = useState<ProcedureItem[]>([])
    const [images, setImages] = useState<ImageFile[]>([])

    // Estados derivados
    const [availableAgents, setAvailableAgents] = useState<HealthAgent[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedHealthUnit, setSelectedHealthUnit] = useState<HealthUnit | null>(null)

    // Gerar protocolo ao carregar a página
    useEffect(() => {
        const generateInitialProtocol = async () => {
            try {
                const newProtocol = await RequisitionService.generateProtocol()
                setProtocol(newProtocol)
                console.log(`📋 Generated initial protocol: ${newProtocol}`)
            } catch (error) {
                console.error("Erro ao gerar protocolo inicial:", error)
                setError("Erro ao gerar protocolo automático")
            }
        }

        generateInitialProtocol()
    }, [])

    // Substituir o useEffect que gerenciava PSFs:
    useEffect(() => {
        if (healthUnitId) {
            const unit = HEALTH_UNITS.find((u) => u.id === healthUnitId)
            setSelectedHealthUnit(unit || null)

            // Carregar agentes diretamente da unidade de saúde
            const agents = HEALTH_AGENTS.filter((a) => a.healthUnitId === healthUnitId)
            setAvailableAgents(agents)
            console.log(`Found ${agents.length} agents for unit ${unit?.name}`)

            // Se não houver agentes, limpar o campo de agente selecionado
            if (agents.length === 0) {
                setHealthAgentId("")
            }
        } else {
            setSelectedHealthUnit(null)
            setAvailableAgents([])
            setHealthAgentId("")
        }
    }, [healthUnitId])

    // Verificar procedimentos duplicados quando cartão SUS ou procedimentos mudam
    useEffect(() => {
        const checkDuplicates = async () => {
            if (susCard && procedures.length > 0) {
                try {
                    const result = await RequisitionService.checkDuplicateProcedures(susCard, procedures)
                    if (result.hasDuplicate) {
                        const duplicateList = result.map((d: { procedure: string; protocol: string; status: string }) => `• ${d.procedure} (Protocolo: ${d.protocol}, Status: ${d.status})`)
                            .join("\n")
                        setDuplicateWarning(
                            `⚠️ ATENÇÃO: Este cartão SUS já possui solicitações pendentes para os seguintes procedimentos:\n\n${duplicateList}\n\nO paciente deve aguardar o agendamento das solicitações anteriores.`,
                        )
                    } else {
                        setDuplicateWarning("")
                    }
                } catch (error) {
                    console.error("Erro ao verificar duplicatas:", error)
                }
            } else {
                setDuplicateWarning("")
            }
        }

        const timeoutId = setTimeout(checkDuplicates, 500) // Debounce
        return () => clearTimeout(timeoutId)
    }, [susCard, procedures])

    const addPhoneField = () => {
        setPhones([...phones, ""])
    }

    const removePhoneField = (index: number) => {
        const newPhones = [...phones]
        newPhones.splice(index, 1)
        setPhones(newPhones)
    }

    const updatePhone = (index: number, value: string) => {
        const newPhones = [...phones]
        newPhones[index] = value
        setPhones(newPhones)
    }

    // Simplificar a validação:
    const validateForm = (): string | null => {
        if (!protocol) return "Protocolo é obrigatório"
        if (!patientName.trim()) return "Nome do paciente é obrigatório"
        if (!susCard.trim()) return "Cartão SUS é obrigatório"
        if (!healthUnitId) return "Unidade de Saúde é obrigatória"

        // Agente é obrigatório se houver agentes disponíveis
        if (availableAgents.length > 0 && !healthAgentId) {
            return "Agente de Saúde é obrigatório"
        }

        if (procedures.length === 0) return "Pelo menos um procedimento é obrigatório"

        // Filtrar telefones vazios
        const validPhones = phones.filter((phone) => phone.trim() !== "")
        if (validPhones.length === 0) return "Pelo menos um telefone é obrigatório"

        // Verificar se há duplicatas
        if (duplicateWarning) {
            return "Existem procedimentos duplicados para este cartão SUS. Verifique o aviso acima."
        }

        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        console.log("🚀 Starting form submission...")

        // Validar formulário
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        // Verificar se há imagens não enviadas
        const pendingImages = images.filter((img) => !img.uploaded && !img.error && img.file)
        const uploadingImages = images.filter((img) => img.uploading)

        console.log(`📊 Image check - Pending: ${pendingImages.length}, Uploading: ${uploadingImages.length}`)

        if (pendingImages.length > 0 || uploadingImages.length > 0) {
            setError(
                `Aguarde o upload de todas as imagens ser concluído. ${pendingImages.length} pendente(s), ${uploadingImages.length} enviando...`,
            )
            return
        }

        // Filtrar telefones vazios
        const filteredPhones = phones.filter((phone) => phone.trim() !== "")

        try {
            setLoading(true)

            // Preparar dados das imagens (apenas as que foram enviadas com sucesso)
            const imageData = images
                .filter((img) => img.uploaded && img.url)
                .map((img) => ({
                    id: img.id,
                    name: img.name,
                    size: img.size,
                    url: img.url!,
                    uploadedAt: new Date(),
                    oneDriveId: img.oneDriveId || img.id, // Usar o ID do OneDrive
                }))

            console.log(`💾 Saving requisition with ${imageData.length} uploaded images`)

            // Criar a requisição com as URLs das imagens já carregadas no OneDrive
            await RequisitionService.createRequisition({
                protocol,
                patientName: patientName.trim(),
                procedures,
                priority,
                susCard: susCard.trim(),
                receivedDate,
                phones: filteredPhones,
                status,
                healthUnitId,
                healthAgentId: healthAgentId || undefined,
                images: imageData.length > 0 ? imageData : undefined,
                createdBy: user?.uid || "",
            })

            // Limpar previews das imagens
            images.forEach((img) => {
                if (img.preview) {
                    URL.revokeObjectURL(img.preview)
                }
            })

            console.log("✅ Requisition saved successfully")
            router.push("/requisitions")
        } catch (error) {
            console.error("Erro ao criar requisição:", error)
            setError("Erro ao criar requisição. Tente novamente.")
        } finally {
            setLoading(false)
        }
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
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Requisição</h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Cadastrar Nova Requisição</CardTitle>
                            <CardDescription>
                                Preencha todos os dados obrigatórios para cadastrar uma nova requisição de procedimento
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

                                {duplicateWarning && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription className="whitespace-pre-line">{duplicateWarning}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Dados da Requisição */}
                                    <div className="space-y-4 md:col-span-2">
                                        <h3 className="text-lg font-medium">Dados da Requisição</h3>
                                        <Separator />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="protocol">Protocolo *</Label>
                                        <Input
                                            id="protocol"
                                            value={protocol}
                                            placeholder="Protocolo será gerado automaticamente"
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-800"
                                        />
                                        {protocol && <p className="text-xs text-green-600">✅ Protocolo gerado: {protocol}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="receivedDate">Data de Recebimento *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !receivedDate && "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {receivedDate ? format(receivedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={receivedDate}
                                                    onSelect={(date) => date && setReceivedDate(date)}
                                                    initialFocus
                                                    locale={ptBR}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="patientName">Nome do Paciente *</Label>
                                        <Input
                                            id="patientName"
                                            value={patientName}
                                            onChange={(e) => setPatientName(e.target.value)}
                                            placeholder="Nome completo do paciente"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="susCard">Cartão SUS *</Label>
                                        <InputMask
                                            id="susCard"
                                            mask="999.9999.9999.9999"
                                            value={susCard}
                                            onChange={(e) => setSusCard(e.target.value)}
                                            placeholder="000.0000.0000.0000"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Prioridade *</Label>
                                        <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a prioridade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(Priority).map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {PRIORITY_LABELS[p]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select value={status} onValueChange={(value) => setStatus(value as Status)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={Status.PENDENTE}>Pendente</SelectItem>
                                                <SelectItem value={Status.SIS_PENDENTE}>SIS Pendente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Unidade de Saúde e PSF */}
                                    <div className="space-y-4 md:col-span-2">
                                        <h3 className="text-lg font-medium">Unidade de Saúde</h3>
                                        <Separator />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="healthUnit">Unidade de Saúde *</Label>
                                        <Select value={healthUnitId} onValueChange={setHealthUnitId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a unidade de saúde" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {HEALTH_UNITS.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id}>
                                                        {unit.name} ({unit.type})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Mostrar Agente de Saúde diretamente dependente da Unidade de Saúde */}
                                    {healthUnitId && availableAgents.length > 0 && (
                                        <div className="space-y-2">
                                            <Label htmlFor="healthAgent">Agente de Saúde *</Label>
                                            <Select value={healthAgentId} onValueChange={setHealthAgentId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o agente de saúde" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableAgents.map((agent) => (
                                                        <SelectItem key={agent.id} value={agent.id}>
                                                            {agent.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Procedimentos */}
                                    <div className="space-y-4 md:col-span-2">
                                        <ProcedureSelector procedures={procedures} onChange={setProcedures} />
                                    </div>

                                    {/* Telefones */}
                                    <div className="space-y-4 md:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium">Telefones de Contato</h3>
                                            <Button type="button" onClick={addPhoneField} variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Telefone
                                            </Button>
                                        </div>
                                        <Separator />
                                    </div>

                                    <div className="space-y-4 md:col-span-2">
                                        {phones.map((phone, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <div className="flex-grow">
                                                    <Label htmlFor={`phone-${index}`} className={index === 0 ? "" : "sr-only"}>
                                                        {index === 0 ? "Telefone *" : "Telefone adicional"}
                                                    </Label>
                                                    <InputMask
                                                        id={`phone-${index}`}
                                                        mask="(99) 99999-9999"
                                                        value={phone}
                                                        onChange={(e) => updatePhone(index, e.target.value)}
                                                        placeholder="(00) 00000-0000"
                                                        required={index === 0}
                                                    />
                                                </div>
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => removePhoneField(index)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="mt-6"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Upload de Imagens */}
                                    <div className="space-y-4 md:col-span-2">
                                        <ImageUpload
                                            images={images}
                                            onChange={setImages}
                                            protocol={protocol}
                                            maxImages={10}
                                            maxSizePerImage={10}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" asChild>
                                    <Link href="/requisitions">Cancelar</Link>
                                </Button>
                                <Button type="submit" disabled={loading || !!duplicateWarning}>
                                    {loading ? "Salvando..." : "Salvar Requisição"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    )
}
