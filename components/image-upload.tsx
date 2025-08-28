"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileImage, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const FieldError = ({ messages }: { messages?: string[] }) => {
    if (!messages || messages.length === 0) return null;
    return <p className="text-sm font-medium text-destructive mt-2">{messages[0]}</p>;
};

// Interface interna do componente, sem oneDriveId
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
}

interface ImageUploadProps {
    images: ImageFile[]
    onChange: (images: ImageFile[]) => void
    protocol?: string
    maxImages?: number
    maxSizePerImage?: number // em MB
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

        const alreadyUploading = imagesToUpload.some((img) => img.uploading)
        if (alreadyUploading) {
            console.log("⚠️ Algumas imagens já estão sendo enviadas, pulando upload duplicado")
            return
        }

        setUploading(true)
        try {
            const updatedImages = allImages.map((img) =>
                imagesToUpload.some((upload) => upload.id === img.id) ? { ...img, uploading: true, error: undefined } : img,
            )
            onChange(updatedImages)

            const formData = new FormData()
            imagesToUpload.forEach((img) => {
                if (img.file) {
                    const newFileName = `${img.id}___${img.file.name}`
                    formData.append("files", img.file, newFileName)
                }
            })
            formData.append("protocol", protocol)

            const response = await fetch("/api/uploads", { method: "POST", body: formData })
            const result = await response.json()

            if (!response.ok) throw new Error(result.error || "Erro no upload")

            const finalImages = allImages.map((img) => {
                const uploadedFile = result.files.find((f: { clientId: string }) => f.clientId === img.id)
                if (uploadedFile) {
                    if (img.preview) URL.revokeObjectURL(img.preview)
                    return {
                        ...img,
                        url: uploadedFile.url,
                        uploaded: true,
                        uploading: false,
                        preview: undefined,
                        file: undefined,
                    }
                }
                return img
            })

            onChange(finalImages)
            setError("")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro no upload das imagens"
            setError(errorMessage)
            const errorImages = allImages.map((img) =>
                imagesToUpload.some((upload) => upload.id === img.id)
                    ? { ...img, uploading: false, error: errorMessage }
                    : img,
            )
            onChange(errorImages)
        } finally {
            setUploading(false)
        }
    }, [protocol, onChange]);

    useEffect(() => {
        if (protocol && protocol !== lastProtocol && lastProtocol !== undefined) {
            const pendingImages = images.filter((img) => img.file && !img.uploaded && !img.uploading && !img.error)
            if (pendingImages.length > 0) {
                uploadImages(pendingImages, images)
            }
        }
        setLastProtocol(protocol)
    }, [protocol, images, lastProtocol, uploadImages])

    const handleFiles = (files: FileList | null) => {
        if (!files) return
        setError("")
        const newImages: ImageFile[] = []
        const maxSizeBytes = maxSizePerImage * 1024 * 1024

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) {
                setError("Apenas arquivos de imagem são permitidos")
                return
            }
            if (file.size > maxSizeBytes) {
                setError(`Arquivo ${file.name} é muito grande. Máximo ${maxSizePerImage}MB por imagem`)
                return
            }
            if (images.some((img) => img.name === file.name && img.size === file.size)) return

            newImages.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                file,
                preview: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            })
        })

        if (images.length + newImages.length > maxImages) {
            setError(`Máximo de ${maxImages} imagens permitidas`)
            return
        }

        const updatedImages = [...images, ...newImages]
        onChange(updatedImages)

        if (protocol && newImages.length > 0) {
            uploadImages(newImages, updatedImages)
        }
    }

    const removeImage = async (id: string) => {
        const imageToRemove = images.find((img) => img.id === id);
        if (!imageToRemove) return;

        if (!imageToRemove.uploaded || !imageToRemove.url) {
            if (imageToRemove.preview) URL.revokeObjectURL(imageToRemove.preview);
            onChange(images.filter((img) => img.id !== id));
            return;
        }

        onChange(images.map((img) => (img.id === id ? { ...img, deleting: true } : img)));
        try {
            const response = await fetch("/api/uploads", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicUrl: imageToRemove.url }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha ao deletar a imagem.");
            }
            onChange(images.filter((img) => img.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido.");
            onChange(images.map((img) => (img.id === id ? { ...img, deleting: false } : img)));
        }
    };

    const retryUpload = (imageId: string) => {
        const imageToRetry = images.find((img) => img.id === imageId)
        if (imageToRetry?.file) {
            uploadImages([imageToRetry], images)
        }
    }

    const uploadAllPending = () => {
        const pendingImages = images.filter((img) => img.file && !img.uploaded && !img.uploading && !img.error)
        if (pendingImages.length > 0 && protocol) {
            uploadImages(pendingImages, images)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    const uploadedCount = images.filter((img) => img.uploaded).length;
    const uploadingCount = images.filter((img) => img.uploading).length;
    const errorCount = images.filter((img) => img.error).length;
    const pendingCount = images.length - uploadedCount - uploadingCount - errorCount;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Anexar Imagens</h3>
                {images.length > 0 && <span className="text-sm text-gray-500">{images.length}/{maxImages}</span>}
            </div>
            <FieldError messages={submissionError} />
            {images.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {uploadedCount > 0 && <span className="text-green-600">✅ {uploadedCount} enviada(s)</span>}
                    {uploadingCount > 0 && <span className="text-blue-600">🔄 {uploadingCount} enviando...</span>}
                    {pendingCount > 0 && <span className="text-yellow-600">⏳ {pendingCount} pendente(s)</span>}
                    {errorCount > 0 && <span className="text-red-600">❌ {errorCount} com erro</span>}
                </div>
            )}
            {pendingCount > 0 && protocol && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Há {pendingCount} imagem(ns) aguardando upload</span>
                        <Button onClick={uploadAllPending} disabled={uploading} size="sm">
                            {uploading ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Enviando...</> : "Enviar Agora"}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            <Card>
                <CardContent className="p-6">
                    <div
                        className={cn("border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                            dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600",
                            (images.length >= maxImages || uploading) && "opacity-50 pointer-events-none")}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" disabled={images.length >= maxImages || uploading} />
                        <div className="space-y-4">
                            <Upload className="mx-auto w-12 h-12 text-gray-400" />
                            <div>
                                <p className="text-lg font-medium">{uploading ? "Fazendo upload..." : "Arraste imagens aqui ou clique para selecionar"}</p>
                                <p className="text-sm text-gray-500 mt-1">Máximo {maxImages} imagens, {maxSizePerImage}MB cada</p>
                            </div>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={images.length >= maxImages || uploading}>
                                <FileImage className="w-4 h-4 mr-2" />
                                {uploading ? "Fazendo upload..." : "Selecionar Imagens"}
                            </Button>
                        </div>
                    </div>
                    {error && <Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                </CardContent>
            </Card>
            {images.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Imagens Selecionadas</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((image) => (
                                <div key={image.id} className="relative group">
                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <Image src={image.preview || image.url || "/placeholder.svg"} alt={image.name} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className={cn("object-cover transition-all group-hover:scale-105", image.deleting && "opacity-50 blur-sm")} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {image.uploading && <div className="bg-black bg-opacity-50 rounded-full p-2"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div></div>}
                                            {image.uploaded && <div className="bg-green-500 bg-opacity-80 rounded-full p-1 absolute top-2 right-2"><CheckCircle className="h-4 w-4 text-white" /></div>}
                                            {image.error && <div className="bg-red-500 bg-opacity-80 rounded-full p-1 absolute top-2 right-2"><AlertCircle className="h-4 w-4 text-white" /></div>}
                                            {image.deleting && <div className="bg-black bg-opacity-50 rounded-full p-2"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div></div>}
                                        </div>
                                    </div>
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(image.id)} disabled={image.uploading || image.deleting}><X className="h-3 w-3" /></Button>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium truncate" title={image.name}>{image.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                                        {image.error && <div className="space-y-1"><p className="text-xs text-red-500">{image.error}</p><Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => retryUpload(image.id)}>Tentar novamente</Button></div>}
                                        {image.uploaded && <p className="text-xs text-green-600">✓ Salvo</p>}
                                        {image.file && !image.uploaded && !image.uploading && !image.error && <p className="text-xs text-yellow-600">⏳ Aguardando upload</p>}
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
