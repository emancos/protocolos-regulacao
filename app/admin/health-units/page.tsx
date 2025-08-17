"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { UserRole } from "@/types/user"
import { HealthDataService } from "@/lib/health-data-service"
import type { HealthUnit, HealthAgent } from "@/types/health-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building, User, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Textarea } from "@/components/ui/textarea"

// --- DIÁLOGO PARA UNIDADES ---
function UnitDialog({ open, onOpenChange, onSave, unit }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: () => void, unit?: HealthUnit | null }) {
    const [formData, setFormData] = useState({ name: '', location: '', responsible_nurse: '', observation: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (unit) {
            setFormData({ name: unit.name, location: unit.location, responsible_nurse: unit.responsible_nurse, observation: unit.observation || '' });
        } else {
            setFormData({ name: '', location: '', responsible_nurse: '', observation: '' });
        }
    }, [unit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (unit) {
                await HealthDataService.updateHealthUnit(unit.id, formData);
            } else {
                await HealthDataService.createHealthUnit(formData);
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao salvar unidade:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{unit ? 'Editar Unidade' : 'Adicionar Nova Unidade'}</DialogTitle>
                    <DialogDescription>Preencha as informações da unidade de saúde.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="unit-form" className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Unidade</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Localização</Label>
                        <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="responsible_nurse">Enfermeiro(a) Responsável</Label>
                        <Input id="responsible_nurse" value={formData.responsible_nurse} onChange={(e) => setFormData({ ...formData, responsible_nurse: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="observation">Observação</Label>
                        <Textarea id="observation" value={formData.observation} onChange={(e) => setFormData({ ...formData, observation: e.target.value })} placeholder="Ex: Atende apenas pela manhã, Ponto de referência..." />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="unit-form" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- DIÁLOGO PARA AGENTES ---
function AgentDialog({ open, onOpenChange, onSave, agent, units }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: () => void, agent?: HealthAgent | null, units: HealthUnit[] }) {
    const [formData, setFormData] = useState({ name: '', nickname: '', phone_number: '', microarea: '', unit_id: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (agent) {
            setFormData({ name: agent.name, nickname: agent.nickname || '', phone_number: agent.phone_number, microarea: agent.microarea, unit_id: agent.unit_id });
        } else {
            setFormData({ name: '', nickname: '', phone_number: '', microarea: '', unit_id: '' });
        }
    }, [agent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (agent) {
                await HealthDataService.updateHealthAgent(agent.id, formData);
            } else {
                await HealthDataService.createHealthAgent(formData);
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao salvar agente:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{agent ? 'Editar Agente' : 'Adicionar Novo Agente'}</DialogTitle>
                    <DialogDescription>Preencha as informações do agente de saúde.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="agent-form" className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2"><Label htmlFor="name">Nome do Agente</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="nickname">Apelido</Label><Input id="nickname" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="phone_number">Telefone</Label><Input id="phone_number" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="microarea">Microárea</Label><Input id="microarea" value={formData.microarea} onChange={(e) => setFormData({ ...formData, microarea: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="unit_id">Unidade de Saúde</Label><Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })} required><SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger><SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="agent-form" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- CONTEÚDO DA ABA DE UNIDADES ---
function UnitTabContent({ units, loading, onDataChange }: { units: HealthUnit[], loading: boolean, onDataChange: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<HealthUnit | null>(null);

    const handleEdit = (unit: HealthUnit) => {
        setSelectedUnit(unit);
        setIsDialogOpen(true);
    };

    const handleDelete = (unit: HealthUnit) => {
        setSelectedUnit(unit);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedUnit) {
            await HealthDataService.deleteHealthUnit(selectedUnit.id);
            onDataChange();
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Unidades de Saúde</CardTitle>
                    <CardDescription>Total de {units.length} unidades cadastradas.</CardDescription>
                </div>
                <Button onClick={() => { setSelectedUnit(null); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Adicionar Unidade</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Enfermeiro(a) Responsável</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center">A carregar...</TableCell></TableRow>
                        ) : (
                            units.map(unit => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">{unit.name}</TableCell>
                                    <TableCell>{unit.location}</TableCell>
                                    <TableCell>{unit.responsible_nurse}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={unit.observation}>{unit.observation}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(unit)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(unit)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <UnitDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={onDataChange} unit={selectedUnit} />
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá apagar permanentemente a unidade de saúde e todos os agentes de saúde associados a ela.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Apagar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

// --- CONTEÚDO DA ABA DE AGENTES ---
function AgentTabContent({ agents, units, loading, onDataChange, findUnitName }: { agents: HealthAgent[], units: HealthUnit[], loading: boolean, onDataChange: () => void, findUnitName: (id: string) => string }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<HealthAgent | null>(null);

    const handleEdit = (agent: HealthAgent) => {
        setSelectedAgent(agent);
        setIsDialogOpen(true);
    };

    const handleDelete = (agent: HealthAgent) => {
        setSelectedAgent(agent);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedAgent) {
            await HealthDataService.deleteHealthAgent(selectedAgent.id);
            onDataChange();
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Agentes de Saúde</CardTitle>
                    <CardDescription>Total de {agents.length} agentes cadastrados.</CardDescription>
                </div>
                <Button onClick={() => { setSelectedAgent(null); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Adicionar Agente</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Microárea</TableHead>
                            <TableHead>Unidade de Saúde</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center">A carregar...</TableCell></TableRow>
                        ) : (
                            agents.map(agent => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">{agent.name} {agent.nickname && `(${agent.nickname})`}</TableCell>
                                    <TableCell>{agent.phone_number}</TableCell>
                                    <TableCell>{agent.microarea}</TableCell>
                                    <TableCell>{findUnitName(agent.unit_id)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(agent)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(agent)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <AgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={onDataChange} agent={selectedAgent} units={units} />
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá apagar permanentemente o agente de saúde.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Apagar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function HealthManagementPage() {
    const [units, setUnits] = useState<HealthUnit[]>([]);
    const [agents, setAgents] = useState<HealthAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("units");

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [unitsData, agentsData] = await Promise.all([
            HealthDataService.getAllHealthUnits(),
            HealthDataService.getAllHealthAgents()
        ]);
        setUnits(unitsData);
        setAgents(agentsData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const findUnitName = (unitId: string) => units.find(u => u.id === unitId)?.name || "N/A";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerir Unidades e Agentes</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Atualizar
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestão de Dados de Saúde</CardTitle>
                        <CardDescription>Adicione, edite ou remova unidades e agentes de saúde do sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="units"><Building className="h-4 w-4 mr-2" />Unidades de Saúde</TabsTrigger>
                                <TabsTrigger value="agents"><User className="h-4 w-4 mr-2" />Agentes de Saúde</TabsTrigger>
                            </TabsList>
                            <TabsContent value="units">
                                <UnitTabContent units={units} loading={loading} onDataChange={fetchData} />
                            </TabsContent>
                            <TabsContent value="agents">
                                <AgentTabContent agents={agents} units={units} loading={loading} onDataChange={fetchData} findUnitName={findUnitName} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function HealthUnitsPage() {
    return (
        <AuthGuard>
            <RoleGuard allowedRoles={[UserRole.ADMINISTRADOR]}>
                <HealthManagementPage />
            </RoleGuard>
        </AuthGuard>
    );
}
