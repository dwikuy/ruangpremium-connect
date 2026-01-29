import { useState, useEffect } from 'react';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useResellerStats, useWalletTransactions, useCreateTopup } from '@/hooks/useReseller';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus,
  History,
  CreditCard,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const transactionTypeConfig: Record<string, { label: string; icon: typeof ArrowDownLeft; color: string }> = {
  TOPUP: { label: 'Topup', icon: ArrowDownLeft, color: 'text-success' },
  PURCHASE: { label: 'Pembelian', icon: ArrowUpRight, color: 'text-destructive' },
  CASHBACK: { label: 'Cashback', icon: ArrowDownLeft, color: 'text-primary' },
  ADJUSTMENT: { label: 'Penyesuaian', icon: CreditCard, color: 'text-muted-foreground' },
};

const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

interface TopupPayment {
  qrLink: string;
  payUrl: string;
  topupOrderId: string;
  payment: {
    id: string;
    amount: number;
    expires_at: string;
  };
}

export default function ResellerWallet() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useResellerStats();
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useWalletTransactions();
  const createTopup = useCreateTopup();
  
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupPayment, setTopupPayment] = useState<TopupPayment | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Poll payment status when showing QR
  useEffect(() => {
    if (!topupPayment?.topupOrderId) return;

    const checkPaymentStatus = async () => {
      setIsCheckingPayment(true);
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('status')
          .eq('id', topupPayment.topupOrderId)
          .single();

        if (order?.status === 'PAID' || order?.status === 'DELIVERED') {
          setPaymentSuccess(true);
          refetchStats();
          refetchTransactions();
          // Auto close after 3 seconds
          setTimeout(() => {
            setTopupPayment(null);
            setPaymentSuccess(false);
            setIsTopupOpen(false);
          }, 3000);
        }
      } finally {
        setIsCheckingPayment(false);
      }
    };

    const interval = setInterval(checkPaymentStatus, 3000);
    return () => clearInterval(interval);
  }, [topupPayment?.topupOrderId, refetchStats, refetchTransactions]);

  const handleTopup = async () => {
    if (topupAmount < 10000) return;
    
    const result = await createTopup.mutateAsync(topupAmount);
    if (result?.qrLink) {
      setTopupPayment(result as TopupPayment);
    }
  };

  const handleClosePayment = () => {
    setTopupPayment(null);
    setPaymentSuccess(false);
  };

  return (
    <ResellerLayout 
      title="Wallet" 
      description="Kelola saldo dan riwayat transaksi wallet Anda"
    >
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {statsLoading ? (
          <>
            <Skeleton className="h-32 md:col-span-2" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card className="glass-card md:col-span-2 bg-gradient-to-br from-secondary/20 to-primary/20 border-secondary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
                    <p className="text-4xl font-bold text-gold-gradient mt-1">
                      {formatCurrency(stats?.walletBalance || 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-full bg-primary/20">
                    <Wallet className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <Dialog open={isTopupOpen} onOpenChange={(open) => {
                    if (!open) handleClosePayment();
                    setIsTopupOpen(open);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="btn-premium w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Topup Saldo</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {paymentSuccess ? 'Pembayaran Berhasil!' : topupPayment ? 'Scan QRIS untuk Bayar' : 'Topup Saldo Wallet'}
                        </DialogTitle>
                        <DialogDescription>
                          {paymentSuccess 
                            ? 'Saldo wallet Anda telah ditambahkan'
                            : topupPayment 
                              ? 'Scan kode QR di bawah menggunakan e-wallet Anda'
                              : 'Pilih nominal atau masukkan jumlah topup yang diinginkan'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      
                      {paymentSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="p-4 rounded-full bg-success/20 mb-4">
                            <CheckCircle className="h-16 w-16 text-success" />
                          </div>
                          <p className="text-2xl font-bold text-success">
                            +{formatCurrency(topupPayment?.payment.amount || 0)}
                          </p>
                          <p className="text-muted-foreground mt-2">
                            Saldo berhasil ditambahkan
                          </p>
                        </div>
                      ) : topupPayment ? (
                        <div className="space-y-4 py-4">
                          {/* QR Code Display */}
                          <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-lg">
                              <img 
                                src={topupPayment.qrLink} 
                                alt="QRIS Code" 
                                className="w-64 h-64 object-contain"
                              />
                            </div>
                            
                            <div className="mt-4 text-center">
                              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(topupPayment.payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                (Termasuk biaya admin)
                              </p>
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Menunggu pembayaran...</span>
                          </div>

                          {/* Cancel button */}
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={handleClosePayment}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Batalkan
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-3 gap-2">
                            {quickAmounts.map((amount) => (
                              <Button
                                key={amount}
                                variant={topupAmount === amount ? 'default' : 'outline'}
                                onClick={() => setTopupAmount(amount)}
                                className="text-sm"
                              >
                                {formatCurrency(amount)}
                              </Button>
                            ))}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="custom-amount">Nominal Lainnya</Label>
                            <Input
                              id="custom-amount"
                              type="number"
                              min={10000}
                              step={1000}
                              value={topupAmount}
                              onChange={(e) => setTopupAmount(Number(e.target.value))}
                              placeholder="Minimal Rp 10.000"
                            />
                          </div>
                          
                          <div className="p-4 rounded-lg bg-muted">
                            <div className="flex justify-between text-sm">
                              <span>Jumlah Topup</span>
                              <span className="font-bold">{formatCurrency(topupAmount)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              + biaya admin QRIS akan ditambahkan
                            </p>
                          </div>
                          
                          <Button 
                            className="w-full btn-premium"
                            onClick={handleTopup}
                            disabled={topupAmount < 10000 || createTopup.isPending}
                          >
                            <span>{createTopup.isPending ? 'Membuat Invoice...' : 'Bayar dengan QRIS'}</span>
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowDownLeft className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">Total Topup</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalTopup || 0)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalSpent || 0)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Cashback Info */}
      <Card className="glass-card mb-8 border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Total Cashback Diterima</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.totalCashback || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Transaksi
          </CardTitle>
          <CardDescription>
            Semua transaksi wallet Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const config = transactionTypeConfig[tx.transaction_type] || transactionTypeConfig.ADJUSTMENT;
                const Icon = config.icon;
                const isPositive = tx.amount > 0;
                
                return (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        <Icon className={`h-5 w-5 ${isPositive ? 'text-success' : 'text-destructive'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.description || config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {formatCurrency(tx.balance_after)}
                      </p>
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
