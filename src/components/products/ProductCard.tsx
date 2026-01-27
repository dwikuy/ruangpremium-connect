import { Link } from 'react-router-dom';
import { Package, Zap, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import type { ProductWithCategory } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: ProductWithCategory;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const isStock = product.product_type === 'STOCK';

  return (
    <Link to={`/products/${product.slug}`}>
      <Card
        className={cn(
          'product-card group overflow-hidden',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.is_featured && (
              <Badge className="badge-featured gap-1">
                <Star className="h-3 w-3" />
                Unggulan
              </Badge>
            )}
            {product.total_sold > 50 && (
              <Badge className="bg-primary/20 text-primary border border-primary/30 gap-1">
                <TrendingUp className="h-3 w-3" />
                Terlaris
              </Badge>
            )}
          </div>

          {/* Type Badge */}
          <div className="absolute right-2 top-2">
            <Badge className={isStock ? 'badge-stock' : 'badge-invite'}>
              {isStock ? (
                <>
                  <Package className="mr-1 h-3 w-3" />
                  Stok
                </>
              ) : (
                <>
                  <Zap className="mr-1 h-3 w-3" />
                  Invite
                </>
              )}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Category */}
          {product.category && (
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {product.category.name}
            </p>
          )}

          {/* Name */}
          <h3 className="mb-2 font-display font-semibold line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>

          {/* Description */}
          {product.short_description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {product.short_description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-gold-gradient">
                {formatRupiah(product.retail_price)}
              </p>
              {product.duration_days && (
                <p className="text-xs text-muted-foreground">
                  / {product.duration_days} hari
                </p>
              )}
            </div>

            <Button size="sm" className="btn-premium h-8 px-3">
              <span>Beli</span>
            </Button>
          </div>

          {/* Stats */}
          {product.total_sold > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {product.total_sold}+ terjual
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
