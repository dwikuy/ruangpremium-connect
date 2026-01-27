import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Pembayaran', variant: 'secondary' },
  PAID: { label: 'Dibayar', variant: 'default' },
  PROCESSING: { label: 'Diproses', variant: 'default' },
  DELIVERED: { label: 'Selesai', variant: 'outline' },
  FAILED: { label: 'Gagal', variant: 'destructive' },
  CANCELLED: { label: 'Dibatalkan', variant: 'destructive' },
};

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'AWAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading, refetch } = useAdminOrders({
    status: statusFilter !== 'all' ? statusFilter as OrderStatus : undefined,
    search: search || undefined,
  });

  return (
    <AdminLayout title="Pesanan" description="Kelola semua pesanan">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Daftar Pesanan</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pesanan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[order.status]?.variant || 'secondary'}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Tidak ada pesanan ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
