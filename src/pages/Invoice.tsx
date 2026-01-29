import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { QRCodeDisplay } from '@/components/invoice/QRCodeDisplay';
import { PaymentSuccess } from '@/components/invoice/PaymentSuccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { formatCurrency } from '@/lib/format';

export default function Invoice() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('token');

  const {
    loading,
    error,
    order,
    payment,
    isPaid,
    isExpired,
    createPayment,
  } = usePayment(orderId || '', guestToken);

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 max-w-2xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[500px] rounded-lg" />
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container py-16 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Pesanan Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'Pesanan yang Anda cari tidak ditemukan atau Anda tidak memiliki akses.'}
          </p>
          <Button asChild>
            <Link to="/products">Kembali ke Katalog</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // If paid, show success page
  if (isPaid) {
    return (
      <MainLayout>
        <div className="container py-8 max-w-2xl mx-auto">
          <PaymentSuccess order={order} guestToken={guestToken} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Invoice Pembayaran</h1>
            <p className="text-muted-foreground text-sm">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Lanjut Belanja
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Error banner (keep order visible) */}
          {error && (
            <Card className="glass-card border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold">Gagal memproses pembayaran</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Section */}
          <QRCodeDisplay
            payment={payment}
            amount={order.total_amount}
            loading={loading}
            isExpired={isExpired}
            onCreatePayment={createPayment}
          />

          {/* Order Details */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Detail Pesanan
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Diskon</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  {order.points_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Diskon Poin</span>
                      <span>-{formatCurrency(order.points_discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span className="text-gold">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Informasi Pembeli</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama</span>
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{order.customer_email}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
