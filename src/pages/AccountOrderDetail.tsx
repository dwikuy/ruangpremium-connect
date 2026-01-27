import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useOrder } from '@/hooks/useOrders';
import { formatCurrency, formatDate } from '@/lib/format';
import { 
  ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle,
  Copy, ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; color: string }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Pembayaran', variant: 'outline', icon: Clock, color: 'text-yellow-500' },
  PAID: { label: 'Dibayar', variant: 'default', icon: CheckCircle, color: 'text-blue-500' },
  PROCESSING: { label: 'Diproses', variant: 'secondary', icon: Package, color: 'text-purple-500' },
  DELIVERED: { label: 'Selesai', variant: 'default', icon: CheckCircle, color: 'text-green-500' },
  FAILED: { label: 'Gagal', variant: 'destructive', icon: XCircle, color: 'text-red-500' },
  CANCELLED: { label: 'Dibatalkan', variant: 'destructive', icon: AlertCircle, color: 'text-gray-500' },
};

export default function AccountOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error } = useOrder(orderId || '');
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Disalin!',
      description: `${label} berhasil disalin ke clipboard.`,
    });
  };

  if (!orderId) {
    return <Navigate to="/account/orders" replace />;
  }

  if (isLoading) {
    return (
      <AccountLayout title="Detail Pesanan">
        <Skeleton className="h-[400px]" />
      </AccountLayout>
    );
  }

  if (error || !order) {
    return (
      <AccountLayout title="Detail Pesanan">
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">Pesanan tidak ditemukan</p>
            <Button asChild>
              <Link to="/account/orders">Kembali ke Riwayat</Link>
            </Button>
          </CardContent>
        </Card>
      </AccountLayout>
    );
  }

  const status = statusConfig[order.status] || statusConfig.AWAITING_PAYMENT;
  const StatusIcon = status.icon;

  return (
    <AccountLayout title="Detail Pesanan">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/account/orders">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Card */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-muted ${status.color}`}>
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant={status.variant} className="mb-1">
                    {status.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Order ID: #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Produk yang Dibeli</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x @ {formatCurrency(item.unit_price)}
                    </p>
                    <p className="text-sm font-medium text-gold">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>

                  {/* Delivery Data */}
                  {item.delivered_at && item.delivery_data && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Terkirim
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {/* Show delivery data for completed orders */}
              {order.status === 'DELIVERED' && order.items.some(item => item.delivery_data) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">Data Pengiriman</h4>
                    {order.items.map((item) => {
                      if (!item.delivery_data) return null;
                      const deliveryData = item.delivery_data as { type?: string; items?: string[] };
                      
                      if (deliveryData.type === 'STOCK' && deliveryData.items) {
                        return (
                          <div key={item.id} className="space-y-2">
                            <p className="text-sm text-muted-foreground">{item.product_name}:</p>
                            {deliveryData.items.map((secret: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                                <code className="flex-1 text-sm break-all">{secret}</code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(secret, 'Kode')}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (deliveryData.type === 'INVITE') {
                        return (
                          <div key={item.id} className="p-3 bg-green-500/10 rounded-lg">
                            <p className="text-sm text-green-500">
                              ✓ Undangan telah dikirim ke email tujuan
                            </p>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>Diskon Kupon</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}

              {order.points_discount > 0 && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>Diskon Poin ({order.points_used})</span>
                  <span>-{formatCurrency(order.points_discount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-gold">{formatCurrency(order.total_amount)}</span>
              </div>

              <Separator />

              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Order</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>

                {order.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dibayar</span>
                    <span>{formatDate(order.paid_at)}</span>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dikirim</span>
                    <span>{formatDate(order.delivered_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {order.status === 'AWAITING_PAYMENT' && order.payment?.pay_url && (
            <Button className="btn-premium w-full" asChild>
              <a href={order.payment.pay_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Bayar Sekarang
              </a>
            </Button>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
