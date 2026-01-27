import { AccountLayout } from '@/components/account/AccountLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, ShoppingBag, User } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useState, useEffect } from 'react';
import { useUserOrders } from '@/hooks/useOrders';

export default function AccountPage() {
  const { profile: authProfile } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: orders } = useUserOrders();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  if (isLoading) {
    return (
      <AccountLayout title="Profil Saya" description="Kelola informasi profil Anda">
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 mt-6" />
      </AccountLayout>
    );
  }

  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => {
    if (order.status === 'PAID' || order.status === 'DELIVERED') {
      return sum + order.total_amount;
    }
    return sum;
  }, 0) || 0;

  return (
    <AccountLayout title="Profil Saya" description="Kelola informasi profil Anda">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pesanan</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Award className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Poin Saya</p>
                <p className="text-2xl font-bold">{authProfile?.points_balance || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gold/10">
                <User className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Belanja</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama lengkap Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="btn-premium"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
