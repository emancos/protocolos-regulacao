/* eslint-disable @typescript-eslint/no-explicit-any */
interface OneDriveAuthResponse {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token?: string
}

interface OneDriveUploadResponse {
    id: string
    name: string
    webUrl: string
    downloadUrl: string
    "@microsoft.graph.downloadUrl"?: string
    publicUrl?: string
}

interface OneDriveFolder {
    id: string
    name: string
    webUrl: string
}

export class OneDriveService {
    private static readonly GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"
    private static readonly AUTH_URL = "https://login.microsoftonline.com"

    private static async getAccessToken(): Promise<string> {
        const clientId = process.env.MICROSOFT_CLIENT_ID
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
        const refreshToken = process.env.MICROSOFT_REFRESH_TOKEN

        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error("Microsoft credentials not configured. Missing CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN")
        }

        const tokenUrl = `${this.AUTH_URL}/consumers/oauth2/v2.0/token`

        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
            scope: "https://graph.microsoft.com/Files.ReadWrite offline_access",
        })

        console.log("🔄 Requesting new access token...")

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        })

        if (!response.ok) {
            const error = await response.text()
            console.error("❌ Token refresh failed:", error)
            throw new Error(`Failed to get access token: ${error}`)
        }

        const data: OneDriveAuthResponse = await response.json()
        console.log("✅ Access token obtained successfully")
        return data.access_token
    }

    private static async createFolderIfNotExists(accessToken: string, folderPath: string): Promise<OneDriveFolder> {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        }

        console.log(`📁 Creating folder structure: ${folderPath}`)

        // Dividir o caminho em partes
        const pathParts = folderPath.split("/").filter((part) => part.length > 0)
        let currentPath = ""
        let currentParentId = "root"

        // Criar cada parte do caminho sequencialmente
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i]
            currentPath = currentPath ? `${currentPath}/${part}` : part

            console.log(`📂 Processing folder: ${part} (path: ${currentPath})`)

            try {
                // Primeiro, tentar encontrar a pasta
                const searchUrl = `${this.GRAPH_API_BASE}/me/drive/root:/${currentPath}`
                const searchResponse = await fetch(searchUrl, { headers })

                if (searchResponse.ok) {
                    const folder = await searchResponse.json()
                    currentParentId = folder.id
                    console.log(`✅ Found existing folder: ${part} (ID: ${folder.id})`)
                    continue
                }

                if (searchResponse.status !== 404) {
                    const error = await searchResponse.text()
                    console.error(`❌ Error checking folder ${part}:`, error)
                    throw new Error(`Error checking folder ${part}: ${error}`)
                }
            } catch (error) {
                console.log(`📂 Folder ${part} not found, will create it ${error}`)
            }

            // Se chegou aqui, a pasta não existe - vamos criar
            console.log(`📁 Creating folder: ${part} in parent ID: ${currentParentId}`)

            const createUrl = `${this.GRAPH_API_BASE}/me/drive/items/${currentParentId}/children`
            const createResponse = await fetch(createUrl, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: part,
                    folder: {},
                    "@microsoft.graph.conflictBehavior": "replace", // Substituir se existir
                }),
            })

            if (!createResponse.ok) {
                const error = await createResponse.text()
                console.error(`❌ Failed to create folder ${part}:`, error)
                throw new Error(`Failed to create folder ${part}: ${error}`)
            }

            const newFolder = await createResponse.json()
            currentParentId = newFolder.id
            console.log(`✅ Created folder: ${part} (ID: ${newFolder.id})`)
        }

        // Retornar a pasta final
        const finalUrl = `${this.GRAPH_API_BASE}/me/drive/items/${currentParentId}`
        const finalResponse = await fetch(finalUrl, { headers })

        if (!finalResponse.ok) {
            const error = await finalResponse.text()
            throw new Error(`Failed to get final folder: ${error}`)
        }

        const finalFolder = await finalResponse.json()
        console.log(`✅ Final folder ready: ${finalFolder.name} (ID: ${finalFolder.id})`)
        return finalFolder
    }

    static async uploadImage(file: File, protocol: string): Promise<OneDriveUploadResponse> {
        const accessToken = await this.getAccessToken()
        const baseFolder = process.env.ONEDRIVE_BASE_FOLDER || "Protocolos"
        const folderPath = `${baseFolder}/${protocol}`.replace(/^\/+/, "") // Remove barras iniciais

        console.log(`📁 Target folder path: ${folderPath}`)

        // Criar pasta se não existir
        const folder = await this.createFolderIfNotExists(accessToken, folderPath)

        // Gerar nome único para o arquivo
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

        console.log(`📤 Uploading file: ${fileName} to folder ID: ${folder.id}`)

        // Upload do arquivo diretamente na pasta usando o ID
        const uploadUrl = `${this.GRAPH_API_BASE}/me/drive/items/${folder.id}:/${fileName}:/content`

        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": file.type,
            },
            body: file,
        })

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text()
            console.error(`❌ Upload failed:`, error)
            throw new Error(`Failed to upload file: ${error}`)
        }

        const uploadResult = await uploadResponse.json()
        console.log(`✅ File uploaded successfully: ${uploadResult.name}`)

        // Tentar criar link público
        try {
            const shareUrl = `${this.GRAPH_API_BASE}/me/drive/items/${uploadResult.id}/createLink`
            const shareResponse = await fetch(shareUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "view",
                    scope: "anonymous",
                }),
            })

            if (shareResponse.ok) {
                const shareResult = await shareResponse.json()
                uploadResult.publicUrl = shareResult.link.webUrl
                console.log(`✅ Public link created: ${shareResult.link.webUrl}`)
            } else {
                console.warn("⚠️ Failed to create public link, using direct download URL")
            }
        } catch (error) {
            console.warn("⚠️ Error creating public link:", error)
        }

        return {
            id: uploadResult.id,
            name: uploadResult.name,
            webUrl: uploadResult.webUrl,
            downloadUrl: uploadResult["@microsoft.graph.downloadUrl"] || uploadResult.webUrl,
            "@microsoft.graph.downloadUrl": uploadResult["@microsoft.graph.downloadUrl"],
            publicUrl: uploadResult.publicUrl,
        }
    }

    static async uploadMultipleImages(files: File[], protocol: string): Promise<OneDriveUploadResponse[]> {
        console.log(`📤 Starting upload of ${files.length} files for protocol: ${protocol}`)

        // Upload sequencial para evitar problemas de concorrência
        const results: OneDriveUploadResponse[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name}`)

            try {
                const result = await this.uploadImage(file, protocol)
                results.push(result)
                console.log(`✅ File ${i + 1}/${files.length} uploaded successfully`)
            } catch (error) {
                console.error(`❌ Failed to upload file ${i + 1}/${files.length}:`, error)
                throw error // Parar no primeiro erro
            }
        }

        console.log(`✅ All ${files.length} files uploaded successfully`)
        return results
    }

    static async deleteImage(fileId: string): Promise<void> {
        const accessToken = await this.getAccessToken()

        const deleteUrl = `${this.GRAPH_API_BASE}/me/drive/items/${fileId}`
        const response = await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok && response.status !== 404) {
            const error = await response.text()
            throw new Error(`Failed to delete file: ${error}`)
        }

        console.log(`✅ File deleted successfully: ${fileId}`)
    }

    static async deleteMultipleImages(fileIds: string[]): Promise<void> {
        const deletePromises = fileIds.map((id) => this.deleteImage(id))
        await Promise.allSettled(deletePromises)
    }

    // Método para listar itens do drive
    static async listDriveItems(path = ""): Promise<{ success: boolean; items?: any[]; message: string }> {
        try {
            const accessToken = await this.getAccessToken()

            // Se não há caminho, listar a raiz
            const listUrl = path
                ? `${this.GRAPH_API_BASE}/me/drive/root:/${path}:/children`
                : `${this.GRAPH_API_BASE}/me/drive/root/children`

            console.log(`📂 Listing items at: ${path || "root"}`)

            const response = await fetch(listUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) {
                const error = await response.text()
                return {
                    success: false,
                    message: `Failed to list items: ${error}`,
                }
            }

            const result = await response.json()
            const items = result.value || []

            console.log(`📂 Found ${items.length} items`)

            return {
                success: true,
                items: items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    type: item.folder ? "folder" : "file",
                    size: item.size,
                    createdDateTime: item.createdDateTime,
                    lastModifiedDateTime: item.lastModifiedDateTime,
                    webUrl: item.webUrl,
                    downloadUrl: item["@microsoft.graph.downloadUrl"],
                })),
                message: `Found ${items.length} items in ${path || "root"}`,
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            }
        }
    }

    // Método para testar a conexão
    static async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const accessToken = await this.getAccessToken()

            // Testar acesso ao drive
            const testUrl = `${this.GRAPH_API_BASE}/me/drive`
            const response = await fetch(testUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) {
                const error = await response.text()
                return { success: false, message: `Drive access failed: ${error}` }
            }

            const driveInfo = await response.json()
            return {
                success: true,
                message: `Connected to OneDrive: ${driveInfo.owner?.user?.displayName || "Unknown"} (${driveInfo.driveType})`,
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            }
        }
    }

    static async getFileParentId(fileId: string, accessToken?: string): Promise<string | null> {
        const token = accessToken || await this.getAccessToken();
        const url = `${this.GRAPH_API_BASE}/me/drive/items/${fileId}?$select=parentReference`;

        console.log(`🔎 Getting parent folder ID for file: ${fileId}`);
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            console.error(`❌ Failed to get file metadata for ${fileId}`);
            // Não lançar um erro, pois o arquivo pode já ter sido excluído.
            return null;
        }

        const data = await response.json();
        // A pasta raiz não tem um 'id' em parentReference, mas sim em 'path'.
        // Retornamos o id apenas se ele existir, indicando que não é a raiz.
        return data.parentReference?.id || null;
    }
    
    static async listFolderChildren(folderId: string, accessToken?: string): Promise<any[]> {
        const token = accessToken || await this.getAccessToken();
        const url = `${this.GRAPH_API_BASE}/me/drive/items/${folderId}/children?$select=id`;

        console.log(`🔎 Listing children for folder: ${folderId}`);
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            console.error(`❌ Failed to list children for folder ${folderId}`);
            // Retorna um array não vazio para evitar a exclusão em caso de erro
            return [{}];
        }

        const data = await response.json();
        return data.value || [];
    }
}
