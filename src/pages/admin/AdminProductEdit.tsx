import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAdminProduct, useCreateProduct, useUpdateProduct, useCategories, ProductFormData } from '@/hooks/useAdminProducts';
import type { Database } from '@/integrations/supabase/types';

type ProductType = Database['public']['Enums']['product_type'];

export default function AdminProductEdit() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isNew = !productId || productId === 'new';

  const { data: product, isLoading: productLoading } = useAdminProduct(productId || '');
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    image_url: '',
    retail_price: 0,
    reseller_price: null,
    product_type: 'STOCK',
    is_active: true,
    is_featured: false,
    category_id: null,
    duration_days: null,
  });

  useEffect(() => {
    if (product && !isNew) {
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        short_description: product.short_description || '',
        image_url: product.image_url || '',
        retail_price: product.retail_price,
        reseller_price: product.reseller_price,
        product_type: product.product_type,
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        category_id: product.category_id,
      });
    }
  }, [product, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNew) {
      await createProduct.mutateAsync(formData);
      navigate('/admin/products');
    } else if (productId) {
      await updateProduct.mutateAsync({ id: productId, data: formData });
      navigate('/admin/products');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  if (!isNew && productLoading) {
    return (
      <AdminLayout title="Edit Produk" description="Memuat...">
        <div className="space-y-6">
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <AdminLayout 
      title={isNew ? 'Tambah Produk Baru' : 'Edit Produk'}
      description={isNew ? 'Buat produk baru untuk katalog Anda' : `Edit ${product?.name || ''}`}
    >
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: isNew ? generateSlug(e.target.value) : formData.slug,
                        });
                      }}
                      placeholder="Contoh: Netflix Premium 1 Bulan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug URL *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="contoh: netflix-premium-1-bulan"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Deskripsi Singkat</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description || ''}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Deskripsi singkat untuk kartu produk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Lengkap</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi lengkap produk..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Harga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="retail_price">Harga Retail (Rp) *</Label>
                    <Input
                      id="retail_price"
                      type="number"
                      min="0"
                      value={formData.retail_price}
                      onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reseller_price">Harga Reseller (Rp)</Label>
                    <Input
                      id="reseller_price"
                      type="number"
                      min="0"
                      value={formData.reseller_price || ''}
                      onChange={(e) => setFormData({ ...formData, reseller_price: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Pengaturan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_type">Tipe Produk *</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value: ProductType) => setFormData({ ...formData, product_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK">Stock (Akun/Voucher)</SelectItem>
                      <SelectItem value="INVITE">Invite (Undangan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Kategori</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Aktif</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">Produk Unggulan</Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isNew ? 'Simpan Produk' : 'Perbarui Produk'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
