import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminProviders, ProviderAccount, ProviderAccountFormData, ProviderFormData } from '@/hooks/useAdminProviders';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Plus, 
  Pencil,
  Trash2, 
  Search,
  Server,
  Users,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const defaultProviderForm: ProviderFormData = {
  name: '',
  slug: '',
  description: null,
  is_active: true,
};

const defaultAccountForm: ProviderAccountFormData = {
  provider_id: '',
  name: '',
  credentials: {},
  is_active: true,
  max_daily_invites: 5,
};

export default function AdminProviders() {
  const { 
    providers, 
    accounts,
    stats,
    isLoading, 
    createProvider,
    createAccount,
    updateAccount,
    toggleAccount,
    deleteAccount,
    resetDailyInvites,
    isCreatingProvider,
    isCreatingAccount,
    isUpdating,
    isDeleting,
  } = useAdminProviders();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerForm, setProviderForm] = useState<ProviderFormData>(defaultProviderForm);
  const [accountForm, setAccountForm] = useState<ProviderAccountFormData>(defaultAccountForm);
  const [editingAccount, setEditingAccount] = useState<ProviderAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<ProviderAccount | null>(null);
  const [credentialFields, setCredentialFields] = useState<{ key: string; value: string }[]>([
    { key: 'email', value: '' },
    { key: 'password', value: '' },
  ]);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = 
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.provider?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvider = providerFilter === 'all' || account.provider_id === providerFilter;
    
    return matchesSearch && matchesProvider;
  });

  const handleOpenCreateProvider = () => {
    setProviderForm(defaultProviderForm);
    setProviderDialogOpen(true);
  };

  const handleOpenCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm(defaultAccountForm);
    setCredentialFields([
      { key: 'email', value: '' },
      { key: 'password', value: '' },
    ]);
    setAccountDialogOpen(true);
  };

  const handleOpenEditAccount = (account: ProviderAccount) => {
    setEditingAccount(account);
    
    const creds = account.credentials as Record<string, string> || {};
    const fields = Object.entries(creds).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    
    setAccountForm({
      provider_id: account.provider_id,
      name: account.name,
      credentials: creds,
      is_active: account.is_active,
      max_daily_invites: account.max_daily_invites,
    });
    setCredentialFields(fields.length > 0 ? fields : [{ key: '', value: '' }]);
    setAccountDialogOpen(true);
  };

  const handleOpenDeleteAccount = (account: ProviderAccount) => {
    setDeletingAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleSubmitProvider = () => {
    if (!providerForm.name.trim() || !providerForm.slug.trim()) return;
    createProvider(providerForm);
    setProviderDialogOpen(false);
  };

  const handleSubmitAccount = () => {
    if (!accountForm.provider_id || !accountForm.name.trim()) return;
    
    // Build credentials from fields
    const credentials: Record<string, string> = {};
    credentialFields.forEach(field => {
      if (field.key.trim()) {
        credentials[field.key.trim()] = field.value;
      }
    });

    const formData = { ...accountForm, credentials };

    if (editingAccount) {
      updateAccount({ id: editingAccount.id, formData });
    } else {
      createAccount(formData);
    }
    setAccountDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingAccount) {
      deleteAccount(deletingAccount.id);
    }
    setDeleteDialogOpen(false);
    setDeletingAccount(null);
  };

  const addCredentialField = () => {
    setCredentialFields(prev => [...prev, { key: '', value: '' }]);
  };

  const removeCredentialField = (index: number) => {
    setCredentialFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateCredentialField = (index: number, field: 'key' | 'value', value: string) => {
    setCredentialFields(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const getAccountStatus = (account: ProviderAccount) => {
    if (!account.is_active) {
      return { label: 'Nonaktif', variant: 'secondary' as const };
    }
    if (account.cooldown_until && new Date(account.cooldown_until) > new Date()) {
      return { label: 'Cooldown', variant: 'destructive' as const };
    }
    if (account.max_daily_invites && (account.current_daily_invites || 0) >= account.max_daily_invites) {
      return { label: 'Limit', variant: 'outline' as const };
    }
    return { label: 'Aktif', variant: 'default' as const };
  };

  return (
    <AdminLayout 
      title="Provider Accounts" 
      description="Kelola akun provider untuk produk INVITE"
    >
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Akun Provider</TabsTrigger>
          <TabsTrigger value="providers">Daftar Provider</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Provider</SelectItem>
                {providers?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleOpenCreateAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Akun
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Provider</p>
                      <p className="text-2xl font-bold">{stats.totalProviders}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Users className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Akun</p>
                      <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aktif</p>
                      <p className="text-2xl font-bold">{stats.activeAccounts}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cooldown</p>
                      <p className="text-2xl font-bold">{stats.cooldownAccounts}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Accounts Table */}
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Invite Hari Ini</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Digunakan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada akun provider ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts?.map((account) => {
                    const status = getAccountStatus(account);
                    
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-primary/10">
                              <Key className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{account.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.provider?.name || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {account.current_daily_invites || 0} / {account.max_daily_invites || '∞'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {account.last_invite_at 
                            ? format(new Date(account.last_invite_at), 'd MMM HH:mm', { locale: localeId })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Switch
                              checked={account.is_active}
                              onCheckedChange={(checked) => toggleAccount({ id: account.id, isActive: checked })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => resetDailyInvites(account.id)}
                              title="Reset counter harian"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditAccount(account)}
                              title="Edit akun"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleOpenDeleteAccount(account)}
                              title="Hapus akun"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleOpenCreateProvider}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Provider
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))
            ) : providers?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Belum ada provider. Tambahkan provider baru untuk memulai.
              </div>
            ) : (
              providers?.map((provider) => (
                <div key={provider.id} className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{provider.name}</h3>
                    </div>
                    <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                      {provider.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Slug: <code className="bg-muted px-1 rounded">{provider.slug}</code>
                  </p>
                  {provider.description && (
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {accounts?.filter(a => a.provider_id === provider.id).length || 0} akun terdaftar
                  </p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Provider Dialog */}
      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Provider Baru</DialogTitle>
            <DialogDescription>
              Provider adalah layanan seperti ChatGPT Team, Canva, Spotify, dll.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider_name">Nama Provider *</Label>
              <Input
                id="provider_name"
                placeholder="Contoh: ChatGPT Team"
                value={providerForm.name}
                onChange={(e) => setProviderForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider_slug">Slug *</Label>
              <Input
                id="provider_slug"
                placeholder="Contoh: chatgpt-team"
                value={providerForm.slug}
                onChange={(e) => setProviderForm(prev => ({ 
                  ...prev, 
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider_desc">Deskripsi</Label>
              <Textarea
                id="provider_desc"
                placeholder="Deskripsi singkat..."
                value={providerForm.description || ''}
                onChange={(e) => setProviderForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="provider_active"
                checked={providerForm.is_active}
                onCheckedChange={(checked) => setProviderForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="provider_active">Aktif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitProvider}
              disabled={!providerForm.name.trim() || !providerForm.slug.trim() || isCreatingProvider}
            >
              {isCreatingProvider ? 'Menyimpan...' : 'Tambah Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Akun Provider' : 'Tambah Akun Provider'}
            </DialogTitle>
            <DialogDescription>
              Akun digunakan untuk mengirim invite ke customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account_provider">Provider *</Label>
              <Select
                value={accountForm.provider_id}
                onValueChange={(v) => setAccountForm(prev => ({ ...prev, provider_id: v }))}
                disabled={!!editingAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account_name">Nama Akun *</Label>
              <Input
                id="account_name"
                placeholder="Contoh: Akun GPT #1"
                value={accountForm.name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="max_invites">Maks. Invite per Hari</Label>
              <Input
                id="max_invites"
                type="number"
                min={1}
                value={accountForm.max_daily_invites || ''}
                onChange={(e) => setAccountForm(prev => ({ 
                  ...prev, 
                  max_daily_invites: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Credentials</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCredentialField}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Field
                </Button>
              </div>
              <div className="space-y-2">
                {credentialFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key (email, password, token...)"
                      value={field.key}
                      onChange={(e) => updateCredentialField(index, 'key', e.target.value)}
                      className="w-1/3"
                    />
                    <div className="flex-1 relative">
                      <Input
                        type={showCredentials[`field-${index}`] ? 'text' : 'password'}
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) => updateCredentialField(index, 'value', e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowCredentials(prev => ({ 
                          ...prev, 
                          [`field-${index}`]: !prev[`field-${index}`] 
                        }))}
                      >
                        {showCredentials[`field-${index}`] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    {credentialFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCredentialField(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="account_active"
                checked={accountForm.is_active}
                onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="account_active">Aktif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitAccount}
              disabled={!accountForm.provider_id || !accountForm.name.trim() || isCreatingAccount || isUpdating}
            >
              {isCreatingAccount || isUpdating ? 'Menyimpan...' : editingAccount ? 'Simpan' : 'Tambah Akun'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus akun <strong>{deletingAccount?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
