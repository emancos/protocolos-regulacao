"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileImage, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

import Image from "next/image";

const FieldError = ({ messages }: { messages?: string[] }) => {
    if (!messages || messages.length === 0) {
        return null;
    }
    return <p className="text-sm font-medium text-destructive mt-2">{messages[0]}</p>;
};

interface ImageFile {
    id: string
    file?: File
    preview?: string
    name: string
    size: number
    url?: string
    uploaded?: boolean
    uploading?: boolean
    deleting?: boolean;
    error?: string;
    oneDriveId?: string;
}

interface ImageUploadProps {
    images: ImageFile[]
    onChange: (images: ImageFile[]) => void
    protocol?: string
    maxImages?: number
    maxSizePerImage?: number // em 
    submissionError?: string[]
}

export function ImageUpload({ images, onChange, protocol, maxImages = 10, maxSizePerImage = 10, submissionError, }: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState("")
    const [uploading, setUploading] = useState(false)
    const [lastProtocol, setLastProtocol] = useState<string | undefined>(undefined)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadImages = useCallback(async (imagesToUpload: ImageFile[], allImages: ImageFile[]) => {
        if (!protocol) {
            setError("Protocolo é necessário para fazer upload")
            return
        }

        // Verificar se alguma das imagens já está sendo enviada
        const alreadyUploading = imagesToUpload.some((img) => img.uploading)
        if (alreadyUploading) {
            console.log("⚠️ Some images are already uploading, skipping duplicate upload")
            return
        }

        console.log(`📤 Starting upload of ${imagesToUpload.length} images for protocol: ${protocol}`)
        setUploading(true)

        try {
            // Marcar imagens como "uploading"
            const updatedImages = allImages.map((img) =>
                imagesToUpload.some((upload) => upload.id === img.id) ? { ...img, uploading: true, error: undefined } : img,
            )
            onChange(updatedImages)

            const formData = new FormData()
            imagesToUpload.forEach((img) => {
                if (img.file) {
                    const newFileName = `${img.id}___${img.file.name}`
                    formData.append("files", img.file, newFileName)
                    console.log(`📎 Added file to form data with unique name: ${newFileName}`)
                }
            })
            formData.append("protocol", protocol)

            console.log(`📤 Sending ${imagesToUpload.length} file(s) to /api/upload...`)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const responseText = await response.text()
            console.log("📥 Upload response status:", response.status)
            console.log("📥 Upload response body:", responseText.substring(0, 500))

            if (!response.ok) {
                let errorMessage = "Erro no upload"
                try {
                    const errorData = JSON.parse(responseText)
                    errorMessage = errorData.error || errorMessage
                } catch {
                    errorMessage = responseText || errorMessage
                }
                throw new Error(errorMessage)
            }

            const result = JSON.parse(responseText)

            if (!result.success || !result.files) {
                throw new Error("Resposta inválida do servidor")
            }

            console.log("✅ Upload successful, received files:", result.files)

            const finalImages = allImages.map((img) => {
                // A resposta da API agora inclui o 'clientId'
                const uploadedFile = result.files.find((f: { clientId: string }) => f.clientId === img.id)

                if (uploadedFile) {
                    console.log(`✅ Mapping uploaded file: ${uploadedFile.name} -> ${img.name}`)

                    if (img.preview) {
                        URL.revokeObjectURL(img.preview)
                    }

                    return {
                        ...img,
                        url: uploadedFile.url,
                        uploaded: true,
                        uploading: false,
                        preview: undefined,
                        file: undefined,
                        oneDriveId: uploadedFile.oneDriveId,
                    }
                }
                return img
            })

            onChange(finalImages)
            setError("")

            const uploadedCount = finalImages.filter((img) => img.uploaded).length
            console.log(`✅ Upload completed. Total uploaded images: ${uploadedCount}`)
        } catch (error) {
            console.error("❌ Upload error:", error)

            // Marcar imagens com erro
            const errorImages = allImages.map((img) =>
                imagesToUpload.some((upload) => upload.id === img.id)
                    ? { ...img, uploading: false, error: error instanceof Error ? error.message : "Erro no upload" }
                    : img,
            )
            onChange(errorImages)

            setError(error instanceof Error ? error.message : "Erro no upload das imagens")
        } finally {
            setUploading(false)
        }
    }, [protocol, onChange, setError]);

    // Upload automático apenas quando protocolo muda (não quando é definido pela primeira vez)
    useEffect(() => {
        if (protocol && protocol !== lastProtocol && lastProtocol !== undefined) {
            const pendingImages = images.filter((img) => img.file && !img.uploaded && !img.uploading && !img.error)
            if (pendingImages.length > 0) {
                console.log(
                    `🔄 Protocol changed from "${lastProtocol}" to "${protocol}", auto-uploading ${pendingImages.length} pending images`,
                )
                uploadImages(pendingImages, images)
            }
        }
        setLastProtocol(protocol)
    }, [protocol, images, lastProtocol, uploadImages])

    const handleFiles = async (files: FileList | null) => {
        if (!files) return

        setError("")
        const newImages: ImageFile[] = []
        const maxSizeBytes = maxSizePerImage * 1024 * 1024

        Array.from(files).forEach((file) => {
            // Verificar se é uma imagem
            if (!file.type.startsWith("image/")) {
                setError("Apenas arquivos de imagem são permitidos")
                return
            }

            // Verificar tamanho do arquivo
            if (file.size > maxSizeBytes) {
                setError(`Arquivo ${file.name} é muito grande. Máximo ${maxSizePerImage}MB por imagem`)
                return
            }

            // Verificar se já existe
            if (images.some((img) => img.name === file.name && img.size === file.size)) {
                return
            }

            // Criar preview
            const preview = URL.createObjectURL(file)
            const imageFile: ImageFile = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                file,
                preview,
                name: file.name,
                size: file.size,
                uploaded: false,
                uploading: false,
            }

            newImages.push(imageFile)
        })

        // Verificar limite total
        const totalImages = images.length + newImages.length
        if (totalImages > maxImages) {
            setError(`Máximo de ${maxImages} imagens permitidas`)
            return
        }

        const updatedImages = [...images, ...newImages]
        onChange(updatedImages)

        console.log(`📁 Added ${newImages.length} new images. Protocol: ${protocol || "not set"}`)

        // NÃO fazer upload automático aqui - apenas quando o usuário clicar no botão manual
        // ou quando o protocolo for definido pela primeira vez
        if (protocol && newImages.length > 0) {
            console.log(`🚀 Protocol is set (${protocol}), starting auto-upload for ${newImages.length} new images`)
            await uploadImages(newImages, updatedImages)
        } else if (!protocol) {
            console.log("⏳ Protocol not set, upload will happen when protocol is available")
        }
    }

    const removeImage = async (id: string) => {
        const imageToRemove = images.find((img) => img.id === id);
        if (!imageToRemove) return;

        // Se o arquivo não foi enviado para o OneDrive, apenas remova-o localmente.
        if (!imageToRemove.uploaded || !imageToRemove.oneDriveId) {
            if (imageToRemove.preview) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
            onChange(images.filter((img) => img.id !== id));
            return;
        }

        // Se o arquivo está no OneDrive, chame a API para deletá-lo.
        // 1. Marcar a imagem como "deleting" para dar feedback visual
        onChange(images.map((img) => (img.id === id ? { ...img, deleting: true } : img)));

        try {
            const response = await fetch("/api/upload", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ oneDriveId: imageToRemove.oneDriveId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha ao deletar a imagem do OneDrive.");
            }

            // 2. Se a API retornou sucesso, remova a imagem da lista local.
            onChange(images.filter((img) => img.id !== id));

        } catch (error) {
            console.error("Delete error:", error);
            setError(error instanceof Error ? error.message : "Erro desconhecido.");

            // 3. Se deu erro, reverter o estado "deleting"
            onChange(images.map((img) => (img.id === id ? { ...img, deleting: false } : img)));
        }
    };

    const retryUpload = async (imageId: string) => {
        const imageToRetry = images.find((img) => img.id === imageId)
        if (imageToRetry && imageToRetry.file) {
            console.log(`🔄 Retrying upload for: ${imageToRetry.name}`)
            await uploadImages([imageToRetry], images)
        }
    }

    const uploadAllPending = async () => {
        const pendingImages = images.filter((img) => img.file && !img.uploaded && !img.uploading && !img.error)
        if (pendingImages.length > 0 && protocol) {
            console.log(`🔄 Manual upload of ${pendingImages.length} pending images`)
            await uploadImages(pendingImages, images)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        handleFiles(e.dataTransfer.files)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    // Estatísticas das imagens
    const uploadedCount = images.filter((img) => img.uploaded).length
    const uploadingCount = images.filter((img) => img.uploading).length
    const errorCount = images.filter((img) => img.error).length
    const pendingCount = images.filter((img) => img.file && !img.uploaded && !img.uploading && !img.error).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Anexar Imagens</h3>
                <div className="flex items-center space-x-2">
                    {images.length > 0 && (
                        <span className="text-sm text-gray-500">
                            {images.length}/{maxImages} imagem(ns)
                        </span>
                    )}
                    {protocol && (
                        <span className="text-xs text-white-600 bg-blue-800 px-2 py-1 font-semibold rounded">
                            📁 {process.env.NEXT_PUBLIC_ONEDRIVE_BASE_FOLDER || "Protocolos"}/{protocol}

                        </span>
                    )}
                </div>
                
            </div>           
            
            <FieldError messages={submissionError} />
            
            {/* Status das imagens */}
            {images.length > 0 && (
                <div className="flex items-center space-x-4 text-sm">
                    {uploadedCount > 0 && <span className="text-green-600">✅ {uploadedCount} enviada(s)</span>}
                    {uploadingCount > 0 && <span className="text-blue-600">🔄 {uploadingCount} enviando...</span>}
                    {pendingCount > 0 && <span className="text-yellow-600">⏳ {pendingCount} pendente(s)</span>}
                    {errorCount > 0 && <span className="text-red-600">❌ {errorCount} com erro</span>}
                </div>
            )}

            {/* Botão de upload manual para imagens pendentes */}
            {pendingCount > 0 && protocol && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Há {pendingCount} imagem(ns) aguardando upload</span>
                        <Button onClick={uploadAllPending} disabled={uploading} size="sm">
                            {uploading ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Agora"
                            )}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Área de upload */}
            <Card>
                <CardContent className="p-6">
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                            dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600",
                            (images.length >= maxImages || uploading) && "opacity-50 pointer-events-none",
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                            disabled={images.length >= maxImages || uploading}
                        />

                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 text-gray-400">
                                <Upload className="w-full h-full" />
                            </div>

                            <div>
                                <p className="text-lg font-medium">
                                    {uploading ? "Fazendo upload..." : "Arraste imagens aqui ou clique para selecionar"}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Máximo {maxImages} imagens, {maxSizePerImage}MB cada
                                    {protocol && ` - Salvo em: ${process.env.NEXT_PUBLIC_ONEDRIVE_BASE_FOLDER || "Protocolos"}/${protocol}`}
                                    {!protocol && " - Defina o protocolo primeiro"}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={images.length >= maxImages || uploading}
                            >
                                <FileImage className="w-4 h-4 mr-2" />
                                {uploading ? "Fazendo upload..." : "Selecionar Imagens"}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Preview das imagens */}
            {images.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Imagens Selecionadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((image) => (
                                <div key={image.id} className="relative group">
                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <Image
                                            src={image.url || image.preview || "/placeholder.svg"}
                                            alt={image.name}
                                            fill // Faz a imagem preencher o contêiner pai
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" // melhora a performance
                                            className={cn(
                                                "object-cover transition-all group-hover:scale-105",
                                                image.deleting && "opacity-50 blur-sm",
                                            )}
                                        />

                                        {/* Status overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {image.uploading && (
                                                <div className="bg-black bg-opacity-50 rounded-full p-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                            {image.uploaded && (
                                                <div className="bg-green-500 bg-opacity-80 rounded-full p-1 absolute top-2 right-2">
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            {image.error && (
                                                <div className="bg-red-500 bg-opacity-80 rounded-full p-1 absolute top-2 right-2">
                                                    <AlertCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            {image.deleting && (
                                                <div className="bg-black bg-opacity-50 rounded-full p-2">
                                                    {/* Spinner (o mesmo do upload) */}
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botão de remover */}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeImage(image.id)}
                                        disabled={image.uploading || image.deleting}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>

                                    {/* Informações do arquivo */}
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium truncate" title={image.name}>
                                            {image.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                                        {image.error && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-red-500">{image.error}</p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={() => retryUpload(image.id)}
                                                >
                                                    Tentar novamente
                                                </Button>
                                            </div>
                                        )}
                                        {image.uploaded && <p className="text-xs text-green-600">✓ Salvo no OneDrive</p>}
                                        {image.file && !image.uploaded && !image.uploading && !image.error && (
                                            <p className="text-xs text-yellow-600">⏳ Aguardando upload</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
