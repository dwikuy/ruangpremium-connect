import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Edit, Trash2, Package, RefreshCw } from 'lucide-react';
import { useAdminProducts, useUpdateProduct, useDeleteProduct } from '@/hooks/useAdminProducts';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const { data: products, isLoading, refetch } = useAdminProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateProduct.mutate({ id, data: { is_active: !isActive } });
  };

  const handleToggleFeatured = (id: string, isFeatured: boolean) => {
    updateProduct.mutate({ id, data: { is_featured: !isFeatured } });
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id);
  };

  return (
    <AdminLayout title="Produk" description="Kelola katalog produk">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Daftar Produk</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button asChild>
                <Link to="/admin/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Produk
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead>Unggulan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category_name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(product.retail_price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.product_type === 'STOCK' ? 'default' : 'secondary'}>
                          {product.product_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.product_type === 'STOCK' ? (
                          <Badge 
                            variant={product.stock_count && product.stock_count > 5 ? 'outline' : 'destructive'}
                          >
                            {product.stock_count || 0}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.is_active || false}
                          onCheckedChange={() => handleToggleActive(product.id, product.is_active || false)}
                          disabled={updateProduct.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.is_featured || false}
                          onCheckedChange={() => handleToggleFeatured(product.id, product.is_featured || false)}
                          disabled={updateProduct.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/products/${product.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus produk "{product.name}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {search ? 'Tidak ada produk ditemukan' : 'Belum ada produk'}
              </p>
              <Button asChild>
                <Link to="/admin/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Produk Pertama
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
