"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { type UserProfile, UserRole, ROLE_PERMISSIONS } from "@/types/user"
import { UserService } from "@/lib/user-service"

interface UserContextType {
    userProfile: UserProfile | null
    loading: boolean
    hasPermission: (permission: keyof (typeof ROLE_PERMISSIONS)[UserRole]) => boolean
    isRole: (role: UserRole) => boolean
    refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType>({} as UserContextType)

export function useUser() {
    return useContext(UserContext)
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const loadUserProfile = async () => {
        if (!user) {
            setUserProfile(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // Verifica se é o primeiro usuário e o torna admin
            await UserService.initializeFirstAdmin(user.uid, user.email || "", user.displayName || "")

            // Carrega o perfil do usuário
            const profile = await UserService.getUserProfile(user.uid)

            if (!profile) {
                // Se não existe perfil, cria um como PACIENTE por padrão
                await UserService.createUserProfile(user.uid, user.email || "", user.displayName || "", UserRole.PACIENTE)

                const newProfile = await UserService.getUserProfile(user.uid)
                setUserProfile(newProfile)
            } else {
                setUserProfile(profile)
            }
        } catch (error) {
            console.error("Erro ao carregar perfil do usuário:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUserProfile()
    }, [user])

    const hasPermission = (permission: keyof (typeof ROLE_PERMISSIONS)[UserRole]): boolean => {
        if (!userProfile) return false
        return ROLE_PERMISSIONS[userProfile.role][permission]
    }

    const isRole = (role: UserRole): boolean => {
        return userProfile?.role === role
    }

    const refreshProfile = async () => {
        await loadUserProfile()
    }

    const value = {
        userProfile,
        loading,
        hasPermission,
        isRole,
        refreshProfile,
    }

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
