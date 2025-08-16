import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import type { HealthUnit, HealthAgent } from "@/types/health-data";

export class HealthDataService {
    /**
     * Busca todas as unidades de saúde do Firestore, ordenadas por nome.
     * @returns Uma promessa que resolve para um array de HealthUnit.
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
     * @param unitId O ID da unidade de saúde.
     * @returns Uma promessa que resolve para um array de HealthAgent.
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
}