import { AccountLayout } from '@/components/account/AccountLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, Shield } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Password Tidak Cocok',
        description: 'Password baru dan konfirmasi harus sama.',
        variant: 'destructive',
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: 'Password Terlalu Pendek',
        description: 'Password minimal 6 karakter.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      toast({
        title: 'Password Diperbarui',
        description: 'Password Anda berhasil diubah.',
      });

      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast({
        title: 'Gagal Mengubah Password',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AccountLayout title="Pengaturan" description="Kelola keamanan akun Anda">
      {/* Account Info */}
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Detail login akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Bergabung Sejak</Label>
              <Input
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'
                }
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Ubah Password
          </CardTitle>
          <CardDescription>Perbarui password akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Ulangi password baru"
              />
            </div>

            <Button
              type="submit"
              className="btn-premium"
              disabled={isChangingPassword || !passwords.new || !passwords.confirm}
            >
              {isChangingPassword ? 'Menyimpan...' : 'Ubah Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
