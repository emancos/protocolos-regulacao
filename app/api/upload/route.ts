import { type NextRequest, NextResponse } from "next/server"
import { OneDriveService } from "@/lib/onedrive-service"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const files = formData.getAll("files") as File[]
        const protocol = formData.get("protocol") as string

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 })
        }

        if (!protocol) {
            return NextResponse.json({ error: "Protocol is required" }, { status: 400 })
        }

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: `File ${file.name} is not an image` }, { status: 400 })
            }
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: `File ${file.name} is too large (max 10MB)` }, { status: 400 })
            }
        }

        // O array 'files' contém os arquivos com os nomes modificados (ex: "id___nomeoriginal.jpg")
        console.log(`📤 Handing off ${files.length} file(s) to OneDriveService...`)

        // A função uploadMultipleImages processa os arquivos em ordem.
        const uploadResults = await OneDriveService.uploadMultipleImages(files, protocol)

        console.log(`✅ Upload completed! Mapping results back to client IDs...`)

        // Mapear os resultados usando o índice do array, que está garantido ser o mesmo.
        const responseFiles = uploadResults.map((result, index) => {
            const originalFile = files[index]
            const [clientId] = originalFile.name.split("___") // Extrai o ID do cliente do nome original

            console.log(`Mapping result for "${result.name}" back to client ID "${clientId}"`)

            return {
                id: result.id, // ID do OneDrive
                name: result.name, // Nome final no OneDrive
                // Priorizar a publicUrl que você cria
                url: result.downloadUrl || result.publicUrl || result.webUrl,
                oneDriveId: result.id,
                clientId: clientId, // IMPORTANTE: Retornar o ID do cliente
            }
        })

        return NextResponse.json({
            success: true,
            files: responseFiles,
        })

    } catch (error) {
        console.error("❌ Upload error in API route:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to upload files",
            },
            { status: 500 },
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { oneDriveId } = await request.json();

        if (!oneDriveId) {
            return NextResponse.json({ success: false, error: "OneDrive file ID is required" }, { status: 400 });
        }

        console.log(`🗑️ Received request to delete file: ${oneDriveId}`);

        // 1. Obter o ID da pasta pai *antes* de deletar o arquivo
        const parentFolderId = await OneDriveService.getFileParentId(oneDriveId);

        // 2. Deletar a imagem
        await OneDriveService.deleteImage(oneDriveId);
        console.log(`✅ File ${oneDriveId} deleted from OneDrive.`);

        // 3. Se o arquivo estava dentro de uma pasta (e não na raiz)...
        if (parentFolderId) {
            console.log(`👀 Checking if parent folder ${parentFolderId} is empty...`);

            // 4. Listar os itens restantes na pasta
            const remainingItems = await OneDriveService.listFolderChildren(parentFolderId);

            // 5. Se a pasta estiver vazia, delete-a também
            if (remainingItems.length === 0) {
                console.log(`📂 Parent folder ${parentFolderId} is empty. Deleting it...`);
                // Usamos 'deleteImage' pois para a API, pastas são 'items' como arquivos.
                await OneDriveService.deleteImage(parentFolderId);
                console.log(`✅ Parent folder ${parentFolderId} deleted.`);
            } else {
                console.log(`➡️ Parent folder ${parentFolderId} is not empty, will not be deleted.`);
            }
        } else {
            console.log("➡️ File was in root or parent could not be determined. No folder to delete.");
        }

        return NextResponse.json({ success: true, message: "File deleted and folder checked successfully" });

    } catch (error) {
        console.error("❌ Failed during delete process:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete file",
            },
            { status: 500 },
        );
    }
}