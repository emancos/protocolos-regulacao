"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageIcon } from "lucide-react" // Um ícone para o fallback

interface ImageWithFallbackProps {
    src: string | null | undefined
    alt: string
    className?: string
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false)

    const effectiveSrc = src || "/placeholder.svg"

    // Se a imagem der erro ou não tiver um 'src' válido, mostre o fallback.
    if (hasError || !src) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
        )
    }

    return (
        <Image
            src={effectiveSrc}
            alt={alt}
            fill // "fill" faz a imagem preencher o contêiner pai
            className={className || "object-cover"} // Garante que a imagem cubra o espaço
            onError={() => {
                setHasError(true)
            }}
        />
    )
}