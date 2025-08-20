import type { ProcedureItem } from "./procedures"

export enum Priority {
    P1 = "P1",
    P2 = "P2",
    P3 = "P3",
    P4 = "P4",
}

export enum Status {
    PENDENTE = "PENDENTE",
    AGENDADO = "AGENDADO",
    REALIZADO = "REALIZADO",
    CANCELADO = "CANCELADO",
    CANCELADO_ARQUIVADO = "CANCELADO_ARQUIVADO",
    RESOLICITADO = "RESOLICITADO",
    SIS_PENDENTE = "SIS PENDENTE",
}

export enum RegulationType {
    JOAO_PESSOA = "Regulação Município de João Pessoa",
    CAMPINA_GRANDE = "Regulação Município de Campina Grande",
    ESTADUAL = "Regulação Estadual",
}

export interface ImageFile {
    id: string
    name: string
    size: number
    url: string
    uploadedAt: Date
    oneDriveId?: string // ID do arquivo no OneDrive para possível exclusão
}

export interface SchedulingHistory {
    id: string
    scheduledDate?: Date | null
    scheduledLocation?: string
    regulationType?: RegulationType | null
    hasCompanion: boolean
    status: Status
    reason?: string | null
    scheduledBy: string
    scheduledAt: Date
    canceledBy?: string
    canceledAt?: Date
    cancelReason?: string | null
    sisregCode?: string | null
    regnutsCode?: string | null
}

export interface Requisition {
    id: string
    protocol: string
    patientName: string
    procedures: ProcedureItem[]
    priority: Priority
    susCard: string
    receivedDate: Date
    phones: string[]
    status: Status
    images?: ImageFile[]
    createdBy: string
    createdAt: Date
    updatedAt: Date

    // Campos obrigatórios
    healthUnitId: string
    healthAgentId?: string // Opcional

    // Campos de agendamento atual (opcionais)
    scheduledDate?: Date
    scheduledLocation?: string
    regulationType?: RegulationType
    hasCompanion?: boolean // Novo campo para acompanhante
    scheduledBy?: string
    scheduledAt?: Date
    sisregCode?: string
    regnutsCode?: string

    // Histórico de agendamentos
    schedulingHistory?: SchedulingHistory[]
}

export const PRIORITY_LABELS = {
    [Priority.P1]: "P1 - Emergência",
    [Priority.P2]: "P2 - Urgência",
    [Priority.P3]: "P3 - Prioritário",
    [Priority.P4]: "P4 - Eletivo",
}

export const PRIORITY_COLORS = {
    [Priority.P1]: "bg-red-500 text-black",
    [Priority.P2]: "bg-yellow-500 text-black",
    [Priority.P3]: "bg-green-500 text-black",
    [Priority.P4]: "bg-blue-500 text-black",
}


export const STATUS_LABELS = {
    [Status.PENDENTE]: "Pendente",
    [Status.AGENDADO]: "Agendado",
    [Status.REALIZADO]: "Realizado",
    [Status.CANCELADO]: "Cancelado",
    [Status.CANCELADO_ARQUIVADO]: "Cancelado (Arquivado)",
    [Status.RESOLICITADO]: "Resolicitado",
    [Status.SIS_PENDENTE]: "Aguardando Agendamento",
}

export const REGULATION_TYPE_LABELS = {
    [RegulationType.JOAO_PESSOA]: "Regulação Município de João Pessoa",
    [RegulationType.CAMPINA_GRANDE]: "Regulação Município de Campina Grande",
    [RegulationType.ESTADUAL]: "Regulação Estadual",
}

export const STATUS_COLORS = {
    [Status.PENDENTE]: "bg-yellow-500",
    [Status.AGENDADO]: "bg-blue-500",
    [Status.REALIZADO]: "bg-green-500",
    [Status.CANCELADO]: "bg-red-500",
    [Status.CANCELADO_ARQUIVADO]: "bg-gray-500",
    [Status.RESOLICITADO]: "bg-orange-500",
    [Status.SIS_PENDENTE]: "bg-purple-500",
}

export type ActionType = "cancel" | "archive" | "reschedule" | "resolicit" | "complete" | "sis_pendente" | "";

export type UpdateDataValue = string | Date | boolean | Status;