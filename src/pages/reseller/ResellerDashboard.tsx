import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useResellerStats, useResellerOrders } from '@/hooks/useReseller';
import { formatCurrency } from '@/lib/format';
import { 
  Wallet, 
  ShoppingBag, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Bayar', class: 'status-pending', icon: Clock },
  PAID: { label: 'Dibayar', class: 'status-paid', icon: CheckCircle },
  PROCESSING: { label: 'Diproses', class: 'status-processing', icon: Package },
  DELIVERED: { label: 'Dikirim', class: 'status-delivered', icon: CheckCircle },
  FAILED: { label: 'Gagal', class: 'status-failed', icon: XCircle },
  CANCELLED: { label: 'Dibatalkan', class: 'status-failed', icon: XCircle },
};

export default function ResellerDashboard() {
  const { data: stats, isLoading: statsLoading } = useResellerStats();
  const { data: orders, isLoading: ordersLoading } = useResellerOrders();

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <ResellerLayout 
      title="Dashboard Reseller" 
      description="Overview penjualan dan statistik Anda"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Wallet</p>
                    <p className="text-2xl font-bold text-gold-gradient">
                      {formatCurrency(stats?.walletBalance || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Link to="/reseller/wallet">
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                    Topup Saldo <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pesanan</p>
                    <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <ShoppingBag className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.todayOrders || 0} pesanan hari ini
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(stats?.todayRevenue || 0)} hari ini
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cashback</p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(stats?.totalCashback || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <Wallet className="h-6 w-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total spent: {formatCurrency(stats?.totalSpent || 0)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link to="/products">
          <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Buat Pesanan Baru</p>
                  <p className="text-sm text-muted-foreground">Pilih produk untuk customer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/reseller/wallet">
          <Card className="glass-card hover:border-secondary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Wallet className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Topup Wallet</p>
                  <p className="text-sm text-muted-foreground">Isi saldo via QRIS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/reseller/api">
          <Card className="glass-card hover:border-success/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-medium">API Integration</p>
                  <p className="text-sm text-muted-foreground">Kelola API keys</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pesanan Terbaru</CardTitle>
          <Link to="/reseller/orders">
            <Button variant="outline" size="sm">
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada pesanan</p>
              <Link to="/products">
                <Button className="mt-4 btn-premium">
                  <span>Buat Pesanan</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.AWAITING_PAYMENT;
                const StatusIcon = status.icon;
                
                return (
                  <Link 
                    key={order.id} 
                    to={`/reseller/orders/${order.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                          <StatusIcon className={`h-5 w-5 ${status.class.includes('success') ? 'text-success' : status.class.includes('pending') ? 'text-warning' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
