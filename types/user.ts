export enum UserRole {
    ADMINISTRADOR = "ADMINISTRADOR",
    SOLICITANTE_REGULADO = "SOLICITANTE_REGULADO",
    SOLICITANTE = "SOLICITANTE",
    PACIENTE = "PACIENTE",
}

export interface UserProfile {
    uid: string
    email: string
    displayName: string
    role: UserRole
    createdAt: Date
    updatedAt: Date
    createdBy?: string
    isActive: boolean
    additionalInfo?: {
        cpf?: string
        telefone?: string
        unidadeSaude?: string
        especialidade?: string
        crm?: string
    }
}

export const ROLE_PERMISSIONS = {
    [UserRole.ADMINISTRADOR]: {
        canCreateUsers: true,
        canManageRoles: true,
        canViewAllRequests: true,
        canApproveRequests: true,
        canGenerateReports: true,
        canManageSystem: true,
    },
    [UserRole.SOLICITANTE_REGULADO]: {
        canCreateUsers: false,
        canManageRoles: false,
        canViewAllRequests: true,
        canApproveRequests: true,
        canGenerateReports: true,
        canManageSystem: false,
    },
    [UserRole.SOLICITANTE]: {
        canCreateUsers: false,
        canManageRoles: false,
        canViewAllRequests: false,
        canApproveRequests: false,
        canGenerateReports: false,
        canManageSystem: false,
    },
    [UserRole.PACIENTE]: {
        canCreateUsers: false,
        canManageRoles: false,
        canViewAllRequests: false,
        canApproveRequests: false,
        canGenerateReports: false,
        canManageSystem: false,
    },
}

export const ROLE_LABELS = {
    [UserRole.ADMINISTRADOR]: "Administrador",
    [UserRole.SOLICITANTE_REGULADO]: "Solicitante Regulado",
    [UserRole.SOLICITANTE]: "Solicitante",
    [UserRole.PACIENTE]: "Paciente",
}

export const ROLE_DESCRIPTIONS = {
    [UserRole.ADMINISTRADOR]: "Acesso total ao sistema, pode gerenciar usuários e configurações",
    [UserRole.SOLICITANTE_REGULADO]: "Pode aprovar requisições e gerar relatórios",
    [UserRole.SOLICITANTE]: "Pode criar e acompanhar suas próprias requisições",
    [UserRole.PACIENTE]: "Pode visualizar suas próprias requisições e status",
}
  