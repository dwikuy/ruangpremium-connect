import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold">403</h1>
        <h2 className="mb-4 text-xl font-semibold text-muted-foreground">
          Akses Ditolak
        </h2>
        <p className="mb-8 text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          <Button asChild>
            <Link to="/account">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ke Dashboard Saya
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
