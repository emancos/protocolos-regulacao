import { type NextRequest, NextResponse } from "next/server"
import { LocalUploadService } from "@/lib/local-upload-service"
import path from "path"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const files = formData.getAll("files") as File[]
        const protocol = formData.get("protocol") as string

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "Nenhum arquivo fornecido" }, { status: 400 })
        }

        if (!protocol) {
            return NextResponse.json({ error: "Protocolo é obrigatório" }, { status: 400 })
        }

        // Validação dos arquivos
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: `Arquivo ${file.name} não é uma imagem` }, { status: 400 })
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB
                return NextResponse.json({ error: `Arquivo ${file.name} é muito grande (máx 10MB)` }, { status: 400 })
            }
        }

        const uploadResults = [];
        for (const file of files) {
            // O nome do arquivo no formData é "id___nomeoriginal.jpg"
            const [clientId, originalName] = file.name.split("___");
            // Recriamos o arquivo com o nome original para o serviço de upload
            const originalFile = new File([file], originalName, { type: file.type });

            const result = await LocalUploadService.saveFile(originalFile, protocol);

            uploadResults.push({
                name: path.basename(result.filePath), // Nome final salvo no disco
                url: result.publicUrl, // URL para acessar via API
                clientId: clientId, // Retornamos o ID do cliente para o front-end mapear
            });
        }

        return NextResponse.json({
            success: true,
            files: uploadResults,
        })

    } catch (error) {
        console.error("❌ Erro no upload local:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Falha ao enviar arquivos",
            },
            { status: 500 },
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // O corpo da requisição agora envia 'publicUrl'
        const { publicUrl } = await request.json();

        if (!publicUrl) {
            return NextResponse.json({ success: false, error: "A URL pública do arquivo é necessária" }, { status: 400 });
        }

        console.log(`🗑️ Recebida requisição para excluir arquivo: ${publicUrl}`);

        await LocalUploadService.deleteFile(publicUrl);

        return NextResponse.json({ success: true, message: "Arquivo excluído com sucesso" });

    } catch (error) {
        console.error("❌ Falha durante o processo de exclusão:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Falha ao excluir o arquivo",
            },
            { status: 500 },
        );
    }
}
