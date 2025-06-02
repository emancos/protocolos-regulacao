"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageFile {
    id: string
    file: File
    preview: string
    name: string
    size: number
}

interface ImageUploadProps {
    images: ImageFile[]
    onChange: (images: ImageFile[]) => void
    maxImages?: number
    maxSizePerImage?: number // em MB
}

export function ImageUpload({ images, onChange, maxImages = 10, maxSizePerImage = 5 }: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFiles = (files: FileList | null) => {
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
            }

            newImages.push(imageFile)
        })

        // Verificar limite total
        const totalImages = images.length + newImages.length
        if (totalImages > maxImages) {
            setError(`Máximo de ${maxImages} imagens permitidas`)
            return
        }

        onChange([...images, ...newImages])
    }

    const removeImage = (id: string) => {
        const imageToRemove = images.find((img) => img.id === id)
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.preview)
        }
        onChange(images.filter((img) => img.id !== id))
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Anexar Imagens</h3>
                {images.length > 0 && (
                    <span className="text-sm text-gray-500">
                        {images.length}/{maxImages} imagem(ns)
                    </span>
                )}
            </div>

            {/* Área de upload */}
            <Card>
                <CardContent className="p-6">
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                            dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600",
                            images.length >= maxImages && "opacity-50 pointer-events-none",
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
                            disabled={images.length >= maxImages}
                        />

                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 text-gray-400">
                                <Upload className="w-full h-full" />
                            </div>

                            <div>
                                <p className="text-lg font-medium">Arraste imagens aqui ou clique para selecionar</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Máximo {maxImages} imagens, {maxSizePerImage}MB cada
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={images.length >= maxImages}
                            >
                                <FileImage className="w-4 h-4 mr-2" />
                                Selecionar Imagens
                            </Button>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
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
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={image.preview || "/placeholder.svg"}
                                            alt={image.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Botão de remover */}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeImage(image.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>

                                    {/* Informações do arquivo */}
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium truncate" title={image.name}>
                                            {image.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
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
