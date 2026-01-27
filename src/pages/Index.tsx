import { MainLayout } from '@/components/layout/MainLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoriesSection } from '@/components/home/CategoriesSection';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
    </MainLayout>
  );
};

export default Index;
