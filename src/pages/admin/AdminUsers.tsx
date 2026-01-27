import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminUsers, UserWithRole } from '@/hooks/useAdminUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, UserCog, Shield, Users, Store } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { AppRole } from '@/types/database';

const roleConfig: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof Shield }> = {
  admin: { label: 'Admin', variant: 'destructive', icon: Shield },
  reseller: { label: 'Reseller', variant: 'default', icon: Store },
  member: { label: 'Member', variant: 'secondary', icon: Users },
};

export default function AdminUsers() {
  const { users, isLoading, updateRole, isUpdating } = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
    newRole: AppRole | null;
  }>({ open: false, user: null, newRole: null });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (user: UserWithRole, newRole: AppRole) => {
    if (newRole === user.role) return;
    setConfirmDialog({ open: true, user, newRole });
  };

  const confirmRoleChange = () => {
    if (confirmDialog.user && confirmDialog.newRole) {
      updateRole({ userId: confirmDialog.user.user_id, newRole: confirmDialog.newRole });
    }
    setConfirmDialog({ open: false, user: null, newRole: null });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AdminLayout 
      title="Manajemen Pengguna" 
      description="Kelola pengguna dan role akses"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Member</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.role === 'member').length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reseller</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.role === 'reseller').length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Admin</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.role === 'admin').length || 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="reseller">Reseller</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada pengguna ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => {
                const config = roleConfig[user.role];
                const RoleIcon = config.icon;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name || 'Tanpa Nama'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phone || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), 'd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user, value as AppRole)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <UserCog className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="reseller">Reseller</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, user: null, newRole: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Role</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengubah role <strong>{confirmDialog.user?.name}</strong> dari{' '}
              <Badge variant={roleConfig[confirmDialog.user?.role || 'member'].variant} className="mx-1">
                {roleConfig[confirmDialog.user?.role || 'member'].label}
              </Badge>{' '}
              menjadi{' '}
              <Badge variant={roleConfig[confirmDialog.newRole || 'member'].variant} className="mx-1">
                {roleConfig[confirmDialog.newRole || 'member'].label}
              </Badge>
              . Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Ya, Ubah Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
