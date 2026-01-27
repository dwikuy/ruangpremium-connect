import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Proses Otomatis 24 Jam
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Produk Digital Premium
            <span className="block text-premium-gradient">Harga Terbaik</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            ChatGPT Plus, Canva Pro, dan berbagai layanan premium lainnya.
            <br className="hidden sm:block" />
            Pembayaran mudah via QRIS, delivery instan otomatis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="btn-premium w-full sm:w-auto" asChild>
              <Link to="/products">
                <span>Lihat Produk</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              asChild
            >
              <Link to="/track">Lacak Pesanan</Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Proses Instan</p>
              <p className="text-sm text-muted-foreground">
                Otomatis 24/7 tanpa antri
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <p className="font-medium">Aman & Terpercaya</p>
              <p className="text-sm text-muted-foreground">
                Garansi setiap pembelian
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <p className="font-medium">Support 24 Jam</p>
              <p className="text-sm text-muted-foreground">
                Bantuan kapan saja
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
