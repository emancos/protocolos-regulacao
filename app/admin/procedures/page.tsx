"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { UserRole } from "@/types/user"
import { ProcedureService, type Procedure, type ProcedureGroup } from "@/lib/procedure-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, ListOrdered, ClipboardList } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// --- DIÁLOGO PARA GRUPOS ---
function GroupDialog({ open, onOpenChange, onSave, group }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: () => void, group?: ProcedureGroup | null }) {
    const [formData, setFormData] = useState({ name: '', order: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (group) setFormData({ name: group.name, order: group.order });
        else setFormData({ name: '', order: 0 });
    }, [group]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (group) await ProcedureService.updateProcedureGroup(group.id, formData);
            else await ProcedureService.createProcedureGroup(formData);
            onSave();
            onOpenChange(false);
        } catch (error) { console.error("Erro ao salvar grupo:", error); }
        finally { setIsSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{group ? 'Editar Grupo' : 'Adicionar Novo Grupo'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="group-form" className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="name">Nome do Grupo</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label htmlFor="order">Ordem de Exibição</Label><Input id="order" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })} required /></div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="group-form" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- DIÁLOGO PARA PROCEDIMENTOS ---
function ProcedureDialog({ open, onOpenChange, onSave, procedure, groups }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: () => void, procedure?: Procedure | null, groups: ProcedureGroup[] }) {
    const [formData, setFormData] = useState({ name: '', code: '', groupId: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (procedure) setFormData({ name: procedure.name, code: procedure.code, groupId: procedure.groupId });
        else setFormData({ name: '', code: '', groupId: '' });
    }, [procedure]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (procedure) await ProcedureService.updateProcedure(procedure.id, formData);
            else await ProcedureService.createProcedure(formData);
            onSave();
            onOpenChange(false);
        } catch (error) { console.error("Erro ao salvar procedimento:", error); }
        finally { setIsSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{procedure ? 'Editar Procedimento' : 'Adicionar Novo Procedimento'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="procedure-form" className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="name">Nome do Procedimento</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label htmlFor="code">Código</Label><Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required /></div>
                    <div className="space-y-2"><Label htmlFor="groupId">Grupo</Label><Select value={formData.groupId} onValueChange={(value) => setFormData({ ...formData, groupId: value })} required><SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger><SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select></div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="procedure-form" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- COMPONENTES DAS ABAS ---
function GroupTabContent({ groups, loading, onDataChange }: { groups: ProcedureGroup[], loading: boolean, onDataChange: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<ProcedureGroup | null>(null);

    const handleEdit = (group: ProcedureGroup) => { setSelectedGroup(group); setIsDialogOpen(true); };
    const handleDelete = (group: ProcedureGroup) => { setSelectedGroup(group); setIsAlertOpen(true); };
    const handleDeleteConfirm = async () => { if (selectedGroup) { await ProcedureService.deleteProcedureGroup(selectedGroup.id); onDataChange(); } };

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Grupos de Procedimentos</CardTitle><CardDescription>Total de {groups.length} grupos.</CardDescription></div>
                <Button onClick={() => { setSelectedGroup(null); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Adicionar Grupo</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Ordem</TableHead><TableHead>Nome</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={3} className="text-center h-24">A carregar...</TableCell></TableRow> : groups.map(group => (
                            <TableRow key={group.id}>
                                <TableCell>{group.order}</TableCell>
                                <TableCell className="font-medium">{group.name}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(group)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(group)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <GroupDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={onDataChange} group={selectedGroup} />
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Irá apagar o grupo e todos os procedimentos associados a ele.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Apagar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}

function ProcedureTabContent({ procedures, groups, loading, onDataChange }: { procedures: Procedure[], groups: ProcedureGroup[], loading: boolean, onDataChange: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

    const findGroupName = (groupId: string) => groups.find(g => g.id === groupId)?.name || "N/A";
    const handleEdit = (proc: Procedure) => { setSelectedProcedure(proc); setIsDialogOpen(true); };
    const handleDelete = (proc: Procedure) => { setSelectedProcedure(proc); setIsAlertOpen(true); };
    const handleDeleteConfirm = async () => { if (selectedProcedure) { await ProcedureService.deleteProcedure(selectedProcedure.id); onDataChange(); } };

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Procedimentos</CardTitle><CardDescription>Total de {procedures.length} procedimentos.</CardDescription></div>
                <Button onClick={() => { setSelectedProcedure(null); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Adicionar Procedimento</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Código</TableHead><TableHead>Grupo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={4} className="text-center h-24">A carregar...</TableCell></TableRow> : procedures.map(proc => (
                            <TableRow key={proc.id}>
                                <TableCell className="font-medium">{proc.name}</TableCell>
                                <TableCell>{proc.code}</TableCell>
                                <TableCell>{findGroupName(proc.groupId)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(proc)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(proc)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <ProcedureDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={onDataChange} procedure={selectedProcedure} groups={groups} />
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá apagar permanentemente o procedimento.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Apagar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function ProceduresManagementPage() {
    const [groups, setGroups] = useState<ProcedureGroup[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("groups");

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [groupsData, proceduresData] = await Promise.all([
            ProcedureService.getAllProcedureGroups(),
            ProcedureService.getAllProcedures()
        ]);
        setGroups(groupsData);
        setProcedures(proceduresData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Button asChild variant="outline" size="sm"><Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerir Procedimentos</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <Button onClick={fetchData} disabled={loading} variant="outline" size="sm"><RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestão de Procedimentos Médicos</CardTitle>
                        <CardDescription>Adicione, edite ou remova grupos e procedimentos do sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="groups"><ListOrdered className="h-4 w-4 mr-2" />Grupos de Procedimentos</TabsTrigger>
                                <TabsTrigger value="procedures"><ClipboardList className="h-4 w-4 mr-2" />Procedimentos</TabsTrigger>
                            </TabsList>
                            <TabsContent value="groups">
                                <GroupTabContent groups={groups} loading={loading} onDataChange={fetchData} />
                            </TabsContent>
                            <TabsContent value="procedures">
                                <ProcedureTabContent procedures={procedures} groups={groups} loading={loading} onDataChange={fetchData} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function ProceduresPage() {
    return (
        <AuthGuard>
            <RoleGuard allowedRoles={[UserRole.ADMINISTRADOR]}>
                <ProceduresManagementPage />
            </RoleGuard>
        </AuthGuard>
    );
}
