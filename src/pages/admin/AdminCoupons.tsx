import { useState, useRef } from 'react';
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
import { Plus, Pencil, Trash2, Ticket, Search, Percent, Banknote, Calendar, Users, Download, Upload, FileSpreadsheet, Shuffle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import type { DiscountType } from '@/types/database';
import { toast } from '@/hooks/use-toast';

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
    bulkImport,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
    isImporting,
  } = useAdminCoupons();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'valid' | 'expired' | 'scheduled'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);
  const [importPreview, setImportPreview] = useState<CouponFormData[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const filteredCoupons = coupons?.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && coupon.is_active) ||
      (statusFilter === 'inactive' && !coupon.is_active);

    const now = new Date();
    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < now;
    const isScheduled = coupon.starts_at && new Date(coupon.starts_at) > now;
    const isValid = !isExpired && !isScheduled;

    const matchesValidity = 
      validityFilter === 'all' ||
      (validityFilter === 'valid' && isValid) ||
      (validityFilter === 'expired' && isExpired) ||
      (validityFilter === 'scheduled' && isScheduled);
    
    return matchesSearch && matchesStatus && matchesValidity;
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

  const handleDuplicate = (coupon: Coupon) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomSuffix = Array.from({ length: 4 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    
    setEditingCoupon(null);
    setFormData({
      code: `${coupon.code}_${randomSuffix}`,
      description: coupon.description ? `Copy of ${coupon.description}` : null,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      per_user_limit: coupon.per_user_limit,
      starts_at: null,
      expires_at: null,
      is_active: false,
    });
    setDialogOpen(true);
    
    toast({
      title: 'Duplikat kupon',
      description: 'Silakan edit kode dan detail kupon baru',
    });
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

  const parseCSV = (text: string): { data: string[][]; headers: string[] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const data = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
    
    return { headers, data };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Format tidak valid',
        description: 'Harap upload file CSV',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { headers, data } = parseCSV(text);
        
        const errors: string[] = [];
        const validCoupons: CouponFormData[] = [];
        
        const codeIdx = headers.indexOf('kode');
        const descIdx = headers.indexOf('deskripsi');
        const typeIdx = headers.indexOf('tipe diskon');
        const valueIdx = headers.indexOf('nilai diskon');
        const minPurchaseIdx = headers.indexOf('min. pembelian');
        const maxDiscountIdx = headers.indexOf('maks. diskon');
        const usageLimitIdx = headers.indexOf('batas penggunaan');
        const perUserIdx = headers.indexOf('per user');
        const startsIdx = headers.indexOf('mulai berlaku');
        const expiresIdx = headers.indexOf('berakhir');
        const statusIdx = headers.indexOf('status');

        if (codeIdx === -1 || valueIdx === -1) {
          errors.push('Kolom "Kode" dan "Nilai Diskon" wajib ada');
          setImportErrors(errors);
          setImportDialogOpen(true);
          return;
        }

        data.forEach((row, idx) => {
          const code = row[codeIdx]?.trim();
          const discountValue = parseFloat(row[valueIdx]) || 0;
          
          if (!code) {
            errors.push(`Baris ${idx + 2}: Kode kupon kosong`);
            return;
          }
          
          if (discountValue <= 0) {
            errors.push(`Baris ${idx + 2}: Nilai diskon harus lebih dari 0`);
            return;
          }

          const typeRaw = row[typeIdx]?.toLowerCase() || '';
          const discountType: DiscountType = typeRaw.includes('persentase') || typeRaw.includes('percentage') 
            ? 'PERCENTAGE' 
            : 'FIXED';

          validCoupons.push({
            code: code.toUpperCase(),
            description: row[descIdx] || null,
            discount_type: discountType,
            discount_value: discountValue,
            min_purchase: minPurchaseIdx >= 0 && row[minPurchaseIdx] ? parseFloat(row[minPurchaseIdx]) : null,
            max_discount: maxDiscountIdx >= 0 && row[maxDiscountIdx] ? parseFloat(row[maxDiscountIdx]) : null,
            usage_limit: usageLimitIdx >= 0 && row[usageLimitIdx] && row[usageLimitIdx] !== 'Tidak terbatas' 
              ? parseInt(row[usageLimitIdx]) 
              : null,
            per_user_limit: perUserIdx >= 0 && row[perUserIdx] ? parseInt(row[perUserIdx]) : 1,
            starts_at: startsIdx >= 0 && row[startsIdx] ? row[startsIdx] : null,
            expires_at: expiresIdx >= 0 && row[expiresIdx] ? row[expiresIdx] : null,
            is_active: statusIdx >= 0 ? row[statusIdx]?.toLowerCase() === 'aktif' : true,
          });
        });

        setImportPreview(validCoupons);
        setImportErrors(errors);
        setImportDialogOpen(true);
      } catch (err) {
        console.error('CSV parse error:', err);
        toast({
          title: 'Gagal membaca file',
          description: 'Format CSV tidak valid',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) return;
    
    try {
      await bulkImport(importPreview);
      setImportDialogOpen(false);
      setImportPreview([]);
      setImportErrors([]);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Kode',
      'Deskripsi',
      'Tipe Diskon',
      'Nilai Diskon',
      'Min. Pembelian',
      'Maks. Diskon',
      'Batas Penggunaan',
      'Per User',
      'Mulai Berlaku',
      'Berakhir',
      'Status',
    ];
    
    const exampleRows = [
      ['DISKON10', 'Diskon 10%', 'Persentase', '10', '50000', '25000', '100', '1', '2024-01-01', '2024-12-31', 'Aktif'],
      ['HEMAT50K', 'Potongan 50rb', 'Nominal', '50000', '200000', '', 'Tidak terbatas', '1', '', '', 'Aktif'],
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_kupon.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const handleExportCSV = () => {
    if (!filteredCoupons || filteredCoupons.length === 0) return;

    const headers = [
      'Kode',
      'Deskripsi',
      'Tipe Diskon',
      'Nilai Diskon',
      'Min. Pembelian',
      'Maks. Diskon',
      'Batas Penggunaan',
      'Per User',
      'Penggunaan',
      'Mulai Berlaku',
      'Berakhir',
      'Status',
      'Dibuat',
    ];

    const rows = filteredCoupons.map(coupon => [
      coupon.code,
      coupon.description || '',
      coupon.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal',
      coupon.discount_value,
      coupon.min_purchase || '',
      coupon.max_discount || '',
      coupon.usage_limit || 'Tidak terbatas',
      coupon.per_user_limit || 1,
      coupon.usage_count || 0,
      coupon.starts_at ? format(new Date(coupon.starts_at), 'yyyy-MM-dd') : '',
      coupon.expires_at ? format(new Date(coupon.expires_at), 'yyyy-MM-dd') : '',
      coupon.is_active ? 'Aktif' : 'Nonaktif',
      format(new Date(coupon.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kupon_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <Select value={validityFilter} onValueChange={(v) => setValidityFilter(v as typeof validityFilter)}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Berlaku" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="valid">Berlaku</SelectItem>
            <SelectItem value="expired">Kadaluarsa</SelectItem>
            <SelectItem value="scheduled">Terjadwal</SelectItem>
          </SelectContent>
        </Select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={!filteredCoupons || filteredCoupons.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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
                      <div className="flex justify-end gap-1">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={(checked) => toggleActive({ id: coupon.id, isActive: checked })}
                          disabled={isToggling}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(coupon)}
                          title="Duplikat kupon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(coupon)}
                          title="Edit kupon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(coupon)}
                          title="Hapus kupon"
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
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="Contoh: DISKON10"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="uppercase flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    const prefix = formData.discount_type === 'PERCENTAGE' 
                      ? `DISC${formData.discount_value || ''}` 
                      : 'PROMO';
                    const randomPart = Array.from({ length: 4 }, () => 
                      chars.charAt(Math.floor(Math.random() * chars.length))
                    ).join('');
                    setFormData(prev => ({ ...prev, code: `${prefix}${randomPart}` }));
                  }}
                  title="Generate kode otomatis"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Klik ikon shuffle untuk generate kode otomatis
              </p>
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Kupon dari CSV
            </DialogTitle>
            <DialogDescription>
              Preview data kupon yang akan diimport
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {importErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm font-medium text-destructive mb-2">
                  {importErrors.length} Error ditemukan:
                </p>
                <ul className="text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
                  {importErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.length > 0 ? (
              <>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="font-semibold text-primary">{importPreview.length}</span> kupon siap diimport
                  </p>
                </div>
                
                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 10).map((coupon, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{coupon.code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {coupon.discount_type === 'PERCENTAGE' ? '%' : 'Rp'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {coupon.discount_type === 'PERCENTAGE' 
                              ? `${coupon.discount_value}%` 
                              : formatCurrency(coupon.discount_value)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                              {coupon.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {importPreview.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            ...dan {importPreview.length - 10} kupon lainnya
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada data valid untuk diimport</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template CSV
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleImportConfirm}
              disabled={importPreview.length === 0 || isImporting}
            >
              {isImporting ? 'Mengimport...' : `Import ${importPreview.length} Kupon`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
