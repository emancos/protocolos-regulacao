export interface HealthAgent {
    id: string
    name: string
    healthUnitId: string // Mudança: agora referencia diretamente a unidade de saúde
}

export interface HealthUnit {
    id: string
    name: string
    type: "UBS" | "PSF" | "HOSPITAL" | "CLINICA"
}

// Dados mockados - em produção viriam do banco de dados
export const HEALTH_UNITS: HealthUnit[] = [
    { id: "1", name: "UBS Centro", type: "UBS" },
    { id: "2", name: "UBS Mangabeira", type: "UBS" },
    { id: "3", name: "UBS Bancários", type: "UBS" },
    { id: "4", name: "PSF Alto do Mateus", type: "PSF" },
    { id: "5", name: "PSF Valentina", type: "PSF" },
    { id: "6", name: "PSF Grotão", type: "PSF" },
    { id: "7", name: "PSF Cristo Redentor", type: "PSF" },
    { id: "8", name: "PSF José Américo", type: "PSF" },
]

export const HEALTH_AGENTS: HealthAgent[] = [
    // UBS Centro
    { id: "agent1", name: "Maria Silva Santos", healthUnitId: "1" },
    { id: "agent2", name: "João Carlos Oliveira", healthUnitId: "1" },
    { id: "agent3", name: "Ana Paula Costa", healthUnitId: "1" },

    // UBS Mangabeira
    { id: "agent4", name: "Pedro Henrique Lima", healthUnitId: "2" },
    { id: "agent5", name: "Carla Fernanda Souza", healthUnitId: "2" },
    { id: "agent6", name: "Roberto Carlos Alves", healthUnitId: "2" },

    // UBS Bancários
    { id: "agent7", name: "Luciana Pereira", healthUnitId: "3" },
    { id: "agent8", name: "Fernando José Silva", healthUnitId: "3" },
    { id: "agent9", name: "Patrícia Rodrigues", healthUnitId: "3" },

    // PSF Alto do Mateus
    { id: "agent10", name: "Carlos Eduardo Santos", healthUnitId: "4" },
    { id: "agent11", name: "Juliana Martins", healthUnitId: "4" },
    { id: "agent12", name: "Ricardo Almeida", healthUnitId: "4" },
    { id: "agent13", name: "Simone Barbosa", healthUnitId: "4" },
    { id: "agent14", name: "Marcos Vinícius", healthUnitId: "4" },
    { id: "agent15", name: "Adriana Campos", healthUnitId: "4" },

    // PSF Valentina
    { id: "agent16", name: "Thiago Nascimento", healthUnitId: "5" },
    { id: "agent17", name: "Vanessa Moreira", healthUnitId: "5" },
    { id: "agent18", name: "Alexandre Ferreira", healthUnitId: "5" },
    { id: "agent19", name: "Cristiane Lopes", healthUnitId: "5" },
    { id: "agent20", name: "Daniel Ribeiro", healthUnitId: "5" },
    { id: "agent21", name: "Fabiana Gomes", healthUnitId: "5" },

    // PSF Grotão
    { id: "agent22", name: "Gustavo Henrique", healthUnitId: "6" },
    { id: "agent23", name: "Renata Cardoso", healthUnitId: "6" },
    { id: "agent24", name: "Sérgio Batista", healthUnitId: "6" },
    { id: "agent25", name: "Tatiana Freitas", healthUnitId: "6" },
    { id: "agent26", name: "Wagner Sousa", healthUnitId: "6" },
    { id: "agent27", name: "Priscila Dias", healthUnitId: "6" },

    // PSF Cristo Redentor
    { id: "agent28", name: "Leonardo Castro", healthUnitId: "7" },
    { id: "agent29", name: "Mônica Araújo", healthUnitId: "7" },
    { id: "agent30", name: "Rodrigo Mendes", healthUnitId: "7" },

    // PSF José Américo
    { id: "agent31", name: "Fernanda Silva", healthUnitId: "8" },
    { id: "agent32", name: "Bruno Santos", healthUnitId: "8" },
    { id: "agent33", name: "Camila Oliveira", healthUnitId: "8" },
]
