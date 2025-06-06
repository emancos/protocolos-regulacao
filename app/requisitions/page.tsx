"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Plus, Search, Calendar, Clock, RefreshCw, Archive } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { RequisitionService } from "@/lib/requisition-service"
import { type Requisition, Status, Priority, STATUS_LABELS, STATUS_COLORS } from "@/types/requisitions"

export default function RequisitionsPage() {
    return (
        <AuthGuard>
            <RequisitionsContent />
        </AuthGuard>
    )
}

function RequisitionsContent() {
    const router = useRouter()
    const { hasPermission } = useUser()
    const [activeTab, setActiveTab] = useState("pending")
    const [pendingRequisitions, setPendingRequisitions] = useState<Requisition[]>([])
    const [scheduledRequisitions, setScheduledRequisitions] = useState<Requisition[]>([])
    const [canceledRequisitions, setCanceledRequisitions] = useState<Requisition[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const loadRequisitions = async () => {
        try {
            setLoading(true)
            const pending = await RequisitionService.getPendingRequisitions()
            const scheduled = await RequisitionService.getScheduledRequisitions()
            const canceled = await RequisitionService.getCanceledRequisitions()

            setPendingRequisitions(pending)
            setScheduledRequisitions(scheduled)
            setCanceledRequisitions(canceled)
        } catch (error) {
            console.error("Erro ao carregar requisições:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRequisitions()
    }, [])

    const filteredPending = pendingRequisitions.filter(
        (req) =>
            req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.procedures.some((proc) => proc.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const filteredScheduled = scheduledRequisitions.filter(
        (req) =>
            req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.procedures.some((proc) => proc.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const filteredCanceled = canceledRequisitions.filter(
        (req) =>
            req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.procedures.some((proc) => proc.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const getPriorityBadge = (priority: Priority) => {
        switch (priority) {
            case Priority.P1:
                return <Badge className="bg-red-500">P1</Badge>
            case Priority.P2:
                return <Badge className="bg-orange-500">P2</Badge>
            case Priority.P3:
                return <Badge className="bg-yellow-500">P3</Badge>
            case Priority.P4:
                return <Badge className="bg-green-500">P4</Badge>
            default:
                return <Badge>{priority}</Badge>
        }
    }

    const getStatusBadge = (status: Status) => {
        // Verifica se as chaves existem para evitar erros caso um novo status seja adicionado sem cor/label
        if (!STATUS_COLORS[status] || !STATUS_LABELS[status]) {
            return <Badge>{status}</Badge>
        }
        return <Badge className={`${STATUS_COLORS[status]} text-white`}>{STATUS_LABELS[status]}</Badge>
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requisições</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button onClick={loadRequisitions} variant="outline" size="sm">
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Atualizar
                            </Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por nome, protocolo ou procedimento..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button asChild>
                            <Link href="/requisitions/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Requisição
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciar Requisições</CardTitle>
                            <CardDescription>Visualize e gerencie todas as requisições de procedimentos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="pending" className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Pendentes
                                        <Badge variant="secondary" className="ml-2">
                                            {filteredPending.length}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="scheduled" className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Agendados
                                        <Badge variant="secondary" className="ml-2">
                                            {filteredScheduled.length}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="canceled" className="flex items-center">
                                        <Archive className="h-4 w-4 mr-2" />
                                        Cancelados e Arquivados
                                        <Badge variant="secondary" className="ml-2">
                                            {filteredCanceled.length}
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                            <p>Carregando requisições...</p>
                                        </div>
                                    ) : filteredPending.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? "Nenhuma requisição encontrada para esta busca" : "Não há requisições pendentes"}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Protocolo</TableHead>
                                                        <TableHead>Paciente</TableHead>
                                                        <TableHead>Procedimento</TableHead>
                                                        <TableHead>Prioridade</TableHead>
                                                        <TableHead>Recebido</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredPending.map((req) => (
                                                        <TableRow key={req.id}>
                                                            <TableCell className="font-medium">{req.protocol}</TableCell>
                                                            <TableCell>{req.patientName}</TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    {req.procedures.map((proc, index) => (
                                                                        <div key={index} className="text-sm">
                                                                            {proc.name} {proc.quantity > 1 && `(${proc.quantity}x)`}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                                                            <TableCell>{format(req.receivedDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                                            <TableCell>
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => router.push(`/requisitions/${req.id}`)}
                                                                    >
                                                                        Detalhes
                                                                    </Button>
                                                                    {hasPermission("canApproveRequests") && (
                                                                        <Button size="sm" onClick={() => router.push(`/requisitions/${req.id}/schedule`)}>
                                                                            Agendar
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="scheduled">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                            <p>Carregando requisições...</p>
                                        </div>
                                    ) : filteredScheduled.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? "Nenhuma requisição encontrada para esta busca" : "Não há requisições agendadas"}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Protocolo</TableHead>
                                                        <TableHead>Paciente</TableHead>
                                                        <TableHead>Procedimento</TableHead>
                                                        <TableHead>Data Agendada</TableHead>
                                                        <TableHead>Local</TableHead>
                                                        <TableHead>Regulação</TableHead>
                                                        <TableHead>Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredScheduled.map((req) => (
                                                        <TableRow key={req.id}>
                                                            <TableCell className="font-medium">{req.protocol}</TableCell>
                                                            <TableCell>{req.patientName}</TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    {req.procedures.map((proc, index) => (
                                                                        <div key={index} className="text-sm">
                                                                            {proc.name} {proc.quantity > 1 && `(${proc.quantity}x)`}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {req.scheduledDate && format(req.scheduledDate, "dd/MM/yyyy", { locale: ptBR })}
                                                            </TableCell>
                                                            <TableCell>{req.scheduledLocation}</TableCell>
                                                            <TableCell>{req.regulationType}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => router.push(`/requisitions/${req.id}`)}
                                                                >
                                                                    Detalhes
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="canceled">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                            <p>Carregando requisições...</p>
                                        </div>
                                    ) : filteredCanceled.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? "Nenhuma requisição encontrada para esta busca" : "Não há requisições canceladas"}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Protocolo</TableHead>
                                                        <TableHead>Paciente</TableHead>
                                                        <TableHead>Procedimento</TableHead>
                                                        <TableHead>Prioridade</TableHead>
                                                        <TableHead>Recebido</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredCanceled.map((req) => (
                                                        <TableRow key={req.id}>
                                                            <TableCell className="font-medium">{req.protocol}</TableCell>
                                                            <TableCell>{req.patientName}</TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    {req.procedures.map((proc, index) => (
                                                                        <div key={index} className="text-sm">
                                                                            {proc.name} {proc.quantity > 1 && `(${proc.quantity}x)`}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                                                            <TableCell>{format(req.receivedDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => router.push(`/requisitions/${req.id}`)}
                                                                >
                                                                    Detalhes
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
