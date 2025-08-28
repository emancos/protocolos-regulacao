import { promises as fs } from 'fs';
import path from 'path';

export class LocalUploadService {
    private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR;

    /**
     * Valida se o diretório de upload está configurado.
     * @private
     */
    private static validateUploadDir() {
        if (!this.UPLOAD_DIR) {
            console.error("❌ Variável de ambiente UPLOAD_DIR não está definida.");
            throw new Error("O diretório de upload não está configurado no servidor.");
        }
    }

    /**
     * Salva um único arquivo no disco local dentro de uma pasta de protocolo.
     * @param file - O arquivo a ser salvo.
     * @param protocol - O número do protocolo para criar a subpasta.
     * @returns Um objeto com o caminho do arquivo e a URL pública.
     */
    static async saveFile(file: File, protocol: string): Promise<{ filePath: string; publicUrl: string }> {
        this.validateUploadDir();

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define o caminho do diretório do protocolo
        const protocolDir = path.join(this.UPLOAD_DIR!, protocol);
        
        // Garante que o diretório do protocolo exista
        await fs.mkdir(protocolDir, { recursive: true });

        // Gera um nome de arquivo único para evitar colisões
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}_${file.name.replace(/\s/g, '_')}`;
        const filePath = path.join(protocolDir, uniqueFileName);

        // Escreve o arquivo no disco
        await fs.writeFile(filePath, buffer);
        console.log(`✅ Arquivo salvo em: ${filePath}`);

        // Gera a URL pública para acessar o arquivo através da nossa API
        const publicUrl = `/api/uploads/${protocol}/${uniqueFileName}`;

        return { filePath, publicUrl };
    }

    /**
     * Exclui um arquivo do disco local.
     * @param publicUrl - A URL pública do arquivo a ser excluído.
     */
    static async deleteFile(publicUrl: string): Promise<void> {
        this.validateUploadDir();
        
        try {
            // Extrai o caminho relativo da URL pública
            const relativePath = publicUrl.replace('/api/uploads/', '');
            const filePath = path.join(this.UPLOAD_DIR!, relativePath);

            // Verifica se o arquivo existe antes de tentar excluir
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`🗑️ Arquivo excluído: ${filePath}`);

            // Opcional: Verificar se a pasta do protocolo está vazia e excluí-la
            const protocolDir = path.dirname(filePath);
            const files = await fs.readdir(protocolDir);
            if (files.length === 0) {
                await fs.rmdir(protocolDir);
                console.log(`📂 Pasta vazia excluída: ${protocolDir}`);
            }
        } catch (error) {
            // Ignora o erro se o arquivo não existir (pode já ter sido excluído)
            if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
                console.error(`❌ Erro ao excluir o arquivo ${publicUrl}:`, error);
                throw new Error("Não foi possível excluir o arquivo.");
            }
        }
    }
}
