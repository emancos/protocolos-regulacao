import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { type UserProfile, UserRole } from "@/types/user"

export class UserService {
    private static readonly COLLECTION = "users"

    static async createUserProfile(
        uid: string,
        email: string,
        displayName: string,
        role: UserRole,
        createdBy?: string,
        additionalInfo?: UserProfile["additionalInfo"],
    ): Promise<void> {
        const userProfile: UserProfile = {
            uid,
            email,
            displayName,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
            isActive: true,
            additionalInfo,
        }

        await setDoc(doc(db, this.COLLECTION, uid), userProfile)
    }

    static async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            console.log("Buscando perfil para UID:", uid)
            const docRef = doc(db, this.COLLECTION, uid)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data = docSnap.data()
                console.log("Dados encontrados:", data)

                return {
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
                } as UserProfile
            } else {
                console.log("Nenhum documento encontrado para UID:", uid)
                return null
            }
        } catch (error) {
            console.error("Erro ao buscar perfil do usuário:", error)
            return null
        }
    }

    static async updateUserRole(uid: string, newRole: UserRole, updatedBy: string): Promise<void> {
        const docRef = doc(db, this.COLLECTION, uid)
        await updateDoc(docRef, {
            role: newRole,
            updatedAt: new Date(),
            updatedBy,
        })
    }

    static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
        const docRef = doc(db, this.COLLECTION, uid)
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date(),
        })
    }

    static async getAllUsers(): Promise<UserProfile[]> {
        const q = query(collection(db, this.COLLECTION), orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as UserProfile
        })
    }

    static async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
        const q = query(collection(db, this.COLLECTION), where("role", "==", role), where("isActive", "==", true))

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as UserProfile
        })
    }

    static async checkIfFirstUser(): Promise<boolean> {
        const q = query(collection(db, this.COLLECTION), limit(1))
        const querySnapshot = await getDocs(q)
        return querySnapshot.empty
    }

    static async initializeFirstAdmin(uid: string, email: string, displayName: string): Promise<void> {
        const isFirstUser = await this.checkIfFirstUser()

        if (isFirstUser) {
            await this.createUserProfile(uid, email, displayName, UserRole.ADMINISTRADOR, "system", { telefone: "", cpf: "" })
        }
    }
}
