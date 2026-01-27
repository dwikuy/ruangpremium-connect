import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DeliveryResult } from '@/components/order/DeliveryResult';
import { 
  Package, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  ArrowRight,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/format';
import type { OrderWithItems, OrderItem } from '@/types/database';

const ORDER_STATUS_STEPS = [
  { key: 'AWAITING_PAYMENT', label: 'Menunggu Pembayaran', icon: CreditCard },
  { key: 'PAID', label: 'Dibayar', icon: CreditCard },
  { key: 'PROCESSING', label: 'Diproses', icon: Clock },
  { key: 'DELIVERED', label: 'Selesai', icon: CheckCircle },
];

export default function Track() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('token');
  
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchOrder = async (id: string, token?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            product:products(name, image_url)
          )
        `)
        .eq('id', id);

      if (token) {
        query = query.eq('guest_token', token);
      }

      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Pesanan tidak ditemukan');

      const orderItems: OrderItem[] = (data.order_items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        product_image: item.product?.image_url || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        input_data: item.input_data || {},
        delivery_data: item.delivery_data,
        delivered_at: item.delivered_at,
      }));

      setOrder({
        id: data.id,
        guest_token: data.guest_token,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        subtotal: data.subtotal,
        discount_amount: data.discount_amount || 0,
        points_used: data.points_used || 0,
        points_discount: data.points_discount || 0,
        total_amount: data.total_amount,
        status: data.status,
        paid_at: data.paid_at,
        delivered_at: data.delivered_at,
        created_at: data.created_at,
        items: orderItems,
        payment: null,
      });
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId, guestToken);
    }
  }, [orderId, guestToken]);

  // Poll status so user doesn't get stuck seeing "Dibayar" while fulfillment is still running
  useEffect(() => {
    if (!orderId) return;

    const isTerminal = (status?: string | null) =>
      status === 'DELIVERED' || status === 'FAILED' || status === 'CANCELLED';

    // If we don't have data yet, wait for initial fetch
    if (!order || isTerminal(order.status)) return;

    const interval = setInterval(() => {
      // Keep updating until terminal
      fetchOrder(orderId, guestToken);
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, guestToken, order?.status]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      fetchOrder(searchInput.trim());
    }
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusIndex = (status: string) => {
    if (status === 'CANCELLED' || status === 'FAILED') return -1;
    return ORDER_STATUS_STEPS.findIndex(s => s.key === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-success text-success-foreground';
      case 'PROCESSING':
      case 'PAID':
        return 'bg-primary text-primary-foreground';
      case 'AWAITING_PAYMENT':
        return 'bg-accent text-accent-foreground';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <MainLayout>
      <div className="container py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Lacak Pesanan</h1>

        {/* Search Box (show if no orderId) */}
        {!orderId && (
          <Card className="glass-card mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Masukkan Order ID"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={!searchInput.trim()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Masukkan Order ID yang Anda terima saat checkout
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="glass-card border-destructive/50">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold mb-2">Pesanan Tidak Ditemukan</h3>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={() => setError(null)}>
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Status Timeline */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Status Pesanan</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status === 'AWAITING_PAYMENT' && 'Menunggu Pembayaran'}
                    {order.status === 'PAID' && 'Dibayar'}
                    {order.status === 'PROCESSING' && 'Diproses'}
                    {order.status === 'DELIVERED' && 'Selesai'}
                    {order.status === 'CANCELLED' && 'Dibatalkan'}
                    {order.status === 'FAILED' && 'Gagal'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {order.status === 'CANCELLED' || order.status === 'FAILED' ? (
                  <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg">
                    <XCircle className="h-8 w-8 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">
                        Pesanan {order.status === 'CANCELLED' ? 'Dibatalkan' : 'Gagal'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Silakan hubungi support jika ada pertanyaan.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between relative">
                    {ORDER_STATUS_STEPS.map((step, index) => {
                      const currentIndex = getStatusIndex(order.status);
                      const isActive = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1 relative">
                          {/* Connector line */}
                          {index > 0 && (
                            <div
                              className={`absolute top-5 -left-1/2 right-1/2 h-0.5 ${
                                index <= currentIndex ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                          
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`text-xs mt-2 text-center ${isActive ? '' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detail Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {order.id.slice(0, 8).toUpperCase()}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(order.id, 'orderId')}
                    >
                      {copied === 'orderId' ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tanggal Order</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>

                <Separator />

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

                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-gold">{formatCurrency(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Result */}
            {order.status === 'DELIVERED' && order.items.some(item => item.delivery_data) && (
              <Card className="glass-card border-success/30">
                <CardHeader>
                  <CardTitle className="text-lg text-success flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Hasil Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items.map((item) => (
                    item.delivery_data && (
                      <DeliveryResult
                        key={item.id}
                        productName={item.product_name}
                        deliveryData={item.delivery_data}
                        deliveredAt={item.delivered_at}
                      />
                    )
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Continue Shopping */}
            {order.status === 'AWAITING_PAYMENT' && (
              <Button asChild className="w-full btn-premium">
                <Link to={`/invoice/${order.id}${order.guest_token ? `?token=${order.guest_token}` : ''}`}>
                  Lanjutkan Pembayaran
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link to="/products">Lanjut Belanja</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
