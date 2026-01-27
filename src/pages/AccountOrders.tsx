import { Link } from 'react-router-dom';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserOrders } from '@/hooks/useOrders';
import { formatCurrency, formatDate } from '@/lib/format';
import { Package, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Pembayaran', variant: 'outline', icon: Clock },
  PAID: { label: 'Dibayar', variant: 'default', icon: CheckCircle },
  PROCESSING: { label: 'Diproses', variant: 'secondary', icon: Package },
  DELIVERED: { label: 'Selesai', variant: 'default', icon: CheckCircle },
  FAILED: { label: 'Gagal', variant: 'destructive', icon: XCircle },
  CANCELLED: { label: 'Dibatalkan', variant: 'destructive', icon: AlertCircle },
};

export default function AccountOrdersPage() {
  const { data: orders, isLoading, error } = useUserOrders();

  if (isLoading) {
    return (
      <AccountLayout title="Riwayat Pesanan" description="Lihat semua pesanan Anda">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout title="Riwayat Pesanan" description="Lihat semua pesanan Anda">
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-muted-foreground">Gagal memuat riwayat pesanan</p>
          </CardContent>
        </Card>
      </AccountLayout>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <AccountLayout title="Riwayat Pesanan" description="Lihat semua pesanan Anda">
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground mb-4">
              Anda belum pernah membuat pesanan. Mulai berbelanja sekarang!
            </p>
            <Button asChild className="btn-premium">
              <Link to="/products">Lihat Produk</Link>
            </Button>
          </CardContent>
        </Card>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="Riwayat Pesanan" description="Lihat semua pesanan Anda">
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status] || statusConfig.AWAITING_PAYMENT;
          const StatusIcon = status.icon;

          return (
            <Card key={order.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Products */}
                    <div className="space-y-1 mb-2">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <span className="text-sm">
                            {item.product_name} x{item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 2} produk lainnya
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-gold">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/account/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AccountLayout>
  );
}
