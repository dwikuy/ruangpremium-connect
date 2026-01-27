import { ReactNode } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Menu,
  ChevronLeft,
  Users,
  CreditCard,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/categories', label: 'Kategori', icon: Tag },
  { href: '/admin/coupons', label: 'Kupon', icon: CreditCard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const location = useLocation();
  const { user, loading, signOut, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 bg-sidebar p-4">
          <Skeleton className="h-10 w-full mb-8" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {sidebarOpen && (
            <Link to="/admin" className="font-bold text-xl text-sidebar-primary">
              Admin Panel
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              !sidebarOpen && "justify-center"
            )}
          >
            <Package className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm">Lihat Toko</span>}
          </Link>
          <button
            onClick={() => signOut()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
