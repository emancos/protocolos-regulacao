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
import type { Requisition, Priority, Status, RegulationType, ImageFile } from "@/types/requisitions"
import type { ProcedureItem } from "@/types/procedures"

interface CreateRequisitionData {
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
}

interface UpdateRequisitionData {
    patientName?: string
    procedures?: ProcedureItem[]
    priority?: Priority
    susCard?: string
    receivedDate?: Date
    phones?: string[]
    status?: Status
    images?: ImageFile[]
    scheduledDate?: Date
    scheduledLocation?: string
    regulationType?: RegulationType
    scheduledBy?: string
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })

            return docRef.id
        } catch (error) {
            console.error("Erro ao criar requisição:", error)
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
                    scheduledDate: data.scheduledDate?.toDate(),
                    scheduledLocation: data.scheduledLocation,
                    regulationType: data.regulationType,
                    scheduledBy: data.scheduledBy,
                    scheduledAt: data.scheduledAt?.toDate(),
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
                scheduledDate: data.scheduledDate?.toDate(),
                scheduledLocation: data.scheduledLocation,
                regulationType: data.regulationType,
                scheduledBy: data.scheduledBy,
                scheduledAt: data.scheduledAt?.toDate(),
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
            if (data.scheduledBy !== undefined) updateData.scheduledBy = data.scheduledBy

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

    static async scheduleRequisition(
        id: string,
        scheduledDate: Date,
        scheduledLocation: string,
        regulationType: RegulationType,
        scheduledBy: string,
    ): Promise<void> {
        try {
            const docRef = doc(db, "requisitions", id)

            await updateDoc(docRef, {
                status: "AGENDADO",
                scheduledDate: Timestamp.fromDate(scheduledDate),
                scheduledLocation,
                regulationType,
                scheduledBy,
                scheduledAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })
        } catch (error) {
            console.error("Erro ao agendar requisição:", error)
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
                    scheduledDate: data.scheduledDate?.toDate(),
                    scheduledLocation: data.scheduledLocation,
                    regulationType: data.regulationType,
                    scheduledBy: data.scheduledBy,
                    scheduledAt: data.scheduledAt?.toDate(),
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
            // Buscar apenas requisições agendadas
            const q = query(collection(db, "requisitions"), where("status", "==", "AGENDADO"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)

            const scheduledRequisitions = querySnapshot.docs.map((doc) => {
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
                    scheduledDate: data.scheduledDate?.toDate(),
                    scheduledLocation: data.scheduledLocation,
                    regulationType: data.regulationType,
                    scheduledBy: data.scheduledBy,
                    scheduledAt: data.scheduledAt?.toDate(),
                }
            })

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
