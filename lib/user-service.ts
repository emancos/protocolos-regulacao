import { initializeApp, deleteApp, FirebaseError } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { collection, doc, getDoc, setDoc, updateDoc, query, getDocs, orderBy } from "firebase/firestore"
import { db, firebaseConfig } from "@/lib/firebase"
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

    static async createNewAuthUserAndProfile(
        { email, password, displayName, role, additionalInfo }: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'> & { password?: string },
        adminUid: string
    ): Promise<void> {
        if (!password) {
            throw new Error("A senha é obrigatória para criar um novo utilizador.");
        }

        const tempAppName = `temp-app-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUserUid = userCredential.user.uid;
            await this.createUserProfile(newUserUid, email, displayName, role, adminUid, additionalInfo);
        } catch (error) {
            console.error("Erro ao criar novo utilizador:", error);
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        throw new Error('Este email já está em uso.');
                    case 'auth/weak-password':
                        throw new Error('A senha deve ter pelo menos 6 caracteres.');
                    case 'auth/invalid-email':
                        throw new Error('O formato do email é inválido.');
                    default:
                        throw new Error('Ocorreu um erro de autenticação. Por favor, tente novamente.');
                }
            }
            throw new Error('Não foi possível criar o utilizador devido a um erro inesperado.');
        } finally {
            await deleteApp(tempApp);
        }
    }

    static async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const docRef = doc(db, this.COLLECTION, uid)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data = docSnap.data()
                return {
                    uid: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
                } as UserProfile
            } else {
                return null
            }
        } catch (error) {
            console.error("Erro ao buscar perfil do utilizador:", error)
            return null
        }
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
                uid: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as UserProfile
        })
    }
}
