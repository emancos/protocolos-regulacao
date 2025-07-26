"use client"

import type React from "react"
import { z } from "zod/v4"
import { useEffect, useReducer, useState } from "react"
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
import type { ProcedureItem } from "@/types/procedures"

// --- ZOD SCHEMAS ---

// Define the schema for a single image file for type safety in refine
const imageFileSchema = z.object({
    id: z.string(),
    file: z.instanceof(File).optional(),
    preview: z.string().optional(),
    name: z.string(),
    size: z.number(),
    url: z.string().optional(),
    uploaded: z.boolean().optional(),
    uploading: z.boolean().optional(),
    error: z.string().optional(),
    oneDriveId: z.string().optional(),
});

// Define the base object schema first to infer its type
const requisitionObjectSchema = z.object({
    protocol: z.string().min(1, "Protocolo é obrigatório."),
    patientName: z.string().trim().min(3, "Nome do paciente deve ter ao menos 3 caracteres."),
    susCard: z.string().regex(/^\d{3}\ \d{4}\ \d{4}\ \d{4}$/, "Formato do Cartão SUS inválido."),
    receivedDate: z.date({ error: "Data de recebimento é obrigatória." }),
    priority: z.nativeEnum(Priority, { error: "Selecione uma prioridade." }),
    status: z.nativeEnum(Status),
    healthUnitId: z.string().min(1, "Unidade de Saúde é obrigatória."),
    healthAgentId: z.string().optional(),
    procedures: z.array(z.object({ id: z.string(), name: z.string(), quantity: z.number() })).min(1, "Pelo menos um procedimento é obrigatório."),
    phones: z.array(z.string()).min(1, "Pelo menos um telefone é obrigatório.").refine(phones => phones.some(phone => phone.trim() !== ""), {
        message: "Pelo menos um telefone deve ser preenchido.",
        path: ["phones", 0],
    }),
    images: z.array(imageFileSchema).min(1, "É necessário anexar pelo menos uma imagem.").refine((images: z.infer<typeof imageFileSchema>[]) => !images.some(img => img.uploading || (img.file && !img.uploaded) || img.error), {
        message: "Aguarde a conclusão de todos os uploads ou remova as imagens com erro."
    }),
    // Campos auxiliares para validação
    availableAgents: z.array(z.any()),
});

// Infer the type from the base schema
type RequisitionObjectType = z.infer<typeof requisitionObjectSchema>;

// Apply the refinement with explicit types to create the final schema
const requisitionSchema = requisitionObjectSchema.superRefine((data: RequisitionObjectType, ctx: z.RefinementCtx) => {
    if (data.availableAgents.length > 0 && !data.healthAgentId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Agente de Saúde é obrigatório.", path: ["healthAgentId"] });
    }
});


// Schemas parciais para validação de cada etapa
const step1Schema = requisitionSchema.pick({ patientName: true, susCard: true, phones: true, healthUnitId: true, healthAgentId: true, availableAgents: true, receivedDate: true, priority: true });
const step2Schema = requisitionSchema.pick({ procedures: true });
const step3Schema = requisitionSchema.pick({ images: true });

type FormErrors = z.inferFlattenedErrors<typeof requisitionSchema>['fieldErrors'] & { general?: string[] };

// --- STATE MANAGEMENT (Reducer) ---
interface ImageFile { id: string; file?: File; preview?: string; name: string; size: number; url?: string; uploaded?: boolean; uploading?: boolean; error?: string; oneDriveId?: string; }
interface FormState { protocol: string; patientName: string; priority: Priority; susCard: string; receivedDate: Date; phones: string[]; status: Status; healthUnitId: string; healthAgentId: string; procedures: ProcedureItem[]; images: ImageFile[]; availableAgents: HealthAgent[]; loading: boolean; errors: FormErrors; }
type FormAction = | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'phones' | 'procedures' | 'images'>; payload: unknown } | { type: 'SET_PROTOCOL'; payload: string } | { type: 'ADD_PHONE' } | { type: 'REMOVE_PHONE'; payload: number } | { type: 'UPDATE_PHONE'; payload: { index: number; value: string } } | { type: 'SET_PROCEDURES'; payload: ProcedureItem[] } | { type: 'SET_IMAGES'; payload: ImageFile[] } | { type: 'SET_AVAILABLE_AGENTS'; payload: HealthAgent[] } | { type: 'RESET_AGENTS' } | { type: 'SET_LOADING'; payload: boolean } | { type: 'SET_ERRORS'; payload: FormErrors } | { type: 'CLEAR_ERRORS' };

const initialState: FormState = { protocol: "", patientName: "", priority: Priority.P3, susCard: "", receivedDate: new Date(), phones: [""], status: Status.PENDENTE, healthUnitId: "", healthAgentId: "", procedures: [], images: [], availableAgents: [], loading: false, errors: {} };

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SET_FIELD': return { ...state, [action.field]: action.payload };
        case 'SET_PROTOCOL': return { ...state, protocol: action.payload };
        case 'ADD_PHONE': return { ...state, phones: [...state.phones, ""] };
        case 'REMOVE_PHONE': return { ...state, phones: state.phones.filter((_, i) => i !== action.payload) };
        case 'UPDATE_PHONE': const updatedPhones = [...state.phones]; updatedPhones[action.payload.index] = action.payload.value; return { ...state, phones: updatedPhones };
        case 'SET_PROCEDURES': return { ...state, procedures: action.payload };
        case 'SET_IMAGES': return { ...state, images: action.payload };
        case 'SET_AVAILABLE_AGENTS': return { ...state, availableAgents: action.payload };
        case 'RESET_AGENTS': return { ...state, availableAgents: [], healthAgentId: "" };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_ERRORS': return { ...state, errors: action.payload, loading: false };
        case 'CLEAR_ERRORS': return { ...state, errors: {} };
        default: return state;
    }
}

// --- COMPONENTES DAS ETAPAS ---

const FieldError = ({ messages }: { messages?: string[] }) => {
    if (!messages || messages.length === 0) return null;
    return <p className="text-sm font-medium text-destructive mt-1">{messages[0]}</p>;
};

const Step1 = ({ state, dispatch, errors }: { state: FormState, dispatch: React.Dispatch<FormAction>, errors: FormErrors }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50">
        <div className="space-y-4 md:col-span-2"><h3 className="text-lg font-medium">Dados da Requisição</h3><Separator /></div>
        <div className="space-y-2"><Label htmlFor="protocol">Protocolo *</Label><Input id="protocol" value={state.protocol} disabled className="bg-gray-100 dark:bg-gray-800" /></div>
        <div className="space-y-2"><Label htmlFor="receivedDate">Data de Recebimento *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !state.receivedDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{state.receivedDate ? format(state.receivedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={state.receivedDate} onSelect={(date) => dispatch({ type: 'SET_FIELD', field: 'receivedDate', payload: date })} initialFocus locale={ptBR} /></PopoverContent></Popover><FieldError messages={errors.receivedDate} /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="priority">Prioridade *</Label><Select value={state.priority} onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'priority', payload: value as Priority })}><SelectTrigger><SelectValue placeholder="Selecione a prioridade" /></SelectTrigger><SelectContent>{Object.values(Priority).map((p) => (<SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>))}</SelectContent></Select><FieldError messages={errors.priority} /></div>

        <div className="space-y-4 md:col-span-2 mt-4"><h3 className="text-lg font-medium">Dados do Paciente</h3><Separator /></div>
        <div className="space-y-2"><Label htmlFor="patientName">Nome do Paciente *</Label><Input id="patientName" value={state.patientName} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'patientName', payload: e.target.value })} required /><FieldError messages={errors.patientName} /></div>
        <div className="space-y-2"><Label htmlFor="susCard">Cartão SUS *</Label><InputMask id="susCard" mask="999 9999 9999 9999" value={state.susCard} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'susCard', payload: e.target.value })} required /><FieldError messages={errors.susCard} /></div>

        <div className="space-y-4 md:col-span-2 mt-4"><div className="flex items-center justify-between"><h3 className="text-lg font-medium">Telefones de Contato</h3><Button type="button" onClick={() => dispatch({ type: 'ADD_PHONE' })} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar</Button></div><Separator /></div>
        <div className="space-y-4 md:col-span-2">{state.phones.map((phone, index) => (<div key={index} className="flex items-center space-x-2"><div className="flex-grow"><Label htmlFor={`phone-${index}`} className="sr-only">Telefone</Label><InputMask id={`phone-${index}`} mask="(99) 99999-9999" value={phone} onChange={(e) => dispatch({ type: 'UPDATE_PHONE', payload: { index, value: e.target.value } })} required={index === 0} />{index === 0 && <FieldError messages={errors.phones} />}</div>{index > 0 && (<Button type="button" onClick={() => dispatch({ type: 'REMOVE_PHONE', payload: index })} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>)}</div>))}{state.phones.length === 0 && <FieldError messages={errors.phones} />}</div>

        <div className="space-y-4 md:col-span-2 mt-4"><h3 className="text-lg font-medium">Unidade de Saúde</h3><Separator /></div>
        <div className="space-y-2"><Label htmlFor="healthUnit">Unidade de Saú­de *</Label><Select value={state.healthUnitId} onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'healthUnitId', payload: value })}><SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger><SelectContent>{HEALTH_UNITS.map((unit) => (<SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.type})</SelectItem>))}</SelectContent></Select><FieldError messages={errors.healthUnitId} /></div>
        {state.availableAgents.length > 0 && (<div className="space-y-2"><Label htmlFor="healthAgent">Agente de Saúde *</Label><Select value={state.healthAgentId} onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'healthAgentId', payload: value })}><SelectTrigger><SelectValue placeholder="Selecione o agente" /></SelectTrigger><SelectContent>{state.availableAgents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}</SelectContent></Select><FieldError messages={errors.healthAgentId} /></div>)}
    </div>
);

const Step2 = ({ state, dispatch, errors }: { state: FormState, dispatch: React.Dispatch<FormAction>, errors: FormErrors }) => (
    <div className="animate-in fade-in-50"><ProcedureSelector procedures={state.procedures} onChange={(newProcedures) => dispatch({ type: 'SET_PROCEDURES', payload: newProcedures })} error={errors.procedures} /></div>
);

const Step3 = ({ state, dispatch, errors }: { state: FormState, dispatch: React.Dispatch<FormAction>, errors: FormErrors }) => (
    <div className="animate-in fade-in-50"><ImageUpload images={state.images} onChange={(newImages) => dispatch({ type: 'SET_IMAGES', payload: newImages })} protocol={state.protocol} submissionError={errors.images} /></div>
);


// --- COMPONENTE PRINCIPAL ---

export default function NewRequisitionPage() {
    return (<AuthGuard><NewRequisitionForm /></AuthGuard>)
}

function NewRequisitionForm() {
    const { user } = useAuth()
    const router = useRouter()
    const [state, dispatch] = useReducer(formReducer, initialState)
    const [step, setStep] = useState(1)

    useEffect(() => {
        const generateInitialProtocol = async () => {
            try {
                const newProtocol = await RequisitionService.generateUniqueProtocol();
                dispatch({ type: 'SET_PROTOCOL', payload: newProtocol });
            } catch (error) {
                console.error("Erro ao gerar protocolo:", error);
                dispatch({ type: 'SET_ERRORS', payload: { general: ["Erro ao gerar protocolo automático"] } });
            }
        };
        generateInitialProtocol();
    }, []);

    useEffect(() => {
        if (state.healthUnitId) {
            const agents = HEALTH_AGENTS.filter((a) => a.healthUnitId === state.healthUnitId);
            dispatch({ type: 'SET_AVAILABLE_AGENTS', payload: agents });
        } else {
            dispatch({ type: 'RESET_AGENTS' });
        }
    }, [state.healthUnitId]);

    const handleStepValidation = (schema: z.ZodSchema) => {
        const result = schema.safeParse(state);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            dispatch({ type: 'SET_ERRORS', payload: fieldErrors });
            return false;
        }
        dispatch({ type: 'CLEAR_ERRORS' });
        return true;
    }

    const nextStep = () => {
        let isValid = false;
        if (step === 1) isValid = handleStepValidation(step1Schema);
        if (step === 2) isValid = handleStepValidation(step2Schema);
        if (isValid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!handleStepValidation(step3Schema)) return; // Valida a última etapa antes de submeter

        const result = requisitionSchema.safeParse(state);
        if (!result.success) {
            dispatch({ type: 'SET_ERRORS', payload: result.error.flatten().fieldErrors });
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { phones, images, ...rest } = result.data;
            const filteredPhones = phones.filter((phone) => phone.trim() !== "");
            const imageData = images.filter(img => img.uploaded && img.url).map(img => ({ id: img.id, name: img.name, size: img.size, url: img.url!, uploadedAt: new Date(), oneDriveId: img.oneDriveId }));

            await RequisitionService.createRequisition({
                ...rest,
                phones: filteredPhones,
                images: imageData.length > 0 ? imageData : undefined,
                createdBy: user?.uid || "",
            });
            router.push("/requisitions");
        } catch (error) {
            console.error("Erro ao criar requisição:", error);
            dispatch({ type: 'SET_ERRORS', payload: { general: ["Erro ao salvar a requisição. Tente novamente."] } });
        }
    };

    const stepTitles = ["Dados do Paciente e Requisição", "Seleção de Procedimentos", "Anexos e Documentos"];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center py-6"><div className="flex items-center space-x-4"><Button asChild variant="outline" size="sm"><Link href="/requisitions"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Requisição</h1></div><ThemeToggle /></div></div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Cadastrar Nova Requisição</CardTitle>
                            <CardDescription>Etapa {step} de 3 - {stepTitles[step - 1]}</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit} noValidate>
                            <CardContent className="space-y-6 mb-6 min-h-[400px]">
                                {state.errors.general && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{state.errors.general[0]}</AlertDescription></Alert>}
                                {step === 1 && <Step1 state={state} dispatch={dispatch} errors={state.errors} />}
                                {step === 2 && <Step2 state={state} dispatch={dispatch} errors={state.errors} />}
                                {step === 3 && <Step3 state={state} dispatch={dispatch} errors={state.errors} />}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6">
                                <div>{step > 1 && (<Button type="button" variant="outline" onClick={prevStep}>Voltar</Button>)}</div>
                                <div>{step < 3 ? (<Button type="button" onClick={nextStep}>Próximo</Button>) : (<Button type="submit" disabled={state.loading}>{state.loading ? "Salvando..." : "Salvar Requisição"}</Button>)}</div>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    );
}
