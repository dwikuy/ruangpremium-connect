import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Wallet, 
  Key, 
  FileText,
  LogOut,
  Store
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface ResellerLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const menuItems = [
  { href: '/reseller', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reseller/products', label: 'Produk', icon: Store },
  { href: '/reseller/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/reseller/wallet', label: 'Wallet', icon: Wallet },
  { href: '/reseller/api', label: 'API Keys', icon: Key },
  { href: '/reseller/docs', label: 'Dokumentasi API', icon: FileText },
];

export function ResellerLayout({ children, title, description }: ResellerLayoutProps) {
  const location = useLocation();
  const { user, loading, signOut, profile, isReseller, isAdmin } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64">
              <Skeleton className="h-24 w-full mb-4" />
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

  // Only resellers and admins can access
  if (!isReseller && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            {/* Profile Card */}
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Store className="h-6 w-6 text-secondary" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{profile?.name || 'Reseller'}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/20 text-secondary">
                    Reseller
                  </span>
                </div>
              </div>
              
              {/* Wallet Balance */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Saldo Wallet</p>
                <p className="text-xl font-bold text-gold-gradient">
                  {formatCurrency(profile?.wallet_balance || 0)}
                </p>
              </div>
            </div>

            {/* Navigation */}
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
                        ? 'bg-secondary/10 text-secondary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="border-t border-border my-2" />

              <Link
                to="/account"
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Store className="h-4 w-4" />
                <span>Akun Saya</span>
              </Link>

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
          <main className="flex-1 min-w-0">
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
