import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminCoupons, Coupon, CouponFormData } from '@/hooks/useAdminCoupons';
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
import { Plus, Pencil, Trash2, Ticket, Search, Percent, Banknote, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import type { DiscountType } from '@/types/database';

const defaultFormData: CouponFormData = {
  code: '',
  description: '',
  discount_type: 'PERCENTAGE',
  discount_value: 10,
  min_purchase: null,
  max_discount: null,
  usage_limit: null,
  per_user_limit: 1,
  starts_at: null,
  expires_at: null,
  is_active: true,
};

export default function AdminCoupons() {
  const { 
    coupons, 
    isLoading, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon,
    toggleActive,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
  } = useAdminCoupons();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);

  const filteredCoupons = coupons?.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && coupon.is_active) ||
      (statusFilter === 'inactive' && !coupon.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      per_user_limit: coupon.per_user_limit,
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : null,
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : null,
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (coupon: Coupon) => {
    setDeletingCoupon(coupon);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || formData.discount_value <= 0) return;

    const submitData = {
      ...formData,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
    };

    if (editingCoupon) {
      updateCoupon({ id: editingCoupon.id, formData: submitData });
    } else {
      createCoupon(submitData);
    }
    setDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingCoupon) {
      deleteCoupon(deletingCoupon.id);
    }
    setDeleteDialogOpen(false);
    setDeletingCoupon(null);
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'Nonaktif', variant: 'secondary' as const };
    
    const now = new Date();
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { label: 'Kadaluarsa', variant: 'destructive' as const };
    }
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { label: 'Terjadwal', variant: 'outline' as const };
    }
    if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
      return { label: 'Habis', variant: 'destructive' as const };
    }
    return { label: 'Aktif', variant: 'default' as const };
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'PERCENTAGE') {
      return `${coupon.discount_value}%`;
    }
    return formatCurrency(coupon.discount_value);
  };

  return (
    <AdminLayout 
      title="Manajemen Kupon" 
      description="Kelola kupon diskon"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode kupon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Kupon</p>
                  <p className="text-2xl font-bold">{coupons?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Ticket className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold">
                    {coupons?.filter(c => c.is_active).length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <Percent className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Persentase</p>
                  <p className="text-2xl font-bold">
                    {coupons?.filter(c => c.discount_type === 'PERCENTAGE').length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nominal</p>
                  <p className="text-2xl font-bold">
                    {coupons?.filter(c => c.discount_type === 'FIXED').length || 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Coupons Table */}
      <div className="border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Diskon</TableHead>
              <TableHead>Min. Pembelian</TableHead>
              <TableHead>Penggunaan</TableHead>
              <TableHead>Berlaku</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCoupons?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Tidak ada kupon ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons?.map((coupon) => {
                const status = getCouponStatus(coupon);
                
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-primary/10">
                          <Ticket className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <code className="font-semibold text-sm">{coupon.code}</code>
                          {coupon.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {coupon.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === 'PERCENTAGE' ? (
                          <Percent className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Banknote className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-medium">{formatDiscount(coupon)}</span>
                      </div>
                      {coupon.max_discount && coupon.discount_type === 'PERCENTAGE' && (
                        <p className="text-xs text-muted-foreground">
                          Maks: {formatCurrency(coupon.max_discount)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coupon.min_purchase ? formatCurrency(coupon.min_purchase) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {coupon.usage_count || 0}
                          {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {coupon.starts_at && coupon.expires_at ? (
                          <span>
                            {format(new Date(coupon.starts_at), 'd MMM', { locale: localeId })} - {format(new Date(coupon.expires_at), 'd MMM yy', { locale: localeId })}
                          </span>
                        ) : coupon.expires_at ? (
                          <span>s/d {format(new Date(coupon.expires_at), 'd MMM yy', { locale: localeId })}</span>
                        ) : (
                          <span>Selamanya</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={(checked) => toggleActive({ id: coupon.id, isActive: checked })}
                          disabled={isToggling}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(coupon)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Edit Kupon' : 'Tambah Kupon Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon 
                ? 'Perbarui informasi kupon diskon' 
                : 'Buat kupon diskon baru untuk pelanggan'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Kode Kupon *</Label>
              <Input
                id="code"
                placeholder="Contoh: DISKON10"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="uppercase"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat kupon..."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount_type">Tipe Diskon</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, discount_type: v as DiscountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                    <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="discount_value">
                  Nilai Diskon *
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  min={0}
                  max={formData.discount_type === 'PERCENTAGE' ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_purchase">Min. Pembelian</Label>
                <Input
                  id="min_purchase"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.min_purchase || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_purchase: e.target.value ? parseFloat(e.target.value) : null }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max_discount">Maks. Diskon</Label>
                <Input
                  id="max_discount"
                  type="number"
                  min={0}
                  placeholder="Tidak terbatas"
                  value={formData.max_discount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_discount: e.target.value ? parseFloat(e.target.value) : null }))}
                  disabled={formData.discount_type === 'FIXED'}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usage_limit">Batas Penggunaan</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min={1}
                  placeholder="Tidak terbatas"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="per_user_limit">Per User</Label>
                <Input
                  id="per_user_limit"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={formData.per_user_limit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, per_user_limit: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="starts_at">Mulai Berlaku</Label>
                <Input
                  id="starts_at"
                  type="date"
                  value={formData.starts_at || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value || null }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="expires_at">Berakhir</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value || null }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.code.trim() || formData.discount_value <= 0 || isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Menyimpan...' : editingCoupon ? 'Simpan Perubahan' : 'Tambah Kupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kupon</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus kupon <strong>{deletingCoupon?.code}</strong>?
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
