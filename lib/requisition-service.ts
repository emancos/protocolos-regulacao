import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { type Requisition, Status } from "@/types/requisitions"

export class RequisitionService {
    private static readonly COLLECTION = "requisitions"

    static async createRequisition(requisition: Omit<Requisition, "id" | "createdAt" | "updatedAt">): Promise<string> {
        const docRef = doc(collection(db, this.COLLECTION))

        const newRequisition: Requisition = {
            ...requisition,
            id: docRef.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await setDoc(docRef, {
            ...newRequisition,
            receivedDate: Timestamp.fromDate(newRequisition.receivedDate),
            createdAt: Timestamp.fromDate(newRequisition.createdAt),
            updatedAt: Timestamp.fromDate(newRequisition.updatedAt),
        })

        return docRef.id
    }

    static async getRequisition(id: string): Promise<Requisition | null> {
        const docRef = doc(db, this.COLLECTION, id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            const data = docSnap.data()
            return {
                ...data,
                id: docSnap.id,
                receivedDate: data.receivedDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                scheduledDate: data.scheduledDate ? data.scheduledDate.toDate() : undefined,
                scheduledAt: data.scheduledAt ? data.scheduledAt.toDate() : undefined,
            } as Requisition
        }

        return null
    }

    static async updateRequisition(id: string, updates: Partial<Requisition>): Promise<void> {
        const docRef = doc(db, this.COLLECTION, id)

        const updateData = {
            ...updates,
            updatedAt: new Date(),
        }

        // Converter datas para Timestamp
        if (updates.receivedDate) {
            updateData.receivedDate = Timestamp.fromDate(updates.receivedDate).toDate()
        }
        if (updates.scheduledDate) {
            updateData.scheduledDate = Timestamp.fromDate(updates.scheduledDate).toDate()
        }
        if (updates.scheduledAt) {
            updateData.scheduledAt = Timestamp.fromDate(updates.scheduledAt).toDate()
        }
        updateData.updatedAt = Timestamp.fromDate(updateData.updatedAt).toDate()

        await updateDoc(docRef, updateData)
    }

    static async scheduleRequisition(
        id: string,
        scheduledDate: Date,
        scheduledLocation: string,
        regulationType: string,
        scheduledBy: string,
    ): Promise<void> {
        const docRef = doc(db, this.COLLECTION, id)

        await updateDoc(docRef, {
            scheduledDate: Timestamp.fromDate(scheduledDate),
            scheduledLocation,
            regulationType,
            scheduledBy,
            scheduledAt: Timestamp.fromDate(new Date()),
            status: Status.AGENDADO,
            updatedAt: Timestamp.fromDate(new Date()),
        })
    }

    static async getAllRequisitions(): Promise<Requisition[]> {
        const q = query(collection(db, this.COLLECTION), orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                ...data,
                id: doc.id,
                receivedDate: data.receivedDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                scheduledDate: data.scheduledDate ? data.scheduledDate.toDate() : undefined,
                scheduledAt: data.scheduledAt ? data.scheduledAt.toDate() : undefined,
            } as Requisition
        })
    }

    static async getPendingRequisitions(): Promise<Requisition[]> {
        const q = query(
            collection(db, this.COLLECTION),
            where("status", "in", [Status.PENDENTE, Status.SIS_PENDENTE]),
            orderBy("receivedDate", "asc"),
        )

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                ...data,
                id: doc.id,
                receivedDate: data.receivedDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                scheduledDate: data.scheduledDate ? data.scheduledDate.toDate() : undefined,
                scheduledAt: data.scheduledAt ? data.scheduledAt.toDate() : undefined,
            } as Requisition
        })
    }

    static async getScheduledRequisitions(): Promise<Requisition[]> {
        const q = query(
            collection(db, this.COLLECTION),
            where("status", "==", Status.AGENDADO),
            orderBy("scheduledDate", "asc"),
        )

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                ...data,
                id: doc.id,
                receivedDate: data.receivedDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                scheduledDate: data.scheduledDate.toDate(),
                scheduledAt: data.scheduledAt.toDate(),
            } as Requisition
        })
    }

    static async generateProtocol(): Promise<string> {
        const today = new Date()
        const year = today.getFullYear()

        // Buscar o último protocolo do ano atual
        const q = query(
            collection(db, this.COLLECTION),
            where("protocol", ">=", `${year}`),
            where("protocol", "<", `${year + 1}`),
            orderBy("protocol", "desc"),
            limit(1),
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
            // Primeiro protocolo do ano
            return `${year}0001`
        } else {
            const lastProtocol = querySnapshot.docs[0].data().protocol
            const lastNumber = Number.parseInt(lastProtocol.substring(4))
            const newNumber = lastNumber + 1
            return `${year}${newNumber.toString().padStart(4, "0")}`
        }
    }
}
  