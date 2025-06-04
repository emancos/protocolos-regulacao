import { type NextRequest, NextResponse } from "next/server"
import { OneDriveService } from "@/lib/onedrive-service"

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json()

        if (action === "test-connection") {
            const result = await OneDriveService.testConnection()
            return NextResponse.json(result)
        }

        if (action === "test-folder") {
            // Criar uma pasta de teste
            const testProtocol = `TEST_${Date.now()}`
            const baseFolder = process.env.ONEDRIVE_BASE_FOLDER || "Protocolos"

            // Simular criação de pasta criando um arquivo de teste
            const testFile = new File(["Test content"], "test.txt", { type: "text/plain" })

            try {
                await OneDriveService.uploadImage(testFile, testProtocol)

                // Tentar deletar o arquivo de teste
                // Note: Isso pode falhar se não conseguirmos obter o ID, mas não é crítico

                return NextResponse.json({
                    success: true,
                    message: `Pasta de teste criada com sucesso: ${baseFolder}/${testProtocol}`,
                })
            } catch (error) {
                return NextResponse.json({
                    success: false,
                    message: error instanceof Error ? error.message : "Erro ao criar pasta de teste",
                })
            }
        }

        if (action === "list-items") {
            const { path } = await request.json()
            const result = await OneDriveService.listDriveItems(path)
            return NextResponse.json(result)
        }

        return NextResponse.json({ success: false, message: "Ação não reconhecida" }, { status: 400 })
    } catch (error) {
        console.error("❌ Test error:", error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Erro interno do servidor",
            },
            { status: 500 },
        )
    }
}
