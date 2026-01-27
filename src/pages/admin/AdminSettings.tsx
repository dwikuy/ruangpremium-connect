import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminSettings, SettingsFormData } from '@/hooks/useAdminSettings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Coins, 
  Percent, 
  CreditCard, 
  Wallet, 
  Save,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const paymentChannels = [
  { value: 'QRIS', label: 'QRIS (Semua E-Wallet & Bank)' },
  { value: 'QRISC', label: 'QRIS Custom' },
  { value: 'BCAVA', label: 'BCA Virtual Account' },
  { value: 'BNIVA', label: 'BNI Virtual Account' },
  { value: 'BRIVA', label: 'BRI Virtual Account' },
  { value: 'MANDIRIVA', label: 'Mandiri Virtual Account' },
];

export default function AdminSettings() {
  const { formData: initialData, isLoading, updateSettings, isUpdating } = useAdminSettings();
  const [formData, setFormData] = useState<SettingsFormData>(initialData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setFormData(initialData);
    }
  }, [isLoading, initialData]);

  const handleChange = <K extends keyof SettingsFormData>(key: K, value: SettingsFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings([
      { 
        key: 'points_earn_rate', 
        value: { rate: formData.points_earn_rate, per_amount: formData.points_earn_per_amount },
        description: 'Jumlah poin yang didapat per transaksi'
      },
      { 
        key: 'points_redeem_value', 
        value: { value: formData.points_redeem_value },
        description: 'Nilai tukar poin ke rupiah'
      },
      { 
        key: 'points_max_redeem_percent', 
        value: { percent: formData.points_max_redeem_percent },
        description: 'Maksimal persentase pembayaran dengan poin'
      },
      { 
        key: 'reseller_cashback_rate', 
        value: { percent: formData.reseller_cashback_rate },
        description: 'Persentase cashback untuk reseller'
      },
      { 
        key: 'min_topup_amount', 
        value: { amount: formData.min_topup_amount },
        description: 'Minimal jumlah topup wallet reseller'
      },
      { 
        key: 'tokopay_channel', 
        value: { code: formData.tokopay_channel },
        description: 'Channel pembayaran Tokopay'
      },
    ]);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(initialData);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Pengaturan Sistem" description="Kelola pengaturan sistem">
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Pengaturan Sistem" 
      description="Kelola pengaturan sistem seperti poin, reseller, dan pembayaran"
    >
      <div className="max-w-3xl space-y-6">
        {/* Points Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Pengaturan Poin</CardTitle>
                <CardDescription>Atur sistem poin untuk member</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points_earn_rate">Poin Didapat</Label>
                <Input
                  id="points_earn_rate"
                  type="number"
                  min={0}
                  value={formData.points_earn_rate}
                  onChange={(e) => handleChange('points_earn_rate', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Jumlah poin yang didapat
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points_earn_per_amount">Per Belanja</Label>
                <Input
                  id="points_earn_per_amount"
                  type="number"
                  min={1000}
                  step={1000}
                  value={formData.points_earn_per_amount}
                  onChange={(e) => handleChange('points_earn_per_amount', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Setiap belanja {formatCurrency(formData.points_earn_per_amount)}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">Contoh perhitungan:</p>
              <p className="text-muted-foreground">
                Belanja {formatCurrency(formData.points_earn_per_amount * 2)} → mendapat{' '}
                <span className="font-semibold text-primary">{formData.points_earn_rate * 2} poin</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points_redeem_value">Nilai Tukar Poin</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">1 poin =</span>
                  <Input
                    id="points_redeem_value"
                    type="number"
                    min={1}
                    className="w-24"
                    value={formData.points_redeem_value}
                    onChange={(e) => handleChange('points_redeem_value', parseInt(e.target.value) || 1)}
                  />
                  <span className="text-sm text-muted-foreground">Rupiah</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points_max_redeem_percent">Maks. Penukaran</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="points_max_redeem_percent"
                    type="number"
                    min={1}
                    max={100}
                    className="w-24"
                    value={formData.points_max_redeem_percent}
                    onChange={(e) => handleChange('points_max_redeem_percent', parseInt(e.target.value) || 30)}
                  />
                  <span className="text-sm text-muted-foreground">% dari total belanja</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reseller Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Wallet className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle>Pengaturan Reseller</CardTitle>
                <CardDescription>Atur wallet dan cashback reseller</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reseller_cashback_rate">Rate Cashback</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="reseller_cashback_rate"
                    type="number"
                    min={0}
                    max={50}
                    className="w-24"
                    value={formData.reseller_cashback_rate}
                    onChange={(e) => handleChange('reseller_cashback_rate', parseInt(e.target.value) || 0)}
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cashback ke wallet reseller saat bayar QRIS
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_topup_amount">Min. Topup Wallet</Label>
                <Input
                  id="min_topup_amount"
                  type="number"
                  min={10000}
                  step={10000}
                  value={formData.min_topup_amount}
                  onChange={(e) => handleChange('min_topup_amount', parseInt(e.target.value) || 50000)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimal topup {formatCurrency(formData.min_topup_amount)}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">Contoh cashback:</p>
              <p className="text-muted-foreground">
                Reseller bayar QRIS {formatCurrency(100000)} → dapat cashback{' '}
                <span className="font-semibold text-primary">
                  {formatCurrency((100000 * formData.reseller_cashback_rate) / 100)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <CreditCard className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle>Pengaturan Pembayaran</CardTitle>
                <CardDescription>Atur metode pembayaran Tokopay</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tokopay_channel">Channel Pembayaran Default</Label>
              <Select
                value={formData.tokopay_channel}
                onValueChange={(value) => handleChange('tokopay_channel', value)}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentChannels.map(channel => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Channel yang digunakan untuk generate invoice pembayaran
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isUpdating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isUpdating}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
