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

    // Campos de agendamento (opcionais)
    scheduledDate?: Date
    scheduledLocation?: string
    regulationType?: RegulationType
    scheduledBy?: string
    scheduledAt?: Date
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
    [Status.SIS_PENDENTE]: "SIS Pendente",
}

export const REGULATION_TYPE_LABELS = {
    [RegulationType.JOAO_PESSOA]: "Regulação Município de João Pessoa",
    [RegulationType.CAMPINA_GRANDE]: "Regulação Município de Campina Grande",
    [RegulationType.ESTADUAL]: "Regulação Estadual",
}
