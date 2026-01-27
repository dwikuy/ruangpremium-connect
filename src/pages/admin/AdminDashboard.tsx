import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAdminStats, useRecentOrders } from '@/hooks/useAdminStats';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AWAITING_PAYMENT: { label: 'Menunggu', variant: 'secondary' },
  PAID: { label: 'Dibayar', variant: 'default' },
  PROCESSING: { label: 'Proses', variant: 'default' },
  DELIVERED: { label: 'Selesai', variant: 'outline' },
  FAILED: { label: 'Gagal', variant: 'destructive' },
  CANCELLED: { label: 'Dibatalkan', variant: 'destructive' },
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(5);

  return (
    <AdminLayout title="Dashboard" description="Ringkasan toko Anda">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pesanan
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-gold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan Hari Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold text-green-500">
                {formatCurrency(stats?.todayRevenue || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produk Aktif
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeProducts || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="glass-card border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Pembayaran</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-12 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{stats?.pendingOrders || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-12 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{stats?.paidOrders || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-12 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{stats?.deliveredOrders || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats && stats.lowStockProducts > 0 && (
        <Card className="glass-card border-orange-500/30 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <p className="text-sm">
                <span className="font-medium text-orange-500">{stats.lowStockProducts} produk</span>{' '}
                memiliki stok rendah (kurang dari 5 item)
              </p>
              <Button variant="outline" size="sm" asChild className="ml-auto">
                <Link to="/admin/products">Kelola Stok</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pesanan Terbaru</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/orders">
              Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                    <Badge variant={statusConfig[order.status]?.variant || 'secondary'}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Belum ada pesanan
            </p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
