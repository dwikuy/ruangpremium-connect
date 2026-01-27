import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Wallet, 
  Key,
  TrendingUp,
  ShoppingBag,
  Users,
  UserMinus,
  Plus,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Webhook,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  useResellers,
  useMembers,
  useUpgradeToReseller,
  useDowngradeToMember,
  useAddResellerBalance,
  useResellerApiKeys,
  useUpdateApiKeyRateLimit,
  useToggleApiKeyStatus,
  useWebhookDeliveries,
  useRetryWebhook,
  type ResellerData,
} from '@/hooks/useAdminResellers';

export default function AdminResellers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReseller, setSelectedReseller] = useState<ResellerData | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [showApiKeysDialog, setShowApiKeysDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupDescription, setTopupDescription] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [editingRateLimit, setEditingRateLimit] = useState<{ keyId: string; value: string } | null>(null);
  const [webhookFilter, setWebhookFilter] = useState<'all' | 'success' | 'failed'>('all');

  const { data: resellers, isLoading: loadingResellers } = useResellers();
  const { data: members, isLoading: loadingMembers } = useMembers();
  const { data: apiKeys, isLoading: loadingApiKeys } = useResellerApiKeys(selectedReseller?.user_id);
  const { data: webhookDeliveries, isLoading: loadingWebhooks, refetch: refetchWebhooks } = useWebhookDeliveries({ status: webhookFilter });

  const upgradeToReseller = useUpgradeToReseller();
  const downgradeToMember = useDowngradeToMember();
  const addBalance = useAddResellerBalance();
  const updateRateLimit = useUpdateApiKeyRateLimit();
  const toggleApiKeyStatus = useToggleApiKeyStatus();
  const retryWebhook = useRetryWebhook();

  // Filter resellers
  const filteredResellers = resellers?.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter members
  const filteredMembers = members?.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

  // Calculate totals
  const totalBalance = resellers?.reduce((sum, r) => sum + r.wallet_balance, 0) || 0;
  const totalRevenue = resellers?.reduce((sum, r) => sum + r.total_revenue, 0) || 0;
  const totalOrders = resellers?.reduce((sum, r) => sum + r.total_orders, 0) || 0;
  const failedWebhooks = webhookDeliveries?.filter(d => !d.delivered_at).length || 0;

  const handleUpgrade = () => {
    if (!selectedMemberId) return;
    upgradeToReseller.mutate(selectedMemberId, {
      onSuccess: () => {
        setShowUpgradeDialog(false);
        setSelectedMemberId('');
        setMemberSearch('');
      },
    });
  };

  const handleDowngrade = () => {
    if (!selectedReseller) return;
    downgradeToMember.mutate(selectedReseller.user_id, {
      onSuccess: () => {
        setShowDowngradeDialog(false);
        setSelectedReseller(null);
      },
    });
  };

  const handleTopup = () => {
    if (!selectedReseller || !topupAmount) return;
    addBalance.mutate({
      userId: selectedReseller.user_id,
      amount: parseFloat(topupAmount),
      description: topupDescription || undefined,
    }, {
      onSuccess: () => {
        setShowTopupDialog(false);
        setTopupAmount('');
        setTopupDescription('');
        setSelectedReseller(null);
      },
    });
  };

  const handleUpdateRateLimit = (keyId: string, value: string) => {
    const rateLimit = parseInt(value);
    if (isNaN(rateLimit) || rateLimit < 1) return;
    updateRateLimit.mutate({ keyId, rateLimit }, {
      onSuccess: () => setEditingRateLimit(null),
    });
  };

  return (
    <AdminLayout title="Manajemen Reseller" description="Kelola reseller, statistik, dan API keys">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Reseller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resellers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Saldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Total Pesanan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resellers" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="resellers">Daftar Reseller</TabsTrigger>
            <TabsTrigger value="upgrade">Upgrade Member</TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              Webhook Log
              {failedWebhooks > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {failedWebhooks}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Resellers List */}
        <TabsContent value="resellers">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <CardTitle>Daftar Reseller</CardTitle>
                  <CardDescription>Kelola reseller dan lihat statistik mereka</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari reseller..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingResellers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredResellers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Tidak ada reseller yang ditemukan' : 'Belum ada reseller'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reseller</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Total Order</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>API Keys</TableHead>
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResellers.map((reseller) => (
                        <TableRow key={reseller.user_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reseller.name}</p>
                              <p className="text-sm text-muted-foreground">{reseller.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-secondary">
                              {formatCurrency(reseller.wallet_balance)}
                            </span>
                          </TableCell>
                          <TableCell>{reseller.total_orders}</TableCell>
                          <TableCell>{formatCurrency(reseller.total_revenue)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{reseller.api_keys_count} keys</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(reseller.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedReseller(reseller);
                                  setShowTopupDialog(true);
                                }}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Tambah Saldo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedReseller(reseller);
                                  setShowApiKeysDialog(true);
                                }}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Kelola API Keys
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedReseller(reseller);
                                    setShowDowngradeDialog(true);
                                  }}
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Downgrade ke Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upgrade Members */}
        <TabsContent value="upgrade">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Member ke Reseller</CardTitle>
              <CardDescription>Pilih member yang akan dijadikan reseller</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari member..."
                    className="pl-9"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingMembers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {memberSearch ? 'Tidak ada member yang ditemukan' : 'Tidak ada member untuk di-upgrade'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.user_id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(member.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedMemberId(member.user_id);
                                setShowUpgradeDialog(true);
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Upgrade
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Logs */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhook Delivery Log
                  </CardTitle>
                  <CardDescription>Monitor dan retry webhook yang gagal terkirim</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                    value={webhookFilter}
                    onChange={(e) => setWebhookFilter(e.target.value as 'all' | 'success' | 'failed')}
                  >
                    <option value="all">Semua</option>
                    <option value="success">Berhasil</option>
                    <option value="failed">Gagal</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => refetchWebhooks()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWebhooks ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !webhookDeliveries || webhookDeliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada log webhook
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Reseller</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhookDeliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell>
                            {delivery.delivered_at ? (
                              <Badge variant="outline" className="text-success border-success/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Terkirim
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Gagal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {delivery.event_type}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                #{delivery.order_id?.substring(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(delivery.order as any)?.customer_name || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {(delivery.api_key as any)?.name || '-'}
                            </p>
                          </TableCell>
                          <TableCell>
                            {delivery.response_status ? (
                              <Badge variant={delivery.response_status >= 200 && delivery.response_status < 300 ? 'outline' : 'secondary'}>
                                HTTP {delivery.response_status}
                              </Badge>
                            ) : delivery.error ? (
                              <span className="text-xs text-destructive truncate max-w-[150px] block">
                                {delivery.error}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(delivery.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {!delivery.delivered_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryWebhook.mutate(delivery.id)}
                                disabled={retryWebhook.isPending}
                              >
                                {retryWebhook.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Retry
                                  </>
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Upgrade</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin meng-upgrade member ini menjadi Reseller? 
              Mereka akan mendapatkan akses ke panel reseller dan harga khusus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpgrade} disabled={upgradeToReseller.isPending}>
              {upgradeToReseller.isPending ? 'Memproses...' : 'Ya, Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Confirmation Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Downgrade</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menurunkan {selectedReseller?.name} dari Reseller menjadi Member?
              Mereka akan kehilangan akses ke panel reseller.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDowngrade} disabled={downgradeToMember.isPending}>
              {downgradeToMember.isPending ? 'Memproses...' : 'Ya, Downgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topup Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Saldo Reseller</DialogTitle>
            <DialogDescription>
              Tambah saldo wallet untuk {selectedReseller?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Saldo Saat Ini</p>
              <p className="text-xl font-bold">{formatCurrency(selectedReseller?.wallet_balance || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topup-amount">Jumlah Topup</Label>
              <Input
                id="topup-amount"
                type="number"
                placeholder="100000"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topup-description">Keterangan (opsional)</Label>
              <Input
                id="topup-description"
                placeholder="Admin topup manual"
                value={topupDescription}
                onChange={(e) => setTopupDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopupDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleTopup} disabled={addBalance.isPending || !topupAmount}>
              {addBalance.isPending ? 'Memproses...' : 'Tambah Saldo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Keys Management Dialog */}
      <Dialog open={showApiKeysDialog} onOpenChange={setShowApiKeysDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Keys - {selectedReseller?.name}</DialogTitle>
            <DialogDescription>
              Kelola API keys dan rate limit untuk reseller ini
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {loadingApiKeys ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Reseller ini belum memiliki API key
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {key.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingRateLimit?.keyId === key.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20 h-8"
                              value={editingRateLimit.value}
                              onChange={(e) => setEditingRateLimit({ keyId: key.id, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateRateLimit(key.id, editingRateLimit.value);
                                } else if (e.key === 'Escape') {
                                  setEditingRateLimit(null);
                                }
                              }}
                              autoFocus
                            />
                            <span className="text-sm text-muted-foreground">/jam</span>
                          </div>
                        ) : (
                          <button
                            className="text-sm hover:underline"
                            onClick={() => setEditingRateLimit({ keyId: key.id, value: String(key.rate_limit) })}
                          >
                            {key.rate_limit}/jam
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleApiKeyStatus.mutate({ keyId: key.id, isActive: !key.is_active })}
                        >
                          {key.is_active ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeysDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
