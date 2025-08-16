"use client"

import { useState, useEffect, useCallback } from "react"
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
import { ArrowLeft, Plus, Search, Calendar, Clock, RefreshCw, Archive, FileClock } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { RequisitionService, type PaginatedRequisitions } from "@/lib/requisition-service"
import { type Requisition, Status, Priority, STATUS_LABELS, STATUS_COLORS } from "@/types/requisitions"
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore"

export default function RequisitionsPage() {
    return (
        <AuthGuard>
            <RequisitionsContent />
        </AuthGuard>
    )
}

// Define a type for the tab keys to ensure type safety
type TabKey = "pending" | "sis_pending" | "scheduled" | "canceled";

function RequisitionsContent() {
    const router = useRouter()
    const { hasPermission } = useUser()
    const [activeTab, setActiveTab] = useState<TabKey>("pending")
    const [searchTerm, setSearchTerm] = useState("")

    // States for each requisition list
    const [pendingRequisitions, setPendingRequisitions] = useState<Requisition[]>([])
    const [sisPendingRequisitions, setSisPendingRequisitions] = useState<Requisition[]>([])
    const [scheduledRequisitions, setScheduledRequisitions] = useState<Requisition[]>([])
    const [canceledRequisitions, setCanceledRequisitions] = useState<Requisition[]>([])

    // States for pagination control
    const [lastVisible, setLastVisible] = useState<Record<string, QueryDocumentSnapshot<DocumentData> | null>>({
        pending: null,
        sis_pending: null,
        scheduled: null,
        canceled: null,
    })
    const [hasMore, setHasMore] = useState<Record<string, boolean>>({
        pending: true,
        sis_pending: true,
        scheduled: true,
        canceled: true,
    })

    // Loading states
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchRequisitions = useCallback(async (tab: string, loadMore = false) => {
        if (loadMore) setLoadingMore(true);

        const lastDoc = loadMore ? lastVisible[tab] : null
        let result: PaginatedRequisitions

        try {
            switch (tab) {
                case "pending":
                    result = await RequisitionService.getPendingRequisitions(15, lastDoc)
                    setPendingRequisitions(prev => loadMore ? [...prev, ...result.requisitions] : result.requisitions)
                    break
                case "sis_pending":
                    result = await RequisitionService.getSisPendingRequisitions(15, lastDoc)
                    setSisPendingRequisitions(prev => loadMore ? [...prev, ...result.requisitions] : result.requisitions)
                    break
                case "scheduled":
                    result = await RequisitionService.getScheduledRequisitions(15, lastDoc)
                    setScheduledRequisitions(prev => loadMore ? [...prev, ...result.requisitions] : result.requisitions)
                    break
                case "canceled":
                    result = await RequisitionService.getCanceledRequisitions(15, lastDoc)
                    setCanceledRequisitions(prev => loadMore ? [...prev, ...result.requisitions] : result.requisitions)
                    break
                default:
                    return
            }

            setLastVisible(prev => ({ ...prev, [tab]: result.lastVisible }))
            setHasMore(prev => ({ ...prev, [tab]: result.requisitions.length === 15 }))
        } catch (error) {
            console.error(`Erro ao carregar requisições da aba ${tab}:`, error)
        } finally {
            if (loadMore) setLoadingMore(false)
        }
    }, [lastVisible])

    useEffect(() => {
        const loadAllInitialData = async () => {
            setLoading(true);
            await Promise.all([
                fetchRequisitions('pending', false),
                fetchRequisitions('sis_pending', false),
                fetchRequisitions('scheduled', false),
                fetchRequisitions('canceled', false)
            ]);
            setLoading(false);
        };

        loadAllInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshCurrentTab = async () => {
        setLoading(true);
        setLastVisible(prev => ({ ...prev, [activeTab]: null }));
        setHasMore(prev => ({ ...prev, [activeTab]: true }));

        if (activeTab === 'pending') setPendingRequisitions([]);
        if (activeTab === 'sis_pending') setSisPendingRequisitions([]);
        if (activeTab === 'scheduled') setScheduledRequisitions([]);
        if (activeTab === 'canceled') setCanceledRequisitions([]);

        await fetchRequisitions(activeTab, false);
        setLoading(false);
    }

    const filterData = (data: Requisition[]) => {
        if (!searchTerm) return data;

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        // Cria uma versão do termo de busca apenas com números para o Cartão SUS
        const numericSearchTerm = searchTerm.replace(/\D/g, '');

        return data.filter(
            (req) => {
                // Limpa o Cartão SUS do documento para comparar com a busca numérica
                const cleanedSusCard = req.susCard.replace(/\D/g, '');

                return (
                    req.patientName.toLowerCase().includes(lowerCaseSearchTerm) ||
                    req.protocol.toLowerCase().includes(lowerCaseSearchTerm) ||
                    req.procedures.some((proc) => proc.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
                    (numericSearchTerm.length > 0 && cleanedSusCard.includes(numericSearchTerm))
                );
            }
        );
    }

    const filteredPending = filterData(pendingRequisitions)
    const filteredSisPending = filterData(sisPendingRequisitions)
    const filteredScheduled = filterData(scheduledRequisitions)
    const filteredCanceled = filterData(canceledRequisitions)

    // Efeito para mudar de aba automaticamente se o resultado da busca estiver em outra aba
    useEffect(() => {
        if (searchTerm) {
            const resultsInTabs: Record<TabKey, number> = {
                pending: filteredPending.length,
                sis_pending: filteredSisPending.length,
                scheduled: filteredScheduled.length,
                canceled: filteredCanceled.length,
            };

            // Se a aba atual não tem resultados, mas outra tem, mude para a primeira que encontrar
            if (resultsInTabs[activeTab] === 0) {
                const firstTabWithResults = Object.keys(resultsInTabs).find(key => resultsInTabs[key as TabKey] > 0);
                if (firstTabWithResults) {
                    setActiveTab(firstTabWithResults as TabKey);
                }
            }
        }
    }, [searchTerm, activeTab, filteredPending.length, filteredSisPending.length, filteredScheduled.length, filteredCanceled.length]);


    const getPriorityBadge = (priority: Priority) => {
        switch (priority) {
            case Priority.P1: return <Badge className="bg-red-500 text-white">P1</Badge>
            case Priority.P2: return <Badge className="bg-orange-500 text-white">P2</Badge>
            case Priority.P3: return <Badge className="bg-yellow-500 text-black">P3</Badge>
            case Priority.P4: return <Badge className="bg-green-500 text-white">P4</Badge>
            default: return <Badge>{priority}</Badge>
        }
    }

    const getStatusBadge = (status: Status) => {
        if (!STATUS_COLORS[status] || !STATUS_LABELS[status]) {
            return <Badge>{status}</Badge>
        }
        return <Badge className={`${STATUS_COLORS[status]} text-white`}>{STATUS_LABELS[status]}</Badge>
    }

    const renderTable = (requisitions: Requisition[], tabKey: string) => {
        if (loading && requisitions.length === 0) {
            return (
                <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>A carregar requisições...</p>
                </div>
            )
        }
        if (requisitions.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "Nenhuma requisição encontrada para esta busca" : `Não há requisições nesta aba`}
                </div>
            )
        }

        const isScheduledTab = tabKey === 'scheduled';

        return (
            <>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Protocolo</TableHead>
                                <TableHead>Paciente</TableHead>
                                <TableHead>Procedimento</TableHead>
                                {isScheduledTab ? (
                                    <>
                                        <TableHead>Data Agendada</TableHead>
                                        <TableHead>Local</TableHead>
                                    </>
                                ) : (
                                    <>
                                        <TableHead>Prioridade</TableHead>
                                        <TableHead>Recebido</TableHead>
                                    </>
                                )}
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requisitions.map((req) => (
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
                                    {isScheduledTab ? (
                                        <>
                                            <TableCell>{req.scheduledDate ? format(req.scheduledDate, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                                            <TableCell>{req.scheduledLocation}</TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                                            <TableCell>{format(req.receivedDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                        </>
                                    )}
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/requisitions/${req.id}`)}>
                                                Detalhes
                                            </Button>
                                            {(tabKey === 'pending' || tabKey === 'sis_pending') && hasPermission("canApproveRequests") && (
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
                {hasMore[tabKey] && !searchTerm && (
                    <div className="mt-6 text-center">
                        <Button onClick={() => fetchRequisitions(tabKey, true)} disabled={loadingMore}>
                            {loadingMore ? (
                                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> A carregar...</>
                            ) : (
                                "Carregar Mais"
                            )}
                        </Button>
                    </div>
                )}
            </>
        )
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
                            <Button onClick={refreshCurrentTab} variant="outline" size="sm" disabled={loading || loadingMore}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || loadingMore) ? "animate-spin" : ""}`} />
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
                                placeholder="Buscar por nome, protocolo, Cartão SUS..."
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
                            <CardTitle>Gerir Requisições</CardTitle>
                            <CardDescription>Visualize e gira todas as requisições de procedimentos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
                                <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4">
                                    <TabsTrigger value="pending" className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Pendentes
                                        <Badge variant="secondary" className="ml-2">
                                            {searchTerm ? filteredPending.length : pendingRequisitions.length}
                                            {hasMore.pending && !searchTerm ? '+' : ''}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="sis_pending" className="flex items-center">
                                        <FileClock className="h-4 w-4 mr-2" />
                                        Aguardando
                                        <Badge variant="secondary" className="ml-2">
                                            {searchTerm ? filteredSisPending.length : sisPendingRequisitions.length}
                                            {hasMore.sis_pending && !searchTerm ? '+' : ''}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="scheduled" className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Agendados
                                        <Badge variant="secondary" className="ml-2">
                                            {searchTerm ? filteredScheduled.length : scheduledRequisitions.length}
                                            {hasMore.scheduled && !searchTerm ? '+' : ''}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="canceled" className="flex items-center">
                                        <Archive className="h-4 w-4 mr-2" />
                                        Cancelados
                                        <Badge variant="secondary" className="ml-2">
                                            {searchTerm ? filteredCanceled.length : canceledRequisitions.length}
                                            {hasMore.canceled && !searchTerm ? '+' : ''}
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    {renderTable(filteredPending, 'pending')}
                                </TabsContent>
                                <TabsContent value="sis_pending">
                                    {renderTable(filteredSisPending, 'sis_pending')}
                                </TabsContent>
                                <TabsContent value="scheduled">
                                    {renderTable(filteredScheduled, 'scheduled')}
                                </TabsContent>
                                <TabsContent value="canceled">
                                    {renderTable(filteredCanceled, 'canceled')}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}