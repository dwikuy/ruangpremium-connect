import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Monitor, Music, Palette, BookOpen, Code } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useProducts';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  monitor: Monitor,
  music: Music,
  palette: Palette,
  'book-open': BookOpen,
  code: Code,
};

export function CategoriesSection() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Kategori Produk
          </h2>
          <p className="mt-1 text-muted-foreground">
            Temukan produk sesuai kebutuhanmu
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const IconComponent = category.icon
              ? iconMap[category.icon] || Sparkles
              : Sparkles;

            return (
              <Link key={category.id} to={`/products?category=${category.slug}`}>
                <Card className="group flex items-center justify-between p-4 transition-all hover:border-primary/50 hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-premium">
                      <IconComponent className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold transition-colors group-hover:text-primary">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.product_count} produk
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
