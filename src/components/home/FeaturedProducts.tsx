import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts } from '@/hooks/useProducts';

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Produk Unggulan
            </h2>
            <p className="mt-1 text-muted-foreground">
              Produk terlaris dengan rating terbaik
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/products" className="group">
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={products || []}
          isLoading={isLoading}
          emptyMessage="Belum ada produk unggulan"
        />
      </div>
    </section>
  );
}
