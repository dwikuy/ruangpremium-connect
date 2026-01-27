import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, User, Package, CreditCard, Clock } from 'lucide-react';
import { useAdminOrderDetail, useUpdateOrderStatus } from '@/hooks/useAdminOrders';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Pembayaran', variant: 'secondary', color: 'text-yellow-500' },
  PAID: { label: 'Dibayar', variant: 'default', color: 'text-blue-500' },
  PROCESSING: { label: 'Diproses', variant: 'default', color: 'text-blue-500' },
  DELIVERED: { label: 'Selesai', variant: 'outline', color: 'text-green-500' },
  FAILED: { label: 'Gagal', variant: 'destructive', color: 'text-red-500' },
  CANCELLED: { label: 'Dibatalkan', variant: 'destructive', color: 'text-red-500' },
};

const statusOptions: OrderStatus[] = [
  'AWAITING_PAYMENT',
  'PAID',
  'PROCESSING',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
];

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useAdminOrderDetail(orderId || '');
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (orderId) {
      updateStatus.mutate({ orderId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Detail Pesanan" description="Memuat...">
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Pesanan Tidak Ditemukan">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Pesanan tidak ditemukan</p>
          <Button asChild>
            <Link to="/admin/orders">Kembali ke Daftar Pesanan</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
      description={`Dibuat pada ${format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}`}
    >
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x @ {formatCurrency(item.unit_price)}
                      </p>
                      {item.delivered_at && (
                        <Badge variant="outline" className="mt-2 text-green-500">
                          Dikirim: {format(new Date(item.delivered_at), 'dd MMM yyyy, HH:mm')}
                        </Badge>
                      )}
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
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Diskon Kupon</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  {order.points_discount && order.points_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Diskon Poin</span>
                      <span>-{formatCurrency(order.points_discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span className="text-gold">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.payment && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Ref ID</p>
                    <p className="font-mono">{order.payment.ref_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tokopay Trx ID</p>
                    <p className="font-mono">{order.payment.tokopay_trx_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                    <Badge variant={order.payment.status === 'PAID' ? 'default' : 'secondary'}>
                      {order.payment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu Bayar</p>
                    <p>{order.payment.paid_at 
                      ? format(new Date(order.payment.paid_at), 'dd MMM yyyy, HH:mm', { locale: id })
                      : '-'
                    }</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status Saat Ini</p>
                  <Badge 
                    variant={statusConfig[order.status]?.variant || 'secondary'}
                    className="text-base px-3 py-1"
                  >
                    {statusConfig[order.status]?.label || order.status}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Ubah Status</p>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusConfig[status]?.label || status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {order.paid_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dibayar</p>
                    <p className="text-sm">{format(new Date(order.paid_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>
                  </div>
                )}

                {order.delivered_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dikirim</p>
                    <p className="text-sm">{format(new Date(order.delivered_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{order.customer_email}</p>
                </div>
                {order.customer_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p>{order.customer_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Tipe</p>
                  <Badge variant="outline">
                    {order.user_id ? 'Member' : 'Guest'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
