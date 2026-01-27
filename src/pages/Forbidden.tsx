import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div 
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <ShieldX className="h-10 w-10 text-destructive" />
        </motion.div>
        <motion.h1 
          className="mb-2 text-4xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          403
        </motion.h1>
        <motion.h2 
          className="mb-4 text-xl font-semibold text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Akses Ditolak
        </motion.h2>
        <motion.p 
          className="mb-8 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
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
        </motion.div>
      </motion.div>
    </div>
  );
}
