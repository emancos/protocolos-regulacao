/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from 'fs';
import path from 'path';
import { type NextRequest, NextResponse } from 'next/server';
import mime from 'mime-types';

export async function GET(req: NextRequest, context: any) {
    // Usamos uma asserção de tipo aqui para manter a segurança dentro da função
    const params = context.params as { path: string[] };
    const uploadDir = process.env.UPLOAD_DIR;

    if (!uploadDir) {
        console.error("Variável de ambiente UPLOAD_DIR não está definida.");
        return new NextResponse("Diretório de upload não configurado.", { status: 500 });
    }

    try {
        // Junta as partes do caminho recebidas na URL para formar o caminho do arquivo
        const filePath = path.join(uploadDir, ...params.path);

        // Medida de segurança: Garante que o caminho resolvido do arquivo está dentro do diretório de uploads permitido
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
            return new NextResponse("Acesso negado.", { status: 403 });
        }

        // Lê o arquivo do disco como um Buffer
        const fileBuffer = await fs.readFile(filePath);

        // Determina o tipo de conteúdo (MIME type) com base na extensão do arquivo
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';

        // Cria um Uint8Array a partir do Buffer para garantir a compatibilidade de tipo.
        const uint8Array = new Uint8Array(fileBuffer);

        return new NextResponse(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        // Trata o erro comum de "arquivo não encontrado"
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            console.log(`Arquivo não encontrado: ${params.path.join('/')}`);
            return new NextResponse("Arquivo não encontrado.", { status: 404 });
        }
        console.error("Erro ao servir o arquivo:", error);
        return new NextResponse("Erro interno ao buscar o arquivo.", { status: 500 });
    }
}
