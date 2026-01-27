import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts, useCategories } from '@/hooks/useProducts';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const categorySlug = searchParams.get('category') || undefined;
  const productType = searchParams.get('type') || undefined;
  const sortBy = searchParams.get('sort') || 'featured';

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Filter by category
    if (categorySlug) {
      result = result.filter((p) => p.category?.slug === categorySlug);
    }

    // Filter by type
    if (productType) {
      result = result.filter((p) => p.product_type === productType);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.short_description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.retail_price - b.retail_price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.retail_price - a.retail_price);
        break;
      case 'newest':
        // Default order is by sort_order, which works for featured
        break;
      case 'popular':
        result.sort((a, b) => b.total_sold - a.total_sold);
        break;
      default:
        // Featured first, then by sort_order
        result.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return 0;
        });
    }

    return result;
  }, [products, categorySlug, productType, searchQuery, sortBy]);

  const updateParams = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const hasActiveFilters = categorySlug || productType || searchQuery;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Katalog Produk</h1>
          <p className="mt-1 text-muted-foreground">
            Temukan produk digital premium yang kamu butuhkan
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <Select
              value={categorySlug || 'all'}
              onValueChange={(v) => updateParams('category', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={productType || 'all'}
              onValueChange={(v) => updateParams('type', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="STOCK">Stok</SelectItem>
                <SelectItem value="INVITE">Invite</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => updateParams('sort', v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Unggulan</SelectItem>
                <SelectItem value="popular">Terpopuler</SelectItem>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price-asc">Harga Terendah</SelectItem>
                <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter aktif:</span>
            {categorySlug && (
              <Badge variant="secondary" className="gap-1">
                {categories?.find((c) => c.slug === categorySlug)?.name || categorySlug}
                <button onClick={() => updateParams('category', null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {productType && (
              <Badge variant="secondary" className="gap-1">
                {productType === 'STOCK' ? 'Stok' : 'Invite'}
                <button onClick={() => updateParams('type', null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredProducts.length} produk
          </p>
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={filteredProducts}
          isLoading={isLoading}
          emptyMessage="Tidak ada produk yang sesuai dengan filter"
        />
      </div>
    </MainLayout>
  );
}
