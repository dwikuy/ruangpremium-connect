import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductWithCategory, CategoryWithCount, InputField } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';

// Helper to safely cast Json to string array
function toStringArray(json: Json | null): string[] {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// Helper to safely cast Json to InputField array
function toInputFieldArray(json: Json | null): InputField[] {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json
      .filter((item): boolean => {
        return typeof item === 'object' && item !== null && 'name' in item && 'label' in item;
      })
      .map((item) => item as unknown as InputField);
  }
  return [];
}

// Transform product from DB to typed interface
function transformProduct(product: Record<string, unknown>): ProductWithCategory {
  return {
    id: product.id as string,
    name: product.name as string,
    slug: product.slug as string,
    description: product.description as string | null,
    short_description: product.short_description as string | null,
    image_url: product.image_url as string | null,
    product_type: product.product_type as 'STOCK' | 'INVITE',
    retail_price: Number(product.retail_price) || 0,
    reseller_price: product.reseller_price ? Number(product.reseller_price) : null,
    duration_days: product.duration_days as number | null,
    benefits: toStringArray(product.benefits as Json),
    input_schema: toInputFieldArray(product.input_schema as Json),
    require_read_description: Boolean(product.require_read_description),
    is_featured: Boolean(product.is_featured),
    is_active: Boolean(product.is_active),
    total_sold: Number(product.total_sold) || 0,
    category: product.category as ProductWithCategory['category'],
    provider: product.provider as ProductWithCategory['provider'],
    stock_count: product.stock_count as number | undefined,
  };
}

// Fetch all active products
export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async (): Promise<ProductWithCategory[]> => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, slug, icon),
          provider:providers(id, name, slug)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(transformProduct);
    },
  });
}

// Fetch single product by slug
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async (): Promise<ProductWithCategory | null> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, slug, icon),
          provider:providers(id, name, slug)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Get stock count for STOCK products
      let stock_count = 0;
      if (data.product_type === 'STOCK') {
        const { count } = await supabase
          .from('stock_items')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', data.id)
          .eq('status', 'AVAILABLE');
        stock_count = count || 0;
      }

      return transformProduct({ ...data, stock_count });
    },
    enabled: !!slug,
  });
}

// Fetch featured products
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async (): Promise<ProductWithCategory[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, slug, icon),
          provider:providers(id, name, slug)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(8);

      if (error) throw error;

      return (data || []).map(transformProduct);
    },
  });
}

// Fetch all categories with product count
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Get product count for each category
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('is_active', true);

          return {
            ...category,
            product_count: count || 0,
          };
        })
      );

      return categoriesWithCount;
    },
  });
}

// Search products
export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async (): Promise<ProductWithCategory[]> => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, slug, icon),
          provider:providers(id, name, slug)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('total_sold', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(transformProduct);
    },
    enabled: query.length >= 2,
  });
}
