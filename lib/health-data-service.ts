import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { HealthUnit, HealthAgent } from "@/types/health-data";

export class HealthDataService {
    /**
     * Busca todas as unidades de saúde do Firestore, ordenadas por nome.
     */
    static async getAllHealthUnits(): Promise<HealthUnit[]> {
        try {
            const unitsCollection = collection(db, 'health_units');
            const q = query(unitsCollection, orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as HealthUnit));
        } catch (error) {
            console.error("Erro ao buscar unidades de saúde:", error);
            return [];
        }
    }

    /**
     * Busca todos os agentes de saúde vinculados a uma unidade específica.
     */
    static async getAgentsByUnit(unitId: string): Promise<HealthAgent[]> {
        if (!unitId) return [];
        try {
            const agentsCollection = collection(db, 'health_agents');
            const q = query(
                agentsCollection,
                where("unit_id", "==", unitId),
                orderBy("name", "asc")
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as HealthAgent));
        } catch (error) {
            console.error(`Erro ao buscar agentes para a unidade ${unitId}:`, error);
            return [];
        }
    }

    /**
     * Busca uma unidade de saúde específica pelo seu ID.
     */
    static async getHealthUnitById(unitId: string): Promise<HealthUnit | null> {
        if (!unitId) return null;
        try {
            const unitRef = doc(db, 'health_units', unitId);
            const docSnap = await getDoc(unitRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as HealthUnit;
            }
            return null;
        } catch (error) {
            console.error(`Erro ao buscar unidade de saúde ${unitId}:`, error);
            return null;
        }
    }

    /**
     * Busca um agente de saúde específico pelo seu ID.
     */
    static async getHealthAgentById(agentId: string): Promise<HealthAgent | null> {
        if (!agentId) return null;
        try {
            const agentRef = doc(db, 'health_agents', agentId);
            const docSnap = await getDoc(agentRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as HealthAgent;
            }
            return null;
        } catch (error) {
            console.error(`Erro ao buscar agente de saúde ${agentId}:`, error);
            return null;
        }
    }
}