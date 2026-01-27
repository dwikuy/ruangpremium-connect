import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Zap, Check, Star, ShoppingCart, AlertTriangle, Store } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useProduct } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/format';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const { profile, isReseller, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <ProductDetailSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Produk Tidak Ditemukan</h1>
            <p className="mb-6 text-muted-foreground">
              Produk yang kamu cari tidak ada atau sudah tidak tersedia.
            </p>
            <Button asChild>
              <Link to="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Katalog
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isStock = product.product_type === 'STOCK';
  const isAvailable = isStock ? (product.stock_count || 0) > 0 : true;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition-colors">
            Produk
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                to={`/products?category=${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {product.is_featured && (
                  <Badge className="badge-featured gap-1">
                    <Star className="h-3 w-3" />
                    Unggulan
                  </Badge>
                )}
                <Badge className={isStock ? 'badge-stock' : 'badge-invite'}>
                  {isStock ? (
                    <>
                      <Package className="mr-1 h-3 w-3" />
                      Stok Tersedia
                    </>
                  ) : (
                    <>
                      <Zap className="mr-1 h-3 w-3" />
                      Auto Invite
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category & Provider */}
            <div className="flex items-center gap-2">
              {product.category && (
                <Badge variant="outline">{product.category.name}</Badge>
              )}
              {product.provider && (
                <Badge variant="outline">{product.provider.name}</Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-3xl font-bold lg:text-4xl">
              {product.name}
            </h1>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-lg text-muted-foreground">
                {product.short_description}
              </p>
            )}

            {/* Price */}
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gold-gradient">
                {formatRupiah(product.retail_price)}
              </p>
              {product.duration_days && (
                <p className="text-muted-foreground">
                  Durasi: {product.duration_days} hari
                </p>
              )}
            </div>

            {/* Stock Info */}
            {isStock && (
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isAvailable ? 'bg-success' : 'bg-destructive'
                  }`}
                />
                <span className={isAvailable ? 'text-success' : 'text-destructive'}>
                  {isAvailable
                    ? `Stok tersedia: ${product.stock_count}`
                    : 'Stok habis'}
                </span>
              </div>
            )}

            {/* Sold Count */}
            {product.total_sold > 0 && (
              <p className="text-sm text-muted-foreground">
                {product.total_sold}+ terjual
              </p>
            )}

            <Separator />

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Keuntungan</h3>
                <ul className="space-y-2">
                  {product.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-success shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <Button
                  size="lg"
                  className="btn-premium w-full"
                  disabled={!isAvailable}
                  onClick={() => navigate(`/checkout/${product.id}`)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <span>{isAvailable ? 'Beli Sekarang' : 'Stok Habis'}</span>
                </Button>

                {/* Reseller Checkout Button */}
                {(isReseller || isAdmin) && product.reseller_price && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-secondary text-secondary hover:bg-secondary/10"
                    disabled={!isAvailable}
                    onClick={() => navigate(`/reseller/checkout/${product.id}`)}
                  >
                    <Store className="mr-2 h-5 w-5" />
                    <span>Beli Harga Reseller ({formatRupiah(product.reseller_price)})</span>
                  </Button>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  Pembayaran aman via QRIS • Proses otomatis
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-12 space-y-4">
            <h2 className="font-display text-2xl font-bold">Deskripsi Produk</h2>
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground">
                {product.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}
