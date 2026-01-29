import { useParams, Link } from 'react-router-dom';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/format';
import { 
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Bayar', class: 'text-warning', icon: Clock },
  PAID: { label: 'Dibayar', class: 'text-success', icon: CheckCircle },
  PROCESSING: { label: 'Diproses', class: 'text-primary', icon: Package },
  DELIVERED: { label: 'Dikirim', class: 'text-success', icon: CheckCircle },
  FAILED: { label: 'Gagal', class: 'text-destructive', icon: XCircle },
  CANCELLED: { label: 'Dibatalkan', class: 'text-destructive', icon: XCircle },
};

export default function ResellerOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error } = useOrder(orderId || '');

  if (isLoading) {
    return (
      <ResellerLayout title="Detail Pesanan" description="Memuat...">
        <Card className="glass-card">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
      </ResellerLayout>
    );
  }

  if (error || !order) {
    return (
      <ResellerLayout title="Detail Pesanan" description="Pesanan tidak ditemukan">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
              <p className="text-lg font-medium mb-2">Pesanan tidak ditemukan</p>
              <p className="text-muted-foreground mb-4">
                Pesanan dengan ID ini tidak tersedia atau Anda tidak memiliki akses.
              </p>
              <Link to="/reseller/orders">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Daftar Pesanan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </ResellerLayout>
    );
  }

  const status = statusConfig[order.status] || statusConfig.AWAITING_PAYMENT;
  const StatusIcon = status.icon;

  return (
    <ResellerLayout 
      title={`Pesanan #${order.id.slice(0, 8)}`}
      description="Detail pesanan customer"
    >
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/reseller/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Info */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Info Pesanan
              </CardTitle>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.class} bg-opacity-10`}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
            </div>
            <CardDescription>
              Dibuat: {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium mb-3">Info Customer</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_email}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-3">Produk</h4>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
                  >
                    {item.product_image ? (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Data */}
            {order.items.some(item => item.delivery_data) && (
              <div>
                <h4 className="font-medium mb-3">Data Delivery</h4>
                {order.items.map((item) => (
                  item.delivery_data && (
                    <div key={item.id} className="p-4 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-sm font-medium mb-2">{item.product_name}</p>
                      <pre className="text-sm whitespace-pre-wrap font-mono text-success">
                        {typeof item.delivery_data === 'string' 
                          ? item.delivery_data 
                          : JSON.stringify(item.delivery_data, null, 2)
                        }
                      </pre>
                    </div>
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="glass-card h-fit">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Diskon</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.points_discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Poin ({order.points_used} poin)</span>
                  <span>-{formatCurrency(order.points_discount)}</span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            {/* Actions */}
            {order.status === 'AWAITING_PAYMENT' && (
              <Link to={`/invoice/${order.id}`} className="block">
                <Button className="w-full btn-premium">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span>Lihat Invoice & Bayar</span>
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </ResellerLayout>
  );
}
