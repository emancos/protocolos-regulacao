import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, writeBatch, where } from "firebase/firestore";
import { db } from "./firebase";

// Assumindo que você criará este arquivo de tipos
export interface ProcedureGroup {
    id: string;
    name: string;
    order: number;
}

export interface Procedure {
    id: string;
    name: string;
    code: string;
    groupId: string;
}

export class ProcedureService {
    private static readonly GROUPS_COLLECTION = 'procedure_groups';
    private static readonly PROCEDURES_COLLECTION = 'procedures';

    // --- MÉTODOS PARA GRUPOS DE PROCEDIMENTOS ---

    static async getAllProcedureGroups(): Promise<ProcedureGroup[]> {
        try {
            const q = query(collection(db, this.GROUPS_COLLECTION), orderBy("order", "asc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcedureGroup));
        } catch (error) {
            console.error("Erro ao buscar grupos de procedimentos:", error);
            return [];
        }
    }

    static async createProcedureGroup(data: Omit<ProcedureGroup, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.GROUPS_COLLECTION), data);
        return docRef.id;
    }

    static async updateProcedureGroup(id: string, data: Partial<ProcedureGroup>): Promise<void> {
        await updateDoc(doc(db, this.GROUPS_COLLECTION, id), data);
    }

    static async deleteProcedureGroup(id: string): Promise<void> {
        const batch = writeBatch(db);

        // Deleta todos os procedimentos associados ao grupo
        const proceduresQuery = query(collection(db, this.PROCEDURES_COLLECTION), where("groupId", "==", id));
        const proceduresSnapshot = await getDocs(proceduresQuery);
        proceduresSnapshot.forEach(doc => batch.delete(doc.ref));

        // Deleta o próprio grupo
        batch.delete(doc(db, this.GROUPS_COLLECTION, id));

        await batch.commit();
    }

    // --- MÉTODOS PARA PROCEDIMENTOS ---

    static async getAllProcedures(): Promise<Procedure[]> {
        try {
            const q = query(collection(db, this.PROCEDURES_COLLECTION), orderBy("name", "asc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Procedure));
        } catch (error) {
            console.error("Erro ao buscar procedimentos:", error);
            return [];
        }
    }

    static async createProcedure(data: Omit<Procedure, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.PROCEDURES_COLLECTION), data);
        return docRef.id;
    }

    static async updateProcedure(id: string, data: Partial<Procedure>): Promise<void> {
        await updateDoc(doc(db, this.PROCEDURES_COLLECTION, id), data);
    }

    static async deleteProcedure(id: string): Promise<void> {
        await deleteDoc(doc(db, this.PROCEDURES_COLLECTION, id));
    }
}
