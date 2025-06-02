"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Search } from "lucide-react"
import { COMMON_PROCEDURES, type ProcedureItem } from "@/types/procedures"
import { Separator } from "@/components/ui/separator"

interface ProcedureSelectorProps {
    procedures: ProcedureItem[]
    onChange: (procedures: ProcedureItem[]) => void
}

export function ProcedureSelector({ procedures, onChange }: ProcedureSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [customProcedure, setCustomProcedure] = useState("")

    const filteredProcedures = COMMON_PROCEDURES.filter((procedure: string) =>
        procedure.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const addProcedure = (procedureName: string) => {
        // Verifica se o procedimento já foi adicionado
        if (procedures.some((p) => p.name === procedureName)) {
            return
        }

        const newProcedure: ProcedureItem = {
            id: Date.now().toString(),
            name: procedureName,
            quantity: 1,
        }
        onChange([...procedures, newProcedure])
    }

    const addCustomProcedure = () => {
        if (customProcedure.trim() && !procedures.some((p) => p.name === customProcedure.trim())) {
            addProcedure(customProcedure.trim())
            setCustomProcedure("")
        }
    }

    const removeProcedure = (id: string) => {
        onChange(procedures.filter((p) => p.id !== id))
    }

    const updateProcedureQuantity = (id: string, quantity: number) => {
        onChange(procedures.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, quantity) } : p)))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Procedimentos Solicitados</h3>
                {procedures.length > 0 && (
                    <span className="text-sm text-gray-500">{procedures.length} procedimento(s) selecionado(s)</span>
                )}
            </div>
            <Separator />

            {/* Lista de procedimentos selecionados */}
            {procedures.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm">Procedimentos Selecionados:</h4>
                    {procedures.map((procedure) => (
                        <Card key={procedure.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-medium">{procedure.name}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor={`quantity-${procedure.id}`} className="text-sm">
                                        Qtd:
                                    </Label>
                                    <Input
                                        id={`quantity-${procedure.id}`}
                                        type="number"
                                        min="1"
                                        value={procedure.quantity}
                                        onChange={(e) => updateProcedureQuantity(procedure.id, Number.parseInt(e.target.value) || 1)}
                                        className="w-16"
                                    />
                                    <Button type="button" onClick={() => removeProcedure(procedure.id)} variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Seleção de procedimentos comuns */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Selecionar Procedimentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Campo de busca */}
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar procedimento..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Campo para procedimento personalizado */}
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Ou digite um procedimento personalizado..."
                                value={customProcedure}
                                onChange={(e) => setCustomProcedure(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        addCustomProcedure()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={addCustomProcedure}
                                disabled={!customProcedure.trim() || procedures.some((p) => p.name === customProcedure.trim())}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                            </Button>
                        </div>

                        <Separator />

                        {/* Lista de procedimentos comuns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {filteredProcedures.slice(0, 30).map((procedure) => {
                                const isSelected = procedures.some((p) => p.name === procedure)
                                return (
                                    <Button
                                        key={procedure}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => addProcedure(procedure)}
                                        className="justify-start text-left h-auto p-2 text-xs"
                                        disabled={isSelected}
                                    >
                                        {isSelected && <Plus className="h-3 w-3 mr-1" />}
                                        {procedure}
                                    </Button>
                                )
                            })}
                        </div>

                        {filteredProcedures.length > 30 && (
                            <p className="text-xs text-gray-500 mt-2">
                                Mostrando 30 de {filteredProcedures.length} procedimentos. Use a busca para refinar.
                            </p>
                        )}

                        {filteredProcedures.length === 0 && searchTerm && (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Nenhum procedimento encontrado para &quot;{searchTerm}&quot;
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {procedures.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">Selecione pelo menos um procedimento acima</div>
            )}
        </div>
    )
}
