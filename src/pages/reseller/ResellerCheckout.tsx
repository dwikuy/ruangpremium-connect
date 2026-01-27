import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  Wallet, 
  QrCode, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useProductById } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useResellerWallet } from '@/hooks/useReseller';
import { useResellerCheckout, type PaymentMethod } from '@/hooks/useResellerCheckout';
import { formatCurrency } from '@/lib/format';

const formSchema = z.object({
  customer_name: z.string().min(2, 'Nama minimal 2 karakter'),
  customer_email: z.string().email('Email tidak valid'),
  customer_phone: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
  quantity: z.number().min(1, 'Minimal 1'),
  payment_method: z.enum(['wallet', 'qris']),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResellerCheckout() {
  const { productId } = useParams<{ productId: string }>();
  const { profile, loading: authLoading } = useAuth();
  const { data: product, isLoading: productLoading, error: productError } = useProductById(productId || '');
  const { data: wallet, isLoading: walletLoading } = useResellerWallet();
  const { loading, createOrder } = useResellerCheckout(product || null);
  const [inputData, setInputData] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      quantity: 1,
      payment_method: 'wallet',
    },
  });

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      form.setValue('customer_name', profile.name);
      form.setValue('customer_email', profile.email);
      form.setValue('customer_phone', profile.phone || '');
    }
  }, [profile, form]);

  // Redirect if not reseller - moved after all hooks
  const isNotReseller = !authLoading && profile?.role !== 'reseller' && profile?.role !== 'admin';
  const noProductId = !productId;

  if (isNotReseller) {
    return <Navigate to="/forbidden" replace />;
  }

  if (noProductId) {
    return <Navigate to="/products" replace />;
  }

  if (productLoading || authLoading || walletLoading) {
    return (
      <ResellerLayout title="Checkout Reseller">
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[300px]" />
              <Skeleton className="h-[200px]" />
            </div>
            <div>
              <Skeleton className="h-[400px]" />
            </div>
          </div>
        </div>
      </ResellerLayout>
    );
  }

  if (productError || !product) {
    return (
      <ResellerLayout title="Produk Tidak Ditemukan">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-6">
            Produk yang Anda cari tidak tersedia atau sudah dihapus.
          </p>
          <Button asChild>
            <Link to="/products">Kembali ke Katalog</Link>
          </Button>
        </div>
      </ResellerLayout>
    );
  }

  // Calculate prices
  const resellerPrice = product.reseller_price || product.retail_price;
  const retailPrice = product.retail_price;
  const discount = retailPrice - resellerPrice;
  const discountPercent = Math.round((discount / retailPrice) * 100);

  const watchedQuantity = form.watch('quantity');
  const watchedPaymentMethod = form.watch('payment_method');
  const subtotal = resellerPrice * (watchedQuantity || 1);
  const walletBalance = wallet?.balance || 0;
  const insufficientBalance = watchedPaymentMethod === 'wallet' && walletBalance < subtotal;

  const dynamicFields = product.input_schema || [];

  const handleSubmit = (values: FormValues) => {
    if (!profile?.user_id || !wallet) return;

    // Collect dynamic field values
    const collectedInputData: Record<string, string> = {};
    dynamicFields.forEach(field => {
      collectedInputData[field.name] = inputData[field.name] || '';
    });

    createOrder(
      {
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,
        quantity: values.quantity,
        input_data: collectedInputData,
        payment_method: values.payment_method as PaymentMethod,
      },
      profile.user_id,
      wallet
    );
  };

  return (
    <ResellerLayout title="Checkout Reseller" description="Beli dengan harga reseller">
      <div className="space-y-6">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-2">
          <Link to={`/products/${product.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama pelanggan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="08xxxxxxxxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Dynamic Input Fields */}
                {dynamicFields.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Data untuk Aktivasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dynamicFields.map(field => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          
                          {field.type === 'select' && field.options ? (
                            <Select
                              value={inputData[field.name] || ''}
                              onValueChange={(value) => setInputData(prev => ({ ...prev, [field.name]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={field.name}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={inputData[field.name] || ''}
                              onChange={(e) => setInputData(prev => ({ ...prev, [field.name]: e.target.value }))}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quantity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Jumlah</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => field.onChange(Math.max(1, (field.value || 1) - 1))}
                                disabled={(field.value || 1) <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                className="w-20 text-center"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => field.onChange((field.value || 1) + 1)}
                              >
                                +
                              </Button>
                              <span className="text-muted-foreground">
                                × {formatCurrency(resellerPrice)}
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Metode Pembayaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-3"
                            >
                              {/* Wallet Option */}
                              <div className={`flex items-center space-x-3 p-4 rounded-lg border ${
                                field.value === 'wallet' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border'
                              }`}>
                                <RadioGroupItem value="wallet" id="wallet" />
                                <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Wallet className="h-5 w-5 text-primary" />
                                      <div>
                                        <p className="font-medium">Saldo Wallet</p>
                                        <p className="text-sm text-muted-foreground">
                                          Saldo: {formatCurrency(walletBalance)}
                                        </p>
                                      </div>
                                    </div>
                                    {insufficientBalance && (
                                      <Badge variant="destructive" className="ml-2">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Saldo Kurang
                                      </Badge>
                                    )}
                                    {!insufficientBalance && field.value === 'wallet' && (
                                      <CheckCircle2 className="h-5 w-5 text-primary" />
                                    )}
                                  </div>
                                </Label>
                              </div>

                              {/* QRIS Option */}
                              <div className={`flex items-center space-x-3 p-4 rounded-lg border ${
                                field.value === 'qris' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border'
                              }`}>
                                <RadioGroupItem value="qris" id="qris" />
                                <Label htmlFor="qris" className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <QrCode className="h-5 w-5 text-primary" />
                                      <div>
                                        <p className="font-medium">Bayar QRIS</p>
                                        <p className="text-sm text-muted-foreground">
                                          Scan QR untuk bayar dengan harga reseller
                                        </p>
                                      </div>
                                    </div>
                                    {field.value === 'qris' && (
                                      <CheckCircle2 className="h-5 w-5 text-primary" />
                                    )}
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {insufficientBalance && watchedPaymentMethod === 'wallet' && (
                      <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Saldo tidak cukup. Kurang {formatCurrency(subtotal - walletBalance)}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild 
                          className="mt-2"
                        >
                          <Link to="/reseller/wallet">Topup Saldo</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={loading || (insufficientBalance && watchedPaymentMethod === 'wallet')}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : watchedPaymentMethod === 'wallet' ? (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Bayar dengan Wallet
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Lanjut ke Pembayaran QRIS
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Right: Product Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                {/* Product Image */}
                {product.image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant={product.product_type === 'STOCK' ? 'default' : 'secondary'}>
                        {product.product_type}
                      </Badge>
                    </div>
                    {product.category && (
                      <p className="text-sm text-muted-foreground">{product.category.name}</p>
                    )}
                  </div>

                  {/* Price Comparison */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(retailPrice)}
                      </span>
                      {discountPercent > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          -{discountPercent}%
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(resellerPrice)}
                    </div>
                    <p className="text-xs text-muted-foreground">Harga Reseller</p>
                  </div>

                  {product.duration_days && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Masa aktif: {product.duration_days} hari</span>
                    </div>
                  )}

                  {product.product_type === 'STOCK' && product.stock_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span className={product.stock_count > 0 ? 'text-success' : 'text-destructive'}>
                        {product.stock_count > 0 ? `${product.stock_count} tersedia` : 'Stok habis'}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium">Ringkasan Pesanan</h4>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {watchedQuantity}x {product.name}
                    </span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Hemat dari harga retail</span>
                      <span>-{formatCurrency(discount * watchedQuantity)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResellerLayout>
  );
}
