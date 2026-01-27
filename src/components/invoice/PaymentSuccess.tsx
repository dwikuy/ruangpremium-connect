import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/format';
import type { OrderWithItems } from '@/types/database';

interface PaymentSuccessProps {
  order: OrderWithItems;
  guestToken?: string | null;
}

export function PaymentSuccess({ order, guestToken }: PaymentSuccessProps) {
  const trackingUrl = guestToken 
    ? `/track/${order.id}?token=${guestToken}`
    : `/account/orders/${order.id}`;

  const getStatusBadge = () => {
    switch (order.status) {
      case 'PAID':
        return <Badge className="bg-blue-500">Diproses</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-yellow-500">Sedang Diproses</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-500">Selesai</Badge>;
      default:
        return <Badge>{order.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="glass-card border-green-500/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-500">Pembayaran Berhasil!</h2>
              <p className="text-muted-foreground mt-1">
                Terima kasih! Pesanan Anda sedang diproses.
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ringkasan Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Separator />

          <div className="space-y-2">
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
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-gold">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibayar pada</span>
              <span>{order.paid_at ? formatDate(order.paid_at) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{order.customer_email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {order.status === 'PAID' || order.status === 'PROCESSING' ? (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Pesanan Sedang Diproses</p>
                <p className="text-sm text-muted-foreground">
                  Kami sedang memproses pesanan Anda. Hasil akan dikirim segera.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Delivery Result (if delivered) */}
      {order.status === 'DELIVERED' && order.items.some(item => item.delivery_data) && (
        <Card className="glass-card border-gold/50">
          <CardHeader>
            <CardTitle className="text-lg text-gold">Hasil Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              item.delivery_data && (
                <div key={item.id} className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">{item.product_name}</p>
                  <pre className="text-sm bg-background p-3 rounded overflow-x-auto">
                    {JSON.stringify(item.delivery_data, null, 2)}
                  </pre>
                </div>
              )
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 btn-premium">
          <Link to={trackingUrl}>
            Lacak Pesanan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/products">Lanjut Belanja</Link>
        </Button>
      </div>
    </div>
  );
}
