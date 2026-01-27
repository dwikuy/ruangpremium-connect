import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/format';
import { Search, TrendingUp, Package, ShoppingCart, ArrowUpDown } from 'lucide-react';

type SortField = 'name' | 'retail_price' | 'margin' | 'margin_percent';
type SortOrder = 'asc' | 'desc';

export default function ResellerProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('margin_percent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  // Filter and calculate margins
  const productsWithMargin = products
    ?.filter((p) => p.is_active && p.reseller_price !== null)
    .map((p) => {
      const resellerPrice = p.reseller_price || p.retail_price;
      const margin = p.retail_price - resellerPrice;
      const marginPercent = resellerPrice > 0 ? (margin / resellerPrice) * 100 : 0;
      return { ...p, margin, marginPercent, resellerPrice };
    })
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category?.id === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'retail_price':
          comparison = a.retail_price - b.retail_price;
          break;
        case 'margin':
          comparison = a.margin - b.margin;
          break;
        case 'margin_percent':
          comparison = a.marginPercent - b.marginPercent;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    }) || [];

  // Calculate stats
  const totalProducts = productsWithMargin.length;
  const avgMargin =
    totalProducts > 0
      ? productsWithMargin.reduce((sum, p) => sum + p.margin, 0) / totalProducts
      : 0;
  const avgMarginPercent =
    totalProducts > 0
      ? productsWithMargin.reduce((sum, p) => sum + p.marginPercent, 0) / totalProducts
      : 0;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown
        className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`}
      />
    </button>
  );

  return (
    <ResellerLayout
      title="Daftar Produk"
      description="Lihat harga reseller dan margin keuntungan"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Produk</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Margin</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(avgMargin)}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Margin %</p>
                <p className="text-2xl font-bold text-success">{avgMarginPercent.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Produk dengan Harga Reseller</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : productsWithMargin.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Tidak ada produk yang sesuai filter'
                  : 'Belum ada produk dengan harga reseller'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      <SortButton field="name">Produk</SortButton>
                    </TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">
                      <SortButton field="retail_price">Harga Retail</SortButton>
                    </TableHead>
                    <TableHead className="text-right">Harga Reseller</TableHead>
                    <TableHead className="text-right">
                      <SortButton field="margin">Margin</SortButton>
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton field="margin_percent">Margin %</SortButton>
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsWithMargin.map((product) => (
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
                            {product.duration_days && (
                              <p className="text-xs text-muted-foreground">
                                {product.duration_days} hari
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">{product.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.retail_price)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(product.resellerPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-success font-medium">
                          +{formatCurrency(product.margin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={product.marginPercent >= 20 ? 'default' : 'secondary'}
                          className={product.marginPercent >= 20 ? 'bg-success' : ''}
                        >
                          {product.marginPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/reseller/checkout/${product.id}`}>
                          <Button size="sm" className="gap-1">
                            <ShoppingCart className="h-4 w-4" />
                            <span className="hidden sm:inline">Beli</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
