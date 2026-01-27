import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStock, StockItem, StockFormData } from '@/hooks/useAdminStock';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Plus, 
  Trash2, 
  Search, 
  Package, 
  PackageCheck, 
  PackageX, 
  Clock,
  Upload,
  Download,
  FileSpreadsheet,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const defaultFormData: StockFormData = {
  product_id: '',
  secret_data: '',
  expires_at: null,
};

export default function AdminStock() {
  const { 
    stockItems, 
    products,
    stats,
    isLoading, 
    createStock,
    bulkImport,
    deleteStock,
    bulkDelete,
    isCreating,
    isImporting,
    isDeleting,
  } = useAdminStock();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'AVAILABLE' | 'RESERVED' | 'SOLD'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StockFormData>(defaultFormData);
  const [deletingStock, setDeletingStock] = useState<StockItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [importPreview, setImportPreview] = useState<StockFormData[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importProductId, setImportProductId] = useState<string>('');

  const filteredStock = stockItems?.filter(item => {
    const matchesSearch = 
      item.secret_data.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProduct = productFilter === 'all' || item.product_id === productFilter;
    
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: StockItem) => {
    setDeletingStock(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.product_id || !formData.secret_data.trim()) return;
    createStock(formData);
    setDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingStock) {
      deleteStock(deletingStock.id);
    }
    setDeleteDialogOpen(false);
    setDeletingStock(null);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    bulkDelete(selectedItems);
    setSelectedItems([]);
  };

  const toggleSelectAll = () => {
    const availableItems = filteredStock?.filter(s => s.status === 'AVAILABLE') || [];
    if (selectedItems.length === availableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map(s => s.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({
        title: 'Format tidak valid',
        description: 'Harap upload file CSV atau TXT',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = parseCSV(text);
        
        const errors: string[] = [];
        const validItems: StockFormData[] = [];
        
        lines.forEach((row, idx) => {
          const secretData = row[0]?.trim();
          const expiresAt = row[1]?.trim() || null;
          
          if (!secretData) {
            errors.push(`Baris ${idx + 1}: Data kosong`);
            return;
          }

          validItems.push({
            product_id: '', // Will be set from importProductId
            secret_data: secretData,
            expires_at: expiresAt,
          });
        });

        setImportPreview(validItems);
        setImportErrors(errors);
        setImportDialogOpen(true);
      } catch (err) {
        console.error('Parse error:', err);
        toast({
          title: 'Gagal membaca file',
          description: 'Format file tidak valid',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0 || !importProductId) return;
    
    const itemsWithProduct = importPreview.map(item => ({
      ...item,
      product_id: importProductId,
    }));

    try {
      await bulkImport(itemsWithProduct);
      setImportDialogOpen(false);
      setImportPreview([]);
      setImportErrors([]);
      setImportProductId('');
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const downloadTemplate = () => {
    const content = `voucher-code-001\nvoucher-code-002,2024-12-31\nvoucher-code-003`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_stok.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="default" className="bg-green-500">Tersedia</Badge>;
      case 'RESERVED':
        return <Badge variant="secondary">Reserved</Badge>;
      case 'SOLD':
        return <Badge variant="outline">Terjual</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const maskSecret = (secret: string) => {
    if (secret.length <= 8) return '••••••••';
    return secret.substring(0, 4) + '••••' + secret.substring(secret.length - 4);
  };

  return (
    <AdminLayout 
      title="Manajemen Stok" 
      description="Kelola stok voucher dan kode produk"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari stok..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Produk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Produk</SelectItem>
            {products?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="AVAILABLE">Tersedia</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="SOLD">Terjual</SelectItem>
          </SelectContent>
        </Select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Stok
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <PackageCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tersedia</p>
                  <p className="text-2xl font-bold">{stats.available}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold">{stats.reserved}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <PackageX className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terjual</p>
                  <p className="text-2xl font-bold">{stats.sold}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">{selectedItems.length} item dipilih</span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Terpilih
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedItems([])}
          >
            Batal
          </Button>
        </div>
      )}

      {/* Stock Table */}
      <div className="border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length > 0 && selectedItems.length === filteredStock?.filter(s => s.status === 'AVAILABLE').length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Data/Kode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kadaluarsa</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredStock?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Tidak ada stok ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredStock?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.status === 'AVAILABLE' && (
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.product?.name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {showSecrets[item.id] ? item.secret_data : maskSecret(item.secret_data)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowSecrets(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      >
                        {showSecrets[item.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.expires_at 
                      ? format(new Date(item.expires_at), 'd MMM yyyy', { locale: localeId })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(item.created_at), 'd MMM yyyy', { locale: localeId })}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === 'AVAILABLE' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleOpenDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Stok Baru</DialogTitle>
            <DialogDescription>
              Tambahkan voucher atau kode produk baru
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product_id">Produk *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, product_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secret_data">Kode/Voucher *</Label>
              <Textarea
                id="secret_data"
                placeholder="Masukkan kode voucher, data akun, atau informasi rahasia lainnya..."
                value={formData.secret_data}
                onChange={(e) => setFormData(prev => ({ ...prev, secret_data: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expires_at">Tanggal Kadaluarsa</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value || null }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.product_id || !formData.secret_data.trim() || isCreating}
            >
              {isCreating ? 'Menyimpan...' : 'Tambah Stok'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Stok</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus stok ini? Tindakan ini tidak dapat dibatalkan.
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
              Import Stok
            </DialogTitle>
            <DialogDescription>
              Import stok dari file CSV/TXT (satu kode per baris)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Pilih Produk *</Label>
              <Select value={importProductId} onValueChange={setImportProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk untuk stok ini" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {importErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm font-medium text-destructive mb-2">
                  {importErrors.length} Error:
                </p>
                <ul className="text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
                  {importErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-semibold text-primary">{importPreview.length}</span> stok siap diimport
                </p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleImportConfirm}
              disabled={importPreview.length === 0 || !importProductId || isImporting}
            >
              {isImporting ? 'Mengimport...' : `Import ${importPreview.length} Stok`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
