"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Trash2, Search, Loader2 } from "lucide-react"
import { ProcedureService, type Procedure, type ProcedureGroup } from "@/lib/procedure-service"
import { type ProcedureItem } from "@/types/procedures"
import { Separator } from "@/components/ui/separator"

const FieldError = ({ messages }: { messages?: string[] }) => {
    if (!messages || messages.length === 0) {
        return null;
    }
    return <p className="text-sm font-medium text-destructive mt-2">{messages[0]}</p>;
};

interface ProcedureSelectorProps {
    procedures: ProcedureItem[]
    onChange: (procedures: ProcedureItem[]) => void
    error?: string[]
}

export function ProcedureSelector({ procedures, onChange, error }: ProcedureSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
    const [groups, setGroups] = useState<ProcedureGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [groupsData, proceduresData] = await Promise.all([
                ProcedureService.getAllProcedureGroups(),
                ProcedureService.getAllProcedures()
            ]);
            setGroups(groupsData);
            setAllProcedures(proceduresData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const groupedAndFilteredProcedures = useMemo(() => {
        if (loading) return [];

        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return groups.map(group => {
            const filtered = allProcedures.filter(proc =>
                proc.groupId === group.id && proc.name.toLowerCase().includes(lowerCaseSearchTerm)
            );
            return { ...group, procedures: filtered };
        }).filter(group => group.procedures.length > 0); // Só mostra grupos que têm resultados
    }, [searchTerm, allProcedures, groups, loading]);

    useEffect(() => {
        if (searchTerm) {
            // Abre todos os acordeões que têm resultados de pesquisa
            setOpenAccordionItems(groupedAndFilteredProcedures.map(g => g.id));
        } else {
            // Fecha todos quando a pesquisa é limpa
            setOpenAccordionItems([]);
        }
    }, [searchTerm, groupedAndFilteredProcedures]);


    const addProcedure = (procedure: Procedure) => {
        if (procedures.some((p) => p.name === procedure.name)) {
            return;
        }
        const newProcedure: ProcedureItem = {
            id: procedure.id, // Usa o ID do Firebase
            name: procedure.name,
            quantity: 1,
        };
        onChange([...procedures, newProcedure]);
    };

    const removeProcedure = (id: string) => {
        onChange(procedures.filter((p) => p.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Procedimentos Solicitados</h3>
                {procedures.length > 0 && (
                    <span className="text-sm text-gray-500">{procedures.length} procedimento(s) selecionado(s)</span>
                )}
            </div>
            <Separator />

            <FieldError messages={error} />

            {procedures.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm">Procedimentos Selecionados:</h4>
                    {procedures.map((procedure) => (
                        <Card key={procedure.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <p className="font-medium flex-1 pr-4">{procedure.name}</p>
                                <div className="flex items-center space-x-1">
                                    <Button type="button" onClick={() => removeProcedure(procedure.id)} variant="outline">Remover: <Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Selecionar Procedimentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar procedimento por nome..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>

                        <Separator />

                        {loading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full max-h-80 overflow-y-auto pr-2">
                                {groupedAndFilteredProcedures.map(group => (
                                    <AccordionItem value={group.id} key={group.id}>
                                        <AccordionTrigger className="text-sm font-semibold">{group.name} ({group.procedures.length})</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {group.procedures.map((procedure) => {
                                                    const isSelected = procedures.some((p) => p.name === procedure.name);
                                                    return (
                                                        <Button
                                                            key={procedure.id}
                                                            type="button"
                                                            variant={isSelected ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => addProcedure(procedure)}
                                                            className="justify-start text-left h-auto p-2 text-xs whitespace-normal"
                                                            disabled={isSelected}
                                                        >
                                                            {procedure.name}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}

                        {groupedAndFilteredProcedures.length === 0 && searchTerm && !loading && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum procedimento encontrado para &quot;{searchTerm}&quot;</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
