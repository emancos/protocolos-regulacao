"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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

    const loadUserProfile = useCallback(async () => {
        if (!user) {
            setUserProfile(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // Primeiro, tenta carregar o perfil existente
            let profile = await UserService.getUserProfile(user.uid)

            if (!profile) {

                await UserService.createUserProfile(
                    user.uid,
                    user.email || "",
                    user.displayName || "",
                    UserRole.PACIENTE,
                    "system",
                )

                // Recarrega o perfil após criar
                profile = await UserService.getUserProfile(user.uid)
            }

            setUserProfile(profile)
        } catch (error) {
            console.error("Erro ao carregar perfil do usuário:", error)
            setUserProfile(null)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        loadUserProfile()
    }, [loadUserProfile])

    const hasPermission = useCallback(
        (permission: keyof (typeof ROLE_PERMISSIONS)[UserRole]): boolean => {
            if (!userProfile) return false
            return ROLE_PERMISSIONS[userProfile.role][permission]
        },
        [userProfile],
    )

    const isRole = useCallback(
        (role: UserRole): boolean => {
            return userProfile?.role === role
        },
        [userProfile],
    )

    const refreshProfile = useCallback(async () => {
        await loadUserProfile()
    }, [loadUserProfile])

    const value = {
        userProfile,
        loading,
        hasPermission,
        isRole,
        refreshProfile,
    }

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
