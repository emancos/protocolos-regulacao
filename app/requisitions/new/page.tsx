"use client"

import type React from "react"
import { z } from "zod"

import { useEffect, useReducer } from "react"
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
import { HEALTH_UNITS, HEALTH_AGENTS, type HealthAgent } from "@/types/health-units"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProcedureSelector } from "@/components/procedure-selector"
import { ImageUpload } from "@/components/image-upload"
import type { ProcedureItem } from "@/types/procedures";

// Interface para o estado completo do formulário
interface FormState {
    protocol: string;
    patientName: string;
    priority: Priority;
    susCard: string;
    receivedDate: Date;
    phones: string[];
    status: Status;
    healthUnitId: string;
    healthAgentId: string;
    procedures: ProcedureItem[];
    images: ImageFile[];
    availableAgents: HealthAgent[];
    loading: boolean;
    errors: FormErrors;
    duplicateWarning: string;
}

// União de todos os tipos de ações possíveis
type FormAction =
    | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'phones' | 'procedures' | 'images'>; payload: unknown }
    | { type: 'SET_PROTOCOL'; payload: string }
    | { type: 'SET_PHONES'; payload: string[] }
    | { type: 'ADD_PHONE' }
    | { type: 'REMOVE_PHONE'; payload: number }
    | { type: 'UPDATE_PHONE'; payload: { index: number; value: string } }
    | { type: 'SET_PROCEDURES'; payload: ProcedureItem[] }
    | { type: 'SET_IMAGES'; payload: ImageFile[] }
    | { type: 'SET_AVAILABLE_AGENTS'; payload: HealthAgent[] }
    | { type: 'RESET_AGENTS' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_ERRORS'; payload: FormErrors }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'SET_DUPLICATE_WARNING'; payload: string }
    | { type: 'RESET_FORM' };

const initialState: FormState = {
    protocol: "",
    patientName: "",
    priority: Priority.P3,
    susCard: "",
    receivedDate: new Date(),
    phones: [""],
    status: Status.PENDENTE,
    healthUnitId: "",
    healthAgentId: "",
    procedures: [],
    images: [],
    availableAgents: [],
    loading: false,
    errors: {},
    duplicateWarning: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload };
        case 'SET_PROTOCOL':
            return { ...state, protocol: action.payload, loading: false };
        case 'SET_PHONES':
            return { ...state, phones: action.payload };
        case 'ADD_PHONE':
            return { ...state, phones: [...state.phones, ""] };
        case 'REMOVE_PHONE':
            const newPhones = [...state.phones];
            newPhones.splice(action.payload, 1);
            return { ...state, phones: newPhones };
        case 'UPDATE_PHONE':
            const updatedPhones = [...state.phones];
            updatedPhones[action.payload.index] = action.payload.value;
            return { ...state, phones: updatedPhones };
        case 'SET_PROCEDURES':
            return { ...state, procedures: action.payload };
        case 'SET_IMAGES':
            return { ...state, images: action.payload };
        case 'SET_AVAILABLE_AGENTS':
            return { ...state, availableAgents: action.payload };
        case 'RESET_AGENTS':
            return { ...state, availableAgents: [], healthAgentId: "" };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, errors: { ...state.errors, general: [action.payload] }, loading: false };
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'CLEAR_ERRORS':
            return { ...state, errors: {} };
        case 'SET_DUPLICATE_WARNING':
            return { ...state, duplicateWarning: action.payload };
        case 'RESET_FORM':
            return { ...initialState, protocol: state.protocol }; // Mantém o protocolo gerado
        default:
            const _exhaustiveCheck: never = action;
            throw new Error(`Ação do reducer não tratada: ${(_exhaustiveCheck as { type: string }).type}`);
    }
}

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

const requisitionSchema = z.object({
    protocol: z.string().min(1, "Protocolo é obrigatório."),
    patientName: z.string().trim().min(3, "Nome do paciente deve ter ao menos 3 caracteres."),
    susCard: z.string().regex(/^\d{3}\.\d{4}\.\d{4}\.\d{4}$/, "Formato do Cartão SUS inválido."),
    receivedDate: z.date({ required_error: "Data de recebimento é obrigatória." }),
    priority: z.nativeEnum(Priority, { required_error: "Selecione uma prioridade." }),
    status: z.nativeEnum(Status),
    healthUnitId: z.string().min(1, "Unidade de Saúde é obrigatória."),
    healthAgentId: z.string().optional(), // Será validado de forma condicional abaixo
    procedures: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).min(1, "Pelo menos um procedimento é obrigatório."),
    phones: z.array(z.string()).min(1, "Pelo menos um telefone é obrigatório.")
        .refine(phones => phones.some(phone => phone.trim() !== ""), {
            message: "Pelo menos um telefone deve ser preenchido.",
            // Aplicamos o erro no primeiro telefone para exibição
            path: ["phones", 0],
        }),

    // Campos que não são do formulário, mas necessários para validação condicional
    availableAgents: z.array(z.any()),
    duplicateWarning: z.string().max(0, "Existem procedimentos duplicados. Verifique o aviso acima."),
    images: z.array(z.object({
        // Definimos a forma mínima de um ImageFile para o Zod entender
        id: z.string(),
        file: z.instanceof(File).optional(),
        uploaded: z.boolean().optional(),
        uploading: z.boolean().optional(),
        error: z.string().optional(),
    }))
        .min(1, "É necessário anexar pelo menos uma imagem.")
        .refine(images => {
            // A validação falha se QUALQUER imagem estiver nestes estados:
            const isAnyUploading = images.some(img => img.uploading);
            const isAnyPending = images.some(img => img.file && !img.uploaded && !img.error);
            const isAnyWithError = images.some(img => img.error);

            // A validação PASSA se nenhuma imagem estiver pendente, enviando ou com erro.
            return !isAnyUploading && !isAnyPending && !isAnyWithError;
        }, {
            // Esta é a mensagem de erro que será exibida.
            message: "Aguarde a conclusão de todos os uploads ou remova as imagens com erro."
        }),
})
    .superRefine((data, ctx) => {
        // Validação condicional para o Agente de Saúde
        if (data.availableAgents.length > 0 && !data.healthAgentId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Agente de Saúde é obrigatório.",
                path: ["healthAgentId"],
            });
        }
    });

// Extrai o tipo dos erros de campo do Zod para usar no nosso estado
type FormErrors = z.inferFlattenedErrors<typeof requisitionSchema>['fieldErrors'] & {
    general?: string[];
};

const FieldError = ({ messages }: { messages?: string[] }) => {
    if (!messages || messages.length === 0) {
        return null;
    }
    return <p className="text-sm font-medium text-destructive mt-1">{messages[0]}</p>;
};

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

    const [state, dispatch] = useReducer(formReducer, initialState);

    const {
        protocol, patientName, priority, susCard, receivedDate, phones, status,
        healthUnitId, healthAgentId, procedures, images, availableAgents,
        loading, duplicateWarning
    } = state;

    // Gerar protocolo ao carregar a página
    useEffect(() => {
        const generateInitialProtocol = async () => {
            try {
                const newProtocol = await RequisitionService.generateUniqueProtocol()
                dispatch({ type: 'SET_PROTOCOL', payload: newProtocol });
                console.log(`📋 Generated initial protocol: ${newProtocol}`)
            } catch (error) {
                console.error("Erro ao gerar protocolo inicial:", error)
                dispatch({ type: 'SET_ERROR', payload: "Erro ao gerar protocolo automático" });
            }
        }
        generateInitialProtocol();
    }, []);

    // Gerenciar agentes de saúde quando a unidade de saúde muda
    useEffect(() => {
        if (healthUnitId) {
            const unit = HEALTH_UNITS.find((u) => u.id === healthUnitId)
            const agents = HEALTH_AGENTS.filter((a) => a.healthUnitId === healthUnitId)
            dispatch({ type: 'SET_AVAILABLE_AGENTS', payload: agents });
            console.log(`Found ${agents.length} agents for unit ${unit?.name}`)

            if (agents.length === 0) {
                dispatch({ type: 'SET_FIELD', field: 'healthAgentId', payload: "" });
            }
        } else {
            dispatch({ type: 'RESET_AGENTS' });
        }
    }, [healthUnitId]);

    // Verificar procedimentos duplicados
    useEffect(() => {
        const checkDuplicates = async () => {
            if (susCard && procedures.length > 0) {
                try {
                    const result = await RequisitionService.checkDuplicateProcedures(susCard, procedures)
                    if (result.hasDuplicate) {
                        const duplicateList = result.map((d: { procedure: string; protocol: string; status: string }) => `• ${d.procedure} (Protocolo: ${d.protocol}, Status: ${d.status})`).join("\n");
                        const warningMessage = `⚠️ ATENÇÃO: Este cartão SUS já possui solicitações pendentes para os seguintes procedimentos:\n\n${duplicateList}\n\nO paciente deve aguardar o agendamento das solicitações anteriores.`;
                        dispatch({ type: 'SET_DUPLICATE_WARNING', payload: warningMessage });
                    } else {
                        dispatch({ type: 'SET_DUPLICATE_WARNING', payload: "" });
                    }
                } catch (error) {
                    console.error("Erro ao verificar duplicatas:", error)
                }
            } else {
                dispatch({ type: 'SET_DUPLICATE_WARNING', payload: "" });
            }
        }

        const timeoutId = setTimeout(checkDuplicates, 500) // Debounce
        return () => clearTimeout(timeoutId)
    }, [susCard, procedures]);

    const addPhoneField = () => dispatch({ type: 'ADD_PHONE' });
    const removePhoneField = (index: number) => dispatch({ type: 'REMOVE_PHONE', payload: index });
    const updatePhone = (index: number, value: string) => dispatch({ type: 'UPDATE_PHONE', payload: { index, value } });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch({ type: 'CLEAR_ERRORS' });

        const result = requisitionSchema.safeParse(state);

        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            dispatch({
                type: 'SET_ERRORS',
                payload: fieldErrors,
            });
            console.warn("Falha na validação:", fieldErrors);
            return;
        }

        const validatedData = result.data;

        // Filtrar telefones vazios
        const filteredPhones = validatedData.phones.filter((phone) => phone.trim() !== "");

        try {
            dispatch({ type: 'SET_LOADING', payload: true });

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
                patientName: validatedData.patientName,
                procedures,
                priority,
                susCard: validatedData.susCard,
                receivedDate,
                phones: filteredPhones,
                status,
                healthUnitId,
                healthAgentId: validatedData.healthAgentId || undefined,
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
            dispatch({ type: 'SET_ERROR', payload: "Erro ao criar requisição. Tente novamente." });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
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
                        <form onSubmit={handleSubmit} noValidate>
                            <CardContent className="space-y-6 mb-6">
                                {state.errors.general && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{state.errors.general[0]}</AlertDescription>
                                    </Alert>
                                )}

                                {state.errors.duplicateWarning && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{state.errors.duplicateWarning[0]}</AlertDescription>
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
                                                    onSelect={(date) => dispatch({ type: 'SET_FIELD', field: 'receivedDate', payload: date })}
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
                                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'patientName', payload: e.target.value })}
                                            placeholder="Nome completo do paciente"
                                            required
                                        />
                                        <FieldError messages={state.errors.patientName} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="susCard">Cartão SUS *</Label>
                                        <InputMask
                                            id="susCard"
                                            mask="999.9999.9999.9999"
                                            value={susCard}
                                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'susCard', payload: e.target.value })}
                                            placeholder="000.0000.0000.0000"
                                            required
                                        />
                                        <FieldError messages={state.errors.susCard} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Prioridade *</Label>
                                        <Select value={priority} onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'priority', payload: value as Priority })}>
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
                                        <FieldError messages={state.errors.priority} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status PENDENTE*</Label>
                                    </div>

                                    {/* Unidade de Saúde e PSF */}
                                    <div className="space-y-4 md:col-span-2">
                                        <h3 className="text-lg font-medium">Unidade de Saúde</h3>
                                        <Separator />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="healthUnit">Unidade de Saúde *</Label>
                                        <Select value={healthUnitId} onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'healthUnitId', payload: value })}>
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
                                        <FieldError messages={state.errors.healthUnitId} />
                                    </div>

                                    {/* Mostrar Agente de Saúde diretamente dependente da Unidade de Saúde */}
                                    {healthUnitId && availableAgents.length > 0 && (
                                        <div className="space-y-2">
                                            <Label htmlFor="healthAgent">Agente de Saúde *</Label>
                                            <Select value={healthAgentId} onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'healthAgentId', payload: value })}>
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
                                            <FieldError messages={state.errors.healthAgentId} />
                                        </div>
                                    )}

                                    {/* Procedimentos */}
                                    <div className="space-y-4 md:col-span-2">
                                        <ProcedureSelector
                                            procedures={procedures}
                                            onChange={(newProcedures) => dispatch({ type: 'SET_PROCEDURES', payload: newProcedures })}
                                            error={state.errors.procedures}
                                        />
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
                                                    <FieldError messages={state.errors.phones} />
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
                                            onChange={(newImages) => dispatch({ type: 'SET_IMAGES', payload: newImages })}
                                            protocol={protocol}
                                            maxImages={10}
                                            maxSizePerImage={10}
                                            submissionError={state.errors.images}
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
