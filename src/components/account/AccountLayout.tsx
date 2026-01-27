import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { User, ShoppingBag, Award, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface AccountLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const menuItems = [
  { href: '/account', label: 'Profil', icon: User },
  { href: '/account/orders', label: 'Riwayat Pesanan', icon: ShoppingBag },
  { href: '/account/points', label: 'Poin Saya', icon: Award },
  { href: '/account/settings', label: 'Pengaturan', icon: Settings },
];

export function AccountLayout({ children, title, description }: AccountLayoutProps) {
  const location = useLocation();
  const { user, loading, signOut, profile } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{profile?.name || 'Member'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>

            <nav className="glass-card p-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </Button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {children}
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
