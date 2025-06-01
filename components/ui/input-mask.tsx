"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
    mask: string
}

export function InputMask({ className, mask, value, onChange, ...props }: InputMaskProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        const unmaskedValue = value.replace(/[^\d]/g, "")

        let maskedValue = ""
        let unmaskedIndex = 0

        for (let i = 0; i < mask.length; i++) {
            if (unmaskedIndex >= unmaskedValue.length) break

            if (mask[i] === "9") {
                maskedValue += unmaskedValue[unmaskedIndex]
                unmaskedIndex++
            } else {
                maskedValue += mask[i]
            }
        }

        // Simula um evento de mudança com o valor mascarado
        const newEvent = {
            ...e,
            target: {
                ...e.target,
                value: maskedValue,
            },
        }

        if (onChange) {
            onChange(newEvent as React.ChangeEvent<HTMLInputElement>)
        }
    }

    return <Input className={cn(className)} value={value} onChange={handleChange} {...props} />
}
