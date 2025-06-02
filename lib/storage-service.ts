import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"

export class StorageService {
    private static readonly REQUISITIONS_PATH = "requisitions"

    static async uploadImage(file: File, requisitionId: string): Promise<string> {
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `${this.REQUISITIONS_PATH}/${requisitionId}/${fileName}`
        const storageRef = ref(storage, filePath)

        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)

        return downloadURL
    }

    static async uploadMultipleImages(files: File[], requisitionId: string): Promise<string[]> {
        const uploadPromises = files.map((file) => this.uploadImage(file, requisitionId))
        return Promise.all(uploadPromises)
    }

    static async deleteImage(imageUrl: string): Promise<void> {
        try {
            const imageRef = ref(storage, imageUrl)
            await deleteObject(imageRef)
        } catch (error) {
            console.error("Erro ao deletar imagem:", error)
            // Não propagar o erro para não quebrar o fluxo
        }
    }

    static async deleteMultipleImages(imageUrls: string[]): Promise<void> {
        const deletePromises = imageUrls.map((url) => this.deleteImage(url))
        await Promise.allSettled(deletePromises)
    }
}
