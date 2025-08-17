import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { HealthUnit, HealthAgent } from "@/types/health-data";

export class HealthDataService {
    private static readonly UNITS_COLLECTION = 'health_units';
    private static readonly AGENTS_COLLECTION = 'health_agents';

    // --- MÉTODOS PARA UNIDADES DE SAÚDE ---

    static async getAllHealthUnits(): Promise<HealthUnit[]> {
        try {
            const q = query(collection(db, this.UNITS_COLLECTION), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthUnit));
        } catch (error) {
            console.error("Erro ao buscar unidades de saúde:", error);
            return [];
        }
    }

    static async getHealthUnitById(unitId: string): Promise<HealthUnit | null> {
        if (!unitId) return null;
        try {
            const docRef = doc(db, this.UNITS_COLLECTION, unitId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as HealthUnit : null;
        } catch (error) {
            console.error(`Erro ao buscar unidade ${unitId}:`, error);
            return null;
        }
    }

    static async createHealthUnit(data: Omit<HealthUnit, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.UNITS_COLLECTION), data);
        return docRef.id;
    }

    static async updateHealthUnit(id: string, data: Partial<HealthUnit>): Promise<void> {
        const docRef = doc(db, this.UNITS_COLLECTION, id);
        await updateDoc(docRef, data);
    }

    static async deleteHealthUnit(id: string): Promise<void> {
        // Primeiro, deleta todos os agentes associados a esta unidade
        const agentsQuery = query(collection(db, this.AGENTS_COLLECTION), where("unit_id", "==", id));
        const agentsSnapshot = await getDocs(agentsQuery);

        const batch = writeBatch(db);
        agentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Depois, deleta a própria unidade
        const unitRef = doc(db, this.UNITS_COLLECTION, id);
        batch.delete(unitRef);

        await batch.commit();
    }

    // --- MÉTODOS PARA AGENTES DE SAÚDE ---

    static async getAllHealthAgents(): Promise<HealthAgent[]> {
        try {
            const q = query(collection(db, this.AGENTS_COLLECTION), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthAgent));
        } catch (error) {
            console.error("Erro ao buscar todos os agentes de saúde:", error);
            return [];
        }
    }

    static async getAgentsByUnit(unitId: string): Promise<HealthAgent[]> {
        if (!unitId) return [];
        try {
            const q = query(collection(db, this.AGENTS_COLLECTION), where("unit_id", "==", unitId), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthAgent));
        } catch (error) {
            console.error(`Erro ao buscar agentes para a unidade ${unitId}:`, error);
            return [];
        }
    }

    static async getHealthAgentById(agentId: string): Promise<HealthAgent | null> {
        if (!agentId) return null;
        try {
            const docRef = doc(db, this.AGENTS_COLLECTION, agentId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as HealthAgent : null;
        } catch (error) {
            console.error(`Erro ao buscar agente ${agentId}:`, error);
            return null;
        }
    }

    static async createHealthAgent(data: Omit<HealthAgent, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.AGENTS_COLLECTION), data);
        return docRef.id;
    }

    static async updateHealthAgent(id: string, data: Partial<HealthAgent>): Promise<void> {
        const docRef = doc(db, this.AGENTS_COLLECTION, id);
        await updateDoc(docRef, data);
    }

    static async deleteHealthAgent(id: string): Promise<void> {
        const docRef = doc(db, this.AGENTS_COLLECTION, id);
        await deleteDoc(docRef);
    }
}
