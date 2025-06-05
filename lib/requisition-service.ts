/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./firebase"
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore"
import { type Requisition, type Priority, type RegulationType, type ImageFile, type SchedulingHistory, Status } from "@/types/requisitions"
import type { ProcedureItem } from "@/types/procedures"
interface CreateRequisitionData {
    protocol: string
    patientName: string
    procedures: ProcedureItem[]
    priority: Priority
    susCard: string
    receivedDate: Date
    phones: string[]
    status: string
    images?: ImageFile[]
    createdBy: string
    healthUnitId: string
    healthAgentId?: string
}

interface UpdateRequisitionData {
    patientName?: string
    procedures?: ProcedureItem[]
    priority?: Priority
    susCard?: string
    receivedDate?: Date
    phones?: string[]
    status?: string
    images?: ImageFile[]
    scheduledDate?: Date
    scheduledLocation?: string
    regulationType?: RegulationType
    hasCompanion?: boolean
    scheduledBy?: string
    healthUnitId?: string
    healthAgentId?: string
}

interface ScheduleRequisitionData {
    scheduledDate: Date
    scheduledLocation: string
    regulationType: RegulationType
    hasCompanion: boolean
    scheduledBy: string
    reason?: string
}

interface UpdateSchedulingData {
    status: string
    reason?: string
    cancelReason?: string
    updatedBy: string
    // Para reagendamento
    newScheduledDate?: Date
    newScheduledLocation?: string
    newRegulationType?: RegulationType
    newHasCompanion?: boolean
}

export class RequisitionService {
    static async createRequisition(data: CreateRequisitionData): Promise<string> {
        try {
            // Verificar se já existe uma requisição com o mesmo protocolo
            const existingQuery = query(collection(db, "requisitions"), where("protocol", "==", data.protocol))
            const existingDocs = await getDocs(existingQuery)

            if (!existingDocs.empty) {
                throw new Error(`Já existe uma requisição com o protocolo ${data.protocol}`)
            }

            // Criar a requisição no Firestore
            const docRef = await addDoc(collection(db, "requisitions"), {
                ...data,
                receivedDate: Timestamp.fromDate(data.receivedDate),
                schedulingHistory: [], // Inicializar histórico vazio
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })

            return docRef.id
        } catch (error) {
            console.error("Erro ao criar requisição:", error)
            throw error
        }
    }

    static async checkDuplicateProcedures(
        susCard: string,
        procedures: ProcedureItem[],
    ): Promise<{
        hasDuplicate: boolean
        duplicates: Array<{ procedure: string; protocol: string; status: string }>
    }> {
        try {
            // Buscar todas as requisições para o cartão SUS que não estão finalizadas
            const q = query(
                collection(db, "requisitions"),
                where("susCard", "==", susCard),
                where("status", "in", ["PENDENTE", "SIS_PENDENTE", "AGENDADO"]),
            )

            const querySnapshot = await getDocs(q)
            const duplicates: Array<{ procedure: string; protocol: string; status: string }> = []

            // Verificar cada procedimento solicitado
            for (const procedure of procedures) {
                for (const doc of querySnapshot.docs) {
                    const data = doc.data()
                    const existingProcedures = data.procedures as ProcedureItem[]

                    // Verificar se algum procedimento existente é igual ao solicitado
                    const hasSameProcedure = existingProcedures.some(
                        (existing) => existing.name.toLowerCase() === procedure.name.toLowerCase(),
                    )

                    if (hasSameProcedure) {
                        duplicates.push({
                            procedure: procedure.name,
                            protocol: data.protocol,
                            status: data.status,
                        })
                    }
                }
            }

            return {
                hasDuplicate: duplicates.length > 0,
                duplicates,
            }
        } catch (error) {
            console.error("Erro ao verificar procedimentos duplicados:", error)
            throw error
        }
    }

    static async getRequisitions(): Promise<Requisition[]> {
        try {
            const q = query(collection(db, "requisitions"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)

            return querySnapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    protocol: data.protocol,
                    patientName: data.patientName,
                    procedures: data.procedures,
                    priority: data.priority,
                    susCard: data.susCard,
                    receivedDate: data.receivedDate.toDate(),
                    phones: data.phones,
                    status: data.status,
                    images: data.images,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    healthUnitId: data.healthUnitId,
                    healthAgentId: data.healthAgentId,
                    scheduledDate: data.scheduledDate?.toDate(),
                    scheduledLocation: data.scheduledLocation,
                    regulationType: data.regulationType,
                    hasCompanion: data.hasCompanion,
                    scheduledBy: data.scheduledBy,
                    scheduledAt: data.scheduledAt?.toDate(),
                    schedulingHistory:
                        data.schedulingHistory?.map((history: any) => ({
                            ...history,
                            scheduledDate: history.scheduledDate?.toDate(),
                            scheduledAt: history.scheduledAt?.toDate(),
                            canceledAt: history.canceledAt?.toDate(),
                        })) || [],
                }
            })
        } catch (error) {
            console.error("Erro ao buscar requisições:", error)
            throw error
        }
    }

    static async getRequisition(id: string): Promise<Requisition | null> {
        return this.getRequisitionById(id)
    }

    static async getRequisitionById(id: string): Promise<Requisition | null> {
        try {
            const docRef = doc(db, "requisitions", id)
            const docSnap = await getDoc(docRef)

            if (!docSnap.exists()) {
                return null
            }

            const data = docSnap.data()
            return {
                id: docSnap.id,
                protocol: data.protocol,
                patientName: data.patientName,
                procedures: data.procedures,
                priority: data.priority,
                susCard: data.susCard,
                receivedDate: data.receivedDate.toDate(),
                phones: data.phones,
                status: data.status,
                images: data.images,
                createdBy: data.createdBy,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                healthUnitId: data.healthUnitId,
                healthAgentId: data.healthAgentId,
                scheduledDate: data.scheduledDate?.toDate(),
                scheduledLocation: data.scheduledLocation,
                regulationType: data.regulationType,
                hasCompanion: data.hasCompanion,
                scheduledBy: data.scheduledBy,
                scheduledAt: data.scheduledAt?.toDate(),
                schedulingHistory:
                    data.schedulingHistory?.map((history: any) => ({
                        ...history,
                        scheduledDate: history.scheduledDate?.toDate(),
                        scheduledAt: history.scheduledAt?.toDate(),
                        canceledAt: history.canceledAt?.toDate(),
                    })) || [],
            }
        } catch (error) {
            console.error("Erro ao buscar requisição:", error)
            throw error
        }
    }

    static async updateRequisition(id: string, data: UpdateRequisitionData): Promise<void> {
        try {
            const docRef = doc(db, "requisitions", id)

            // Criar objeto de atualização com tipos corretos
            const updateData: Record<string, any> = {
                updatedAt: serverTimestamp(),
            }

            // Adicionar campos que não precisam de conversão
            if (data.patientName !== undefined) updateData.patientName = data.patientName
            if (data.procedures !== undefined) updateData.procedures = data.procedures
            if (data.priority !== undefined) updateData.priority = data.priority
            if (data.susCard !== undefined) updateData.susCard = data.susCard
            if (data.phones !== undefined) updateData.phones = data.phones
            if (data.status !== undefined) updateData.status = data.status
            if (data.images !== undefined) updateData.images = data.images
            if (data.scheduledLocation !== undefined) updateData.scheduledLocation = data.scheduledLocation
            if (data.regulationType !== undefined) updateData.regulationType = data.regulationType
            if (data.hasCompanion !== undefined) updateData.hasCompanion = data.hasCompanion
            if (data.scheduledBy !== undefined) updateData.scheduledBy = data.scheduledBy
            if (data.healthUnitId !== undefined) updateData.healthUnitId = data.healthUnitId
            if (data.healthAgentId !== undefined) updateData.healthAgentId = data.healthAgentId

            // Converter datas para Timestamp
            if (data.receivedDate) {
                updateData.receivedDate = Timestamp.fromDate(data.receivedDate)
            }
            if (data.scheduledDate) {
                updateData.scheduledDate = Timestamp.fromDate(data.scheduledDate)
                updateData.scheduledAt = serverTimestamp()
            }

            await updateDoc(docRef, updateData)
        } catch (error) {
            console.error("Erro ao atualizar requisição:", error)
            throw error
        }
    }

    static async scheduleRequisition(id: string, data: ScheduleRequisitionData): Promise<void> {
        try {
            const docRef = doc(db, "requisitions", id)

            // Buscar requisição atual para adicionar ao histórico
            const currentReq = await this.getRequisitionById(id)
            if (!currentReq) {
                throw new Error("Requisição não encontrada")
            }

            // Criar entrada no histórico
            const historyEntry: SchedulingHistory = {
                id: Date.now().toString(),
                scheduledDate: data.scheduledDate,
                scheduledLocation: data.scheduledLocation,
                regulationType: data.regulationType,
                hasCompanion: data.hasCompanion,
                status: Status.AGENDADO,
                reason: data.reason,
                scheduledBy: data.scheduledBy,
                scheduledAt: new Date(),
            }

            const updatedHistory = [...(currentReq.schedulingHistory || []), historyEntry]

            await updateDoc(docRef, {
                status: Status.AGENDADO,
                scheduledDate: Timestamp.fromDate(data.scheduledDate),
                scheduledLocation: data.scheduledLocation,
                regulationType: data.regulationType,
                hasCompanion: data.hasCompanion,
                scheduledBy: data.scheduledBy,
                scheduledAt: serverTimestamp(),
                schedulingHistory: updatedHistory.map((h) => ({
                    ...h,
                    scheduledDate: h.scheduledDate ? Timestamp.fromDate(h.scheduledDate) : null,
                    scheduledAt: Timestamp.fromDate(h.scheduledAt),
                    canceledAt: h.canceledAt ? Timestamp.fromDate(h.canceledAt) : null,
                })),
                updatedAt: serverTimestamp(),
            })
        } catch (error) {
            console.error("Erro ao agendar requisição:", error)
            throw error
        }
    }

    static async updateScheduling(id: string, data: UpdateSchedulingData): Promise<void> {
        try {
            const docRef = doc(db, "requisitions", id)

            // Buscar requisição atual para adicionar ao histórico
            const currentReq = await this.getRequisitionById(id)
            if (!currentReq) {
                throw new Error("Requisição não encontrada")
            }

            let updateData: Record<string, any> = {
                status: data.status,
                updatedAt: serverTimestamp(),
            }

            // Criar entrada no histórico baseada na ação
            let historyEntry: SchedulingHistory

            if (data.status === "CANCELADO" || data.status === "CANCELADO_ARQUIVADO") {
                // Cancelamento
                historyEntry = {
                    id: Date.now().toString(),
                    scheduledDate: currentReq.scheduledDate,
                    scheduledLocation: currentReq.scheduledLocation,
                    regulationType: currentReq.regulationType,
                    hasCompanion: currentReq.hasCompanion || false,
                    status: data.status as Status,
                    reason: data.reason,
                    scheduledBy: currentReq.scheduledBy || "",
                    scheduledAt: currentReq.scheduledAt || new Date(),
                    canceledBy: data.updatedBy,
                    canceledAt: new Date(),
                    cancelReason: data.cancelReason,
                }

                // Limpar dados de agendamento atual
                updateData = {
                    ...updateData,
                    scheduledDate: null,
                    scheduledLocation: null,
                    regulationType: null,
                    hasCompanion: null,
                    scheduledBy: null,
                    scheduledAt: null,
                }
            } else if (data.status === "RESOLICITADO") {
                // Resolicitação
                historyEntry = {
                    id: Date.now().toString(),
                    scheduledDate: currentReq.scheduledDate,
                    scheduledLocation: currentReq.scheduledLocation,
                    regulationType: currentReq.regulationType,
                    hasCompanion: currentReq.hasCompanion || false,
                    status: data.status as Status,
                    reason: data.reason,
                    scheduledBy: currentReq.scheduledBy || "",
                    scheduledAt: currentReq.scheduledAt || new Date(),
                    canceledBy: data.updatedBy,
                    canceledAt: new Date(),
                    cancelReason: data.cancelReason,
                }

                // Limpar dados de agendamento atual e voltar para pendente
                updateData = {
                    ...updateData,
                    status: "PENDENTE", // Resolicitado volta para pendente
                    scheduledDate: null,
                    scheduledLocation: null,
                    regulationType: null,
                    hasCompanion: null,
                    scheduledBy: null,
                    scheduledAt: null,
                }
            } else if (data.newScheduledDate) {
                // Reagendamento
                historyEntry = {
                    id: Date.now().toString(),
                    scheduledDate: data.newScheduledDate,
                    scheduledLocation: data.newScheduledLocation,
                    regulationType: data.newRegulationType,
                    hasCompanion: data.newHasCompanion || false,
                    status: Status.AGENDADO,
                    reason: data.reason,
                    scheduledBy: data.updatedBy,
                    scheduledAt: new Date(),
                }

                // Atualizar dados de agendamento
                updateData = {
                    ...updateData,
                    status: Status.AGENDADO,
                    scheduledDate: Timestamp.fromDate(data.newScheduledDate),
                    scheduledLocation: data.newScheduledLocation,
                    regulationType: data.newRegulationType,
                    hasCompanion: data.newHasCompanion,
                    scheduledBy: data.updatedBy,
                    scheduledAt: serverTimestamp(),
                }
            } else {
                // Outras atualizações de status
                historyEntry = {
                    id: Date.now().toString(),
                    scheduledDate: currentReq.scheduledDate,
                    scheduledLocation: currentReq.scheduledLocation,
                    regulationType: currentReq.regulationType,
                    hasCompanion: currentReq.hasCompanion || false,
                    status: data.status as Status,
                    reason: data.reason,
                    scheduledBy: currentReq.scheduledBy || "",
                    scheduledAt: currentReq.scheduledAt || new Date(),
                    canceledBy: data.updatedBy,
                    canceledAt: new Date(),
                }
            }

            const updatedHistory = [...(currentReq.schedulingHistory || []), historyEntry]

            updateData.schedulingHistory = updatedHistory.map((h) => ({
                ...h,
                scheduledDate: h.scheduledDate ? Timestamp.fromDate(h.scheduledDate) : null,
                scheduledAt: Timestamp.fromDate(h.scheduledAt),
                canceledAt: h.canceledAt ? Timestamp.fromDate(h.canceledAt) : null,
            }))

            await updateDoc(docRef, updateData)
        } catch (error) {
            console.error("Erro ao atualizar agendamento:", error)
            throw error
        }
    }

    static async getPendingRequisitions(): Promise<Requisition[]> {
        try {
            // Buscar todas as requisições e filtrar no cliente para evitar índice composto
            const q = query(collection(db, "requisitions"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)

            const allRequisitions = querySnapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    protocol: data.protocol,
                    patientName: data.patientName,
                    procedures: data.procedures,
                    priority: data.priority,
                    susCard: data.susCard,
                    receivedDate: data.receivedDate.toDate(),
                    phones: data.phones,
                    status: data.status,
                    images: data.images,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    healthUnitId: data.healthUnitId || "",
                    healthAgentId: data.healthAgentId,
                    scheduledDate: data.scheduledDate?.toDate(),
                    scheduledLocation: data.scheduledLocation,
                    regulationType: data.regulationType,
                    hasCompanion: data.hasCompanion,
                    scheduledBy: data.scheduledBy,
                    scheduledAt: data.scheduledAt?.toDate(),
                    schedulingHistory:
                        data.schedulingHistory?.map((history: any) => ({
                            ...history,
                            scheduledDate: history.scheduledDate?.toDate(),
                            scheduledAt: history.scheduledAt?.toDate(),
                            canceledAt: history.canceledAt?.toDate(),
                        })) || [],
                }
            })

            // Filtrar no cliente para requisições pendentes
            const pendingRequisitions = allRequisitions.filter(
                (req) => req.status === "PENDENTE" || req.status === "SIS_PENDENTE",
            )

            // Ordenar por data de recebimento (mais recentes primeiro)
            return pendingRequisitions.sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime())
        } catch (error) {
            console.error("Erro ao buscar requisições pendentes:", error)
            throw error
        }
    }

    static async getScheduledRequisitions(): Promise<Requisition[]> {
        try {
            // Buscar todas as requisições e filtrar no cliente para evitar índice composto
            const q = query(collection(db, "requisitions"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)

            const allRequisitions = querySnapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    protocol: data.protocol,
                    patientName: data.patientName,
                    procedures: data.procedures,
                    priority: data.priority,
                    susCard: data.susCard,
                    receivedDate: data.receivedDate.toDate(),
                    phones: data.phones,
                    status: data.status,
                    images: data.images,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    healthUnitId: data.healthUnitId || "",
                    healthAgentId: data.healthAgentId,
                    scheduledDate: data.scheduledDate?.toDate(),
                    scheduledLocation: data.scheduledLocation,
                    regulationType: data.regulationType,
                    hasCompanion: data.hasCompanion,
                    scheduledBy: data.scheduledBy,
                    scheduledAt: data.scheduledAt?.toDate(),
                    schedulingHistory:
                        data.schedulingHistory?.map((history: any) => ({
                            ...history,
                            scheduledDate: history.scheduledDate?.toDate(),
                            scheduledAt: history.scheduledAt?.toDate(),
                            canceledAt: history.canceledAt?.toDate(),
                        })) || [],
                }
            })

            // Filtrar no cliente para requisições agendadas
            const scheduledRequisitions = allRequisitions.filter((req) => req.status === "AGENDADO")

            // Ordenar por data agendada (mais próximas primeiro)
            return scheduledRequisitions.sort((a, b) => {
                if (!a.scheduledDate && !b.scheduledDate) return 0
                if (!a.scheduledDate) return 1
                if (!b.scheduledDate) return -1
                return a.scheduledDate.getTime() - b.scheduledDate.getTime()
            })
        } catch (error) {
            console.error("Erro ao buscar requisições agendadas:", error)
            throw error
        }
    }

    static async generateProtocol(): Promise<string> {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, "0")
        const day = String(today.getDate()).padStart(2, "0")
        const datePrefix = `${year}${month}${day}`

        // Buscar requisições com o mesmo prefixo de data
        const q = query(
            collection(db, "requisitions"),
            where("protocol", ">=", datePrefix),
            where("protocol", "<", datePrefix + "\uf8ff"),
            orderBy("protocol", "desc"),
        )

        const querySnapshot = await getDocs(q)
        let nextNumber = 1

        if (!querySnapshot.empty) {
            const lastProtocol = querySnapshot.docs[0].data().protocol
            const lastNumber = Number.parseInt(lastProtocol.substring(8), 10)
            nextNumber = lastNumber + 1
        }

        return `${datePrefix}${String(nextNumber).padStart(4, "0")}`
    }
}
