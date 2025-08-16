/* eslint-disable @typescript-eslint/no-explicit-any */
import { customAlphabet } from 'nanoid';
import { format } from 'date-fns';
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
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData,
    QueryConstraint
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

export interface UpdateSchedulingData {
    status: string
    updatedBy: string
    reason?: string
    cancelReason?: string
    sisregCode?: string
    regnutsCode?: string
    newScheduledDate?: Date
    newScheduledLocation?: string
    newRegulationType?: RegulationType
    newHasCompanion?: boolean
}

export interface PaginatedRequisitions {
    requisitions: Requisition[];
    lastVisible: QueryDocumentSnapshot<DocumentData> | null;
}

export class RequisitionService {

    private static mapDocToRequisition(doc: QueryDocumentSnapshot<DocumentData>): Requisition {
        const data = doc.data();
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
            sisregCode: data.sisregCode,
            regnutsCode: data.regnutsCode,
            schedulingHistory:
                data.schedulingHistory?.map((history: any) => ({
                    ...history,
                    scheduledDate: history.scheduledDate?.toDate(),
                    scheduledAt: history.scheduledAt?.toDate(),
                    canceledAt: history.canceledAt?.toDate(),
                })) || [],
        };
    }

    /**
     * Busca requisições com status PENDENTE ou RESOLICITADO.
     * IMPORTANTE: Requer índice no Firestore: status (Asc), receivedDate (Desc)
     */
    static async getPendingRequisitions(pageSize = 15, lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null): Promise<PaginatedRequisitions> {
        try {
            const constraints: QueryConstraint[] = [
                where("status", "in", [Status.PENDENTE, Status.RESOLICITADO]), // SIS_PENDENTE removido
                orderBy("receivedDate", "desc"),
                limit(pageSize)
            ];
            const q = lastVisibleDoc
                ? query(collection(db, "requisitions"), ...constraints, startAfter(lastVisibleDoc))
                : query(collection(db, "requisitions"), ...constraints);

            const querySnapshot = await getDocs(q);
            const requisitions = querySnapshot.docs.map(this.mapDocToRequisition);
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

            return { requisitions, lastVisible };
        } catch (error) {
            console.error("Erro ao buscar requisições pendentes. Verifique se o índice do Firestore foi criado.", error);
            throw error;
        }
    }

    static async getSisPendingRequisitions(pageSize = 15, lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null): Promise<PaginatedRequisitions> {
        try {
            const constraints: QueryConstraint[] = [
                where("status", "==", Status.SIS_PENDENTE),
                orderBy("receivedDate", "desc"),
                limit(pageSize)
            ];
            const q = lastVisibleDoc
                ? query(collection(db, "requisitions"), ...constraints, startAfter(lastVisibleDoc))
                : query(collection(db, "requisitions"), ...constraints);

            const querySnapshot = await getDocs(q);
            const requisitions = querySnapshot.docs.map(this.mapDocToRequisition);
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

            return { requisitions, lastVisible };
        } catch (error) {
            console.error("Erro ao buscar requisições 'Aguardando Agendamento'. Verifique se o índice do Firestore foi criado.", error);
            throw error;
        }
    }

    /**
     * Busca requisições com status AGENDADO.
     * IMPORTANTE: Esta consulta requer um índice composto no Firestore.
     * Coleção: requisitions | Campos: status (Ascendente), scheduledDate (Ascendente)
     */
    static async getScheduledRequisitions(pageSize = 15, lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null): Promise<PaginatedRequisitions> {
        try {
            const constraints: QueryConstraint[] = [
                where("status", "==", Status.AGENDADO),
                orderBy("scheduledDate", "asc"),
                limit(pageSize)
            ];

            const q = lastVisibleDoc
                ? query(collection(db, "requisitions"), ...constraints, startAfter(lastVisibleDoc))
                : query(collection(db, "requisitions"), ...constraints);

            const querySnapshot = await getDocs(q);
            const requisitions = querySnapshot.docs.map(this.mapDocToRequisition);
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

            return { requisitions, lastVisible };
        } catch (error) {
            console.error("Erro ao buscar requisições agendadas. Verifique se o índice do Firestore foi criado.", error);
            throw error;
        }
    }

    /**
     * Busca requisições com status CANCELADO ou CANCELADO_ARQUIVADO.
     * IMPORTANTE: Esta consulta requer um índice composto no Firestore.
     * Coleção: requisitions | Campos: status (Ascendente), updatedAt (Descendente)
     */
    static async getCanceledRequisitions(pageSize = 15, lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null): Promise<PaginatedRequisitions> {
        try {
            const constraints: QueryConstraint[] = [
                where("status", "in", [Status.CANCELADO, Status.CANCELADO_ARQUIVADO]),
                orderBy("updatedAt", "desc"),
                limit(pageSize)
            ];

            const q = lastVisibleDoc
                ? query(collection(db, "requisitions"), ...constraints, startAfter(lastVisibleDoc))
                : query(collection(db, "requisitions"), ...constraints);

            const querySnapshot = await getDocs(q);
            const requisitions = querySnapshot.docs.map(this.mapDocToRequisition);
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

            return { requisitions, lastVisible };
        } catch (error) {
            console.error("Erro ao buscar requisições canceladas. Verifique se o índice do Firestore foi criado.", error)
            throw error
        }
    }

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
        [x: string]: any
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
                sisregCode: data.sisregCode,
                regnutsCode : data.regnutsCode,
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
                scheduledDate: currentReq.scheduledDate || null,
                scheduledLocation: currentReq.scheduledLocation || "",
                regulationType: currentReq.regulationType || null,
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

            if (data.status === Status.SIS_PENDENTE || data.status === Status.RESOLICITADO) {
                await this.checkUniqueRegulationCodes({
                    sisregCode: data.sisregCode,
                    regnutsCode: data.regnutsCode,
                    currentRequisitionId: id,
                });
            }

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

            if (data.status === Status.SIS_PENDENTE || data.status === Status.RESOLICITADO) {
                updateData.sisregCode = data.sisregCode || null;
                updateData.regnutsCode = data.regnutsCode || null;
                // Limpa informações de agendamento anterior
                Object.assign(updateData, { scheduledDate: null, scheduledLocation: null, regulationType: null, hasCompanion: null, scheduledBy: null, scheduledAt: null });

                historyEntry = {
                    id: Date.now().toString(),
                    status: data.status,
                    scheduledAt: new Date(),
                    scheduledBy: data.updatedBy,
                    reason: data.reason || null,
                    cancelReason: data.cancelReason || null,
                    sisregCode: data.sisregCode || null,
                    regnutsCode: data.regnutsCode || null,
                    scheduledDate: null,
                    scheduledLocation: "",
                    regulationType: null,
                    hasCompanion: false,
                };
            }

            else if (data.status === "CANCELADO" || data.status === "CANCELADO_ARQUIVADO") {
                // Cancelamento
                historyEntry = {
                    id: Date.now().toString(),
                    scheduledDate: currentReq.scheduledDate || null,
                    scheduledLocation: currentReq.scheduledLocation || "",
                    regulationType: currentReq.regulationType || null,
                    hasCompanion: currentReq.hasCompanion || false,
                    status: data.status as Status,
                    ...(data.reason && { reason: data.reason }),
                    scheduledBy: currentReq.scheduledBy || "",
                    scheduledAt: currentReq.scheduledAt || new Date(),
                    canceledBy: data.updatedBy,
                    canceledAt: new Date(),
                    ...(data.cancelReason && { cancelReason: data.cancelReason }),
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
                    scheduledDate: currentReq.scheduledDate || null,
                    scheduledLocation: currentReq.scheduledLocation || "",
                    regulationType: currentReq.regulationType || null,
                    hasCompanion: currentReq.hasCompanion || false,
                    status: data.status as Status,
                    ...(data.reason && { reason: data.reason }),
                    scheduledBy: currentReq.scheduledBy || "",
                    scheduledAt: currentReq.scheduledAt || new Date(),
                    canceledBy: data.updatedBy,
                    canceledAt: new Date(),
                    ...(data.cancelReason && { cancelReason: data.cancelReason }),
                }

                // Limpar dados de agendamento atual e voltar para pendente
                updateData = {
                    ...updateData,
                    status: "RESOLICITADO", // Resolicitado volta para pendente
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
                    scheduledDate: currentReq.scheduledDate || null,
                    scheduledLocation: currentReq.scheduledLocation || "",
                    regulationType: currentReq.regulationType || null,
                    hasCompanion: data.newHasCompanion || false,
                    status: Status.AGENDADO,
                    ...(data.reason && { reason: data.reason }),
                    scheduledBy: data.updatedBy,
                    scheduledAt: new Date(),
                }

                // Atualizar dados de agendamento
                updateData = {
                    ...updateData,
                    status: Status.AGENDADO,
                    scheduledDate: Timestamp.fromDate(data.newScheduledDate),
                    scheduledBy: data.updatedBy,
                    scheduledAt: serverTimestamp(),
                }
                if (data.newScheduledLocation !== undefined) {
                    updateData.scheduledLocation = data.newScheduledLocation
                }
                if (data.newRegulationType !== undefined) {
                    updateData.regulationType = data.newRegulationType
                }
                if (data.newHasCompanion !== undefined) {
                    updateData.hasCompanion = data.newHasCompanion
                }
            } else {
                // Outras atualizações de status
                historyEntry = {
                    id: Date.now().toString(),
                    scheduledDate: currentReq.scheduledDate || null,
                    scheduledLocation: currentReq.scheduledLocation || "",
                    regulationType: currentReq.regulationType || null,
                    hasCompanion: currentReq.hasCompanion || false,
                    status: data.status as Status,
                    ...(data.reason && { reason: data.reason }),
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

    static async generateUniqueProtocol(): Promise<string> {
        // const prefix = 'REQ';
        const datePart = format(new Date(), 'yyMMdd');
        const MAX_RETRIES = 5; // Define um limite de segurança para as tentativas

        for (let i = 0; i < MAX_RETRIES; i++) {
            // Gera um ID único com 7 caracteres. 
            // A-Z, a-z, 0-9. Mais de 3 trilhões de combinações.
            const nanoid = customAlphabet('1234567890', 10)
            const uniquePart = nanoid(5);
            const newProtocol = `${datePart}${uniquePart}`;

            const q = query(collection(db, "requisitions"), where("protocol", "==", `${newProtocol}`))
            const existingProtocol = await getDocs(q)
            const existingRequisition = existingProtocol.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    protocol: data.protocol,
                    patientName: data.patientName,
                }
            })

            // Se não existir, encontramos um protocolo único. Retorne-o.
            if (existingRequisition.length == 0) {
                console.log(`✅ Protocolo único gerado: ${newProtocol}`);
                return newProtocol;
            }

            // Se existir (evento raríssimo), o loop continuará para tentar novamente.
            console.warn(`Colisão de protocolo detectada: ${newProtocol}. Tentando novamente...`);
        }

        // Se o loop terminar sem sucesso, lance um erro.
        throw new Error('Não foi possível gerar um protocolo único após várias tentativas.');
    }

    private static async checkUniqueRegulationCodes(
        { sisregCode, regnutsCode, currentRequisitionId }:
            { sisregCode?: string | null, regnutsCode?: string | null, currentRequisitionId: string }
    ): Promise<void> {
        const requisitionsRef = collection(db, "requisitions");

        if (sisregCode) {
            const q = query(requisitionsRef, where("sisregCode", "==", sisregCode));
            const querySnapshot = await getDocs(q);
            for (const doc of querySnapshot.docs) {
                if (doc.id !== currentRequisitionId) {
                    throw new Error(`O Código SISREGIII "${sisregCode}" já está em uso no protocolo ${doc.data().protocol}.`);
                }
            }
        }

        if (regnutsCode) {
            const q = query(requisitionsRef, where("regnutsCode", "==", regnutsCode));
            const querySnapshot = await getDocs(q);
            for (const doc of querySnapshot.docs) {
                if (doc.id !== currentRequisitionId) {
                    throw new Error(`O Código REGNUTS "${regnutsCode}" já está em uso no protocolo ${doc.data().protocol}.`);
                }
            }
        }
    }
}
