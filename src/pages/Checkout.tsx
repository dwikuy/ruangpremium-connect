import { useParams, Navigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Clock, Shield, AlertTriangle } from 'lucide-react';
import { useProductById } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/lib/format';

export default function Checkout() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading: productLoading, error: productError } = useProductById(productId || '');
  const { profile, loading: authLoading } = useAuth();
  const { loading, couponValidation, pointsValidation, validateCoupon, validatePoints, createOrder } = useCheckout(product || null);

  if (!productId) {
    return <Navigate to="/products" replace />;
  }

  if (productLoading || authLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-[400px]" />
            </div>
            <div>
              <Skeleton className="h-[300px]" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (productError || !product) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Produk Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">
            Produk yang Anda cari tidak tersedia atau sudah dihapus.
          </p>
          <Button asChild>
            <Link to="/products">Kembali ke Katalog</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Check stock availability for both STOCK and INVITE products
  const stockAvailable = product.stock_count ?? 0;
  const isOutOfStock = stockAvailable <= 0;

  // If product is out of stock, show error page
  if (isOutOfStock) {
    return (
      <MainLayout>
        <div className="container py-16 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Stok Habis</h1>
          <p className="text-muted-foreground mb-6">
            Maaf, produk <strong>{product.name}</strong> saat ini tidak tersedia. 
            Silakan cek kembali nanti atau pilih produk lain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to={`/products/${product.slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Produk
              </Link>
            </Button>
            <Button asChild>
              <Link to="/products">Lihat Produk Lain</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = (data: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    quantity: number;
    coupon_code?: string;
    points_to_use?: number;
    input_data: Record<string, string>;
  }) => {
    createOrder(
      {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        product_id: product.id,
        quantity: data.quantity,
        input_data: data.input_data,
        coupon_code: data.coupon_code,
        points_to_use: data.points_to_use,
      },
      profile?.user_id
    );
  };

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/products/${product.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>
            <CheckoutForm
              product={product}
              profile={profile}
              couponValidation={couponValidation}
              pointsValidation={pointsValidation}
              loading={loading}
              onValidateCoupon={validateCoupon}
              onValidatePoints={validatePoints}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Right: Product Summary */}
          <div className="space-y-6">
            <Card className="glass-card sticky top-24">
              <CardContent className="pt-6">
                {/* Product Image */}
                {product.image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant={product.product_type === 'STOCK' ? 'default' : 'secondary'}>
                        {product.product_type}
                      </Badge>
                    </div>
                    {product.category && (
                      <p className="text-sm text-muted-foreground">{product.category.name}</p>
                    )}
                  </div>

                  <div className="text-2xl font-bold text-gold">
                    {formatCurrency(product.retail_price)}
                  </div>

                  {product.duration_days && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Masa aktif: {product.duration_days} hari</span>
                    </div>
                  )}

                  {product.stock_count !== undefined && product.stock_count >= 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span className={product.stock_count > 0 ? 'text-success' : 'text-destructive'}>
                        {product.stock_count > 0 
                          ? `${product.stock_count} ${product.product_type === 'INVITE' ? 'slot' : 'stok'} tersedia` 
                          : 'Stok habis'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-success" />
                    <span>Pembayaran Aman via QRIS</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 text-success" />
                    <span>Pengiriman Instan 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
