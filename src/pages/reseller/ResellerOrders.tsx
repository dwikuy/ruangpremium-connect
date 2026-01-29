import { useState } from 'react';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useResellerOrders } from '@/hooks/useReseller';
import { formatCurrency } from '@/lib/format';
import { 
  ShoppingBag,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Bayar', class: 'status-pending', icon: Clock },
  PAID: { label: 'Dibayar', class: 'status-paid', icon: CheckCircle },
  PROCESSING: { label: 'Diproses', class: 'status-processing', icon: Package },
  DELIVERED: { label: 'Dikirim', class: 'status-delivered', icon: CheckCircle },
  FAILED: { label: 'Gagal', class: 'status-failed', icon: XCircle },
  CANCELLED: { label: 'Dibatalkan', class: 'status-failed', icon: XCircle },
};

export default function ResellerOrders() {
  const { data: orders, isLoading } = useResellerOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <ResellerLayout 
      title="Pesanan Saya" 
      description="Daftar pesanan yang Anda buat untuk customer"
    >
      {/* Filters */}
      <Card className="glass-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari order ID, nama, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AWAITING_PAYMENT">Menunggu Bayar</SelectItem>
                <SelectItem value="PAID">Dibayar</SelectItem>
                <SelectItem value="PROCESSING">Diproses</SelectItem>
                <SelectItem value="DELIVERED">Dikirim</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/products">
              <Button className="btn-premium w-full sm:w-auto">
                <span>+ Buat Pesanan</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Daftar Pesanan
            {filteredOrders && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredOrders.length} pesanan)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : !filteredOrders || filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Belum ada pesanan</p>
              <p className="text-sm mb-4">Mulai buat pesanan untuk customer Anda</p>
              <Link to="/products">
                <Button className="btn-premium">
                  <span>Buat Pesanan Baru</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.AWAITING_PAYMENT;
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={order.id} 
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex p-2 rounded-lg bg-secondary/10">
                          <StatusIcon className={`h-5 w-5 ${status.class.includes('success') ? 'text-success' : status.class.includes('pending') ? 'text-warning' : status.class.includes('delivered') ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono font-medium">#{order.id.slice(0, 8)}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.class}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.customer_email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                          </p>
                          
                          {/* Products */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mt-2">
                              {order.order_items.slice(0, 2).map((item) => (
                                <p key={item.id} className="text-sm">
                                  {item.product?.name} x{item.quantity}
                                </p>
                              ))}
                              {order.order_items.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order.order_items.length - 2} produk lainnya
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(order.total_amount)}</p>
                          {order.discount_amount && order.discount_amount > 0 && (
                            <p className="text-xs text-success">
                              Diskon: -{formatCurrency(order.discount_amount)}
                            </p>
                          )}
                        </div>
                        <Link to={`/reseller/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
