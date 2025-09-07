import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Users, 
  Shield, 
  Clock, 
  Trash, 
  UserCheck, 
  User, 
  Eye, 
  MagnifyingGlass,
  Crown,
  Calendar,
  CurrencyDollar,
  TrendUp,
  Warning
} from '@phosphor-icons/react'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  admin_level: number
  admin_permissions: string[]
  created_at: string
  updated_at: string
  total_expenses?: number
  expense_count?: number
  last_activity?: string
}

export function AdminPage() {
  const { user } = useAuth()
  const { isAdmin, adminLevel, loading, getAllUsers, getUserStats, deleteUser, updateUserAdminStatus, getAdminLogs } = useAdmin()
  
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    usersToday: 0,
    totalExpenses: 0
  })
  const [adminLogs, setAdminLogs] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const loadData = async () => {
    setLoadingUsers(true)
    try {
      const [usersData, statsData, logsData] = await Promise.all([
        getAllUsers(),
        getUserStats(),
        getAdminLogs(20)
      ])
      
      setUsers(usersData)
      setStats(statsData)
      setAdminLogs(logsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Erro ao carregar dados administrativos')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await deleteUser(selectedUser.id)
      toast.success('Usuário deletado com sucesso')
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      loadData() // Reload data
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar usuário')
    }
  }

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    try {
      await updateUserAdminStatus(userId, !currentAdminStatus, currentAdminStatus ? 0 : 50)
      toast.success(`Status de admin ${currentAdminStatus ? 'removido' : 'concedido'} com sucesso`)
      loadData() // Reload data
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status de admin')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <Warning className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Você não tem permissões administrativas.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Painel Administrativo
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie usuários e monitore a plataforma
              {adminLevel === 100 && (
                <Badge variant="secondary" className="ml-2">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
            </p>
          </div>
          <Button onClick={loadData} disabled={loadingUsers}>
            {loadingUsers ? 'Atualizando...' : 'Atualizar Dados'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Total</CardTitle>
              <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="logs">Logs de Atividade</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <div className="relative w-64">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Gastos</TableHead>
                        <TableHead>Última Atividade</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.is_admin && (
                                <Badge variant="secondary">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {user.admin_level === 100 ? 'Super Admin' : 'Admin'}
                                </Badge>
                              )}
                              {user.id === user.id && (
                                <Badge variant="outline">Você</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatCurrency(user.total_expenses || 0)}</div>
                              <div className="text-sm text-gray-500">{user.expense_count || 0} despesas</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.last_activity ? formatDate(user.last_activity) : 'Nunca'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {adminLevel === 100 && user.id !== user.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                >
                                  {user.is_admin ? (
                                    <>
                                      <User className="h-4 w-4 mr-1" />
                                      Remover Admin
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Tornar Admin
                                    </>
                                  )}
                                </Button>
                              )}
                              {adminLevel >= 50 && user.id !== user.id && !user.is_admin && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Atividade Administrativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(log.created_at)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {log.admin_profile?.full_name || log.admin_profile?.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar o usuário <strong>{selectedUser?.email}</strong>?
                Esta ação não pode ser desfeita e todos os dados do usuário serão permanentemente removidos.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Deletar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
