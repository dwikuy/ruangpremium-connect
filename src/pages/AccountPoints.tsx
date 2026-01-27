import { AccountLayout } from '@/components/account/AccountLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPoints, usePointsHistory } from '@/hooks/useProfile';
import { usePointsSettings } from '@/hooks/usePoints';
import { formatCurrency, formatDate } from '@/lib/format';
import { Award, TrendingUp, TrendingDown, Info } from 'lucide-react';

const transactionTypeConfig: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  EARNED: { label: 'Diterima', color: 'text-success', icon: TrendingUp },
  REDEEMED: { label: 'Digunakan', color: 'text-destructive', icon: TrendingDown },
  ADJUSTMENT: { label: 'Penyesuaian', color: 'text-primary', icon: Info },
};

export default function AccountPointsPage() {
  const { data: points, isLoading: pointsLoading } = useUserPoints();
  const { data: history, isLoading: historyLoading } = usePointsHistory();
  const { data: settings } = usePointsSettings();

  if (pointsLoading) {
    return (
      <AccountLayout title="Poin Saya" description="Lihat saldo dan riwayat poin Anda">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="Poin Saya" description="Lihat saldo dan riwayat poin Anda">
      {/* Points Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gold/10">
                <Award className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Poin</p>
                <p className="text-3xl font-bold text-gold">{points?.balance || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Diterima</p>
                <p className="text-2xl font-bold">{points?.total_earned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Digunakan</p>
                <p className="text-2xl font-bold">{points?.total_redeemed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="glass-card mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Cara Mendapatkan Poin</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Setiap pembelian berhasil akan mendapatkan poin ({settings?.earnRate || 1} poin per {formatCurrency(settings?.perAmount || 100)})</li>
                <li>• Poin dapat ditukar untuk diskon di pembelian berikutnya</li>
                <li>• 1 poin = {formatCurrency(settings?.redeemValue || 1)} diskon</li>
                <li>• Maksimal penukaran poin: {settings?.maxRedeemPercent || 30}% dari total belanja</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Riwayat Transaksi Poin</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada riwayat transaksi poin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((transaction) => {
                const config = transactionTypeConfig[transaction.transaction_type] || transactionTypeConfig.ADJUSTMENT;
                const Icon = config.icon;
                const isPositive = transaction.amount > 0;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-background ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description || config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {transaction.balance_after}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
