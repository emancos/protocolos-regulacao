"use client"

import { Badge } from "@/components/ui/badge"
import { UserRole, ROLE_LABELS } from "@/types/user"
import { Shield, Users, User, Heart } from "lucide-react"

interface UserRoleBadgeProps {
    role: UserRole
    showIcon?: boolean
}

export function UserRoleBadge({ role, showIcon = true }: UserRoleBadgeProps) {
    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMINISTRADOR:
                return <Shield className="h-3 w-3" />
            case UserRole.SOLICITANTE_REGULADO:
                return <Users className="h-3 w-3" />
            case UserRole.SOLICITANTE:
                return <User className="h-3 w-3" />
            case UserRole.PACIENTE:
                return <Heart className="h-3 w-3" />
            default:
                return <User className="h-3 w-3" />
        }
    }

    const getRoleVariant = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMINISTRADOR:
                return "default" as const
            case UserRole.SOLICITANTE_REGULADO:
                return "secondary" as const
            case UserRole.SOLICITANTE:
                return "outline" as const
            case UserRole.PACIENTE:
                return "outline" as const
            default:
                return "outline" as const
        }
    }

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMINISTRADOR:
                return "bg-red-500 hover:bg-red-600"
            case UserRole.SOLICITANTE_REGULADO:
                return "bg-blue-500 hover:bg-blue-600"
            case UserRole.SOLICITANTE:
                return "bg-green-500 hover:bg-green-600"
            case UserRole.PACIENTE:
                return "bg-purple-500 hover:bg-purple-600"
            default:
                return ""
        }
    }

    return (
        <Badge
            variant={getRoleVariant(role)}
            className={`flex items-center gap-1 ${role === UserRole.ADMINISTRADOR ? getRoleColor(role) + " text-white" : ""}`}
        >
            {showIcon && getRoleIcon(role)}
            {ROLE_LABELS[role]}
        </Badge>
    )
}
