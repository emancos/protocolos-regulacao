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

        // Validar arquivos
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: `File ${file.name} is not an image` }, { status: 400 })
            }

            // Limite de 10MB por arquivo
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: `File ${file.name} is too large (max 10MB)` }, { status: 400 })
            }
        }

        console.log(`📤 Uploading ${files.length} file(s) to OneDrive...`)

        const uploadResults = await OneDriveService.uploadMultipleImages(files, protocol)

        console.log(`✅ Upload completed successfully!`)

        return NextResponse.json({
            success: true,
            files: uploadResults.map((result) => ({
                id: result.id,
                name: result.name,
                url: result.downloadUrl || result.webUrl,
                oneDriveId: result.id,
            })),
        })
    } catch (error) {
        console.error("❌ Upload error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to upload files",
            },
            { status: 500 },
        )
    }
}
