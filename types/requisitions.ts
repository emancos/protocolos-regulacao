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
    scheduledDate?: Date
    scheduledLocation?: string
    regulationType?: RegulationType
    hasCompanion: boolean
    status: Status
    reason?: string // Motivo da alteração
    scheduledBy: string
    scheduledAt: Date
    canceledBy?: string
    canceledAt?: Date
    cancelReason?: string
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

    // Histórico de agendamentos
    schedulingHistory?: SchedulingHistory[]
}

export const PRIORITY_LABELS = {
    [Priority.P1]: "P1 - Emergência",
    [Priority.P2]: "P2 - Urgência",
    [Priority.P3]: "P3 - Eletivo Prioritário",
    [Priority.P4]: "P4 - Eletivo",
}

export const STATUS_LABELS = {
    [Status.PENDENTE]: "Pendente",
    [Status.AGENDADO]: "Agendado",
    [Status.REALIZADO]: "Realizado",
    [Status.CANCELADO]: "Cancelado",
    [Status.CANCELADO_ARQUIVADO]: "Cancelado (Arquivado)",
    [Status.RESOLICITADO]: "Resolicitado",
    [Status.SIS_PENDENTE]: "SIS Pendente",
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

export type ActionType = "cancel" | "archive" | "reschedule" | "resolicit" | "complete" | "";

export type UpdateDataValue = string | Date | boolean | Status;