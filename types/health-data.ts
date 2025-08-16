/**
 * Define a estrutura de uma Unidade de Saúde, conforme armazenado no Firestore.
 */
export interface HealthUnit {
    id: string;
    name: string;
    location: string;
    responsible_nurse: string;
}

/**
 * Define a estrutura de um Agente de Saúde, conforme armazenado no Firestore.
 */
export interface HealthAgent {
    id: string;
    name: string;
    phone_number: string;
    microarea: string;
    unit_id: string;
    nickname?: string; // Campo opcional
    notes?: string;    // Campo opcional
}