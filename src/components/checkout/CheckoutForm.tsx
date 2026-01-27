import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Loader2, Tag, Check, X, AlertCircle, Coins, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { usePointsSettings, useUserPointsBalance, calculateMaxRedeemable, calculatePointsEarned } from '@/hooks/usePoints';
import type { ProductWithCategory, UserProfile, CouponValidation } from '@/types/database';

// Base form schema
const baseSchema = z.object({
  customer_name: z.string().min(2, 'Nama minimal 2 karakter'),
  customer_email: z.string().email('Email tidak valid'),
  customer_phone: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
  quantity: z.number().min(1, 'Minimal 1'),
  coupon_code: z.string().optional(),
  points_to_use: z.number().min(0).optional(),
});

interface PointsValidation {
  valid: boolean;
  error?: string;
  max_redeemable?: number;
  discount_amount?: number;
}

interface CheckoutFormProps {
  product: ProductWithCategory;
  profile: UserProfile | null;
  couponValidation: CouponValidation | null;
  pointsValidation?: PointsValidation | null;
  loading: boolean;
  onValidateCoupon: (code: string, subtotal: number) => void;
  onValidatePoints?: (userId: string, points: number, subtotal: number) => void;
  onSubmit: (data: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    quantity: number;
    coupon_code?: string;
    points_to_use?: number;
    input_data: Record<string, string>;
  }) => void;
}

export function CheckoutForm({
  product,
  profile,
  couponValidation,
  pointsValidation,
  loading,
  onValidateCoupon,
  onValidatePoints,
  onSubmit,
}: CheckoutFormProps) {
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  
  // Fetch points settings and user balance
  const { data: pointsSettings } = usePointsSettings();
  const { data: userPoints } = useUserPointsBalance(profile?.user_id);

  // Create dynamic schema based on input_schema
  const dynamicFields = product.input_schema || [];
  const dynamicSchema = dynamicFields.reduce((acc, field) => {
    if (field.required) {
      acc[field.name] = z.string().min(1, `${field.label} wajib diisi`);
    } else {
      acc[field.name] = z.string().optional();
    }
    return acc;
  }, {} as Record<string, z.ZodType>);

  const form = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      customer_name: profile?.name || '',
      customer_email: profile?.email || '',
      customer_phone: profile?.phone || '',
      quantity: 1,
      coupon_code: '',
      points_to_use: 0,
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

  const watchedQuantity = form.watch('quantity');
  const watchedPoints = form.watch('points_to_use') || 0;
  const subtotal = product.retail_price * (watchedQuantity || 1);
  const discount = couponValidation?.calculated_discount || 0;
  
  // Calculate max redeemable points
  const maxRedeemable = useMemo(() => {
    if (!profile?.user_id || !pointsSettings || !userPoints) return 0;
    return calculateMaxRedeemable(subtotal, userPoints.balance, pointsSettings);
  }, [profile?.user_id, pointsSettings, userPoints, subtotal]);
  
  // Calculate points to be earned from this order
  const pointsToEarn = useMemo(() => {
    if (!pointsSettings) return 0;
    const afterDiscount = Math.max(0, subtotal - discount - watchedPoints);
    return calculatePointsEarned(afterDiscount, pointsSettings);
  }, [pointsSettings, subtotal, discount, watchedPoints]);

  const pointsDiscount = Math.min(watchedPoints, maxRedeemable);
  const total = Math.max(0, subtotal - discount - pointsDiscount);

  const handleCouponApply = () => {
    if (couponCode.trim()) {
      onValidateCoupon(couponCode, subtotal);
    }
  };

  const handlePointsChange = (value: number[]) => {
    const points = value[0] || 0;
    form.setValue('points_to_use', points);
    
    // Validate points on change
    if (profile?.user_id && onValidatePoints && points > 0) {
      onValidatePoints(profile.user_id, points, subtotal);
    }
  };

  const handleFormSubmit = (values: z.infer<typeof baseSchema>) => {
    // Collect dynamic field values
    const collectedInputData: Record<string, string> = {};
    dynamicFields.forEach(field => {
      collectedInputData[field.name] = inputData[field.name] || '';
    });

    onSubmit({
      customer_name: values.customer_name,
      customer_email: values.customer_email,
      customer_phone: values.customer_phone,
      quantity: watchedQuantity,
      coupon_code: couponValidation?.valid ? couponCode : undefined,
      points_to_use: pointsDiscount > 0 ? pointsDiscount : undefined,
      input_data: collectedInputData,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Customer Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pembeli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
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

        {/* Dynamic Input Fields for INVITE products */}
        {dynamicFields.length > 0 && (
          <Card className="glass-card">
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
        <Card className="glass-card">
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
                        × {formatCurrency(product.retail_price)}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Coupon */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Kupon Diskon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Masukkan kode kupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCouponApply}
                disabled={!couponCode.trim()}
              >
                Terapkan
              </Button>
            </div>
            
            {couponValidation && (
              <div className={`flex items-center gap-2 text-sm ${couponValidation.valid ? 'text-success' : 'text-destructive'}`}>
                {couponValidation.valid ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {couponValidation.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points (if logged in and has points or can earn) */}
        {profile && userPoints && (userPoints.balance > 0 || pointsToEarn > 0) && (
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Poin Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Points balance display */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Saldo Poin</span>
                </div>
                <Badge variant="secondary" className="text-base">
                  {userPoints.balance.toLocaleString('id-ID')} poin
                </Badge>
              </div>
              
              {/* Redeem section */}
              {userPoints.balance > 0 && maxRedeemable > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tukar Poin</Label>
                    <span className="text-sm font-medium text-primary">
                      -{formatCurrency(pointsDiscount)}
                    </span>
                  </div>
                  
                  <Slider
                    value={[watchedPoints]}
                    onValueChange={handlePointsChange}
                    max={maxRedeemable}
                    step={100}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 poin</span>
                    <span className="font-medium text-foreground">
                      {watchedPoints.toLocaleString('id-ID')} poin
                    </span>
                    <span>{maxRedeemable.toLocaleString('id-ID')} poin</span>
                  </div>
                  
                  {pointsValidation && !pointsValidation.valid && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <X className="h-4 w-4" />
                      {pointsValidation.error}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    1 poin = Rp 1 • Maks. {pointsSettings?.maxRedeemPercent || 30}% dari subtotal
                  </p>
                </div>
              )}
              
              {/* Points to earn preview */}
              {pointsToEarn > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="text-sm">Poin yang akan didapat</span>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    +{pointsToEarn.toLocaleString('id-ID')} poin
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Diskon Kupon</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Diskon Poin ({pointsDiscount.toLocaleString('id-ID')} poin)</span>
                <span>-{formatCurrency(pointsDiscount)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-gold">{formatCurrency(total)}</span>
            </div>
            
            {/* Points earned note */}
            {profile && pointsToEarn > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Gift className="h-3 w-3" />
                <span>Anda akan mendapat +{pointsToEarn.toLocaleString('id-ID')} poin setelah order selesai</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warning for required description */}
        {product.require_read_description && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Penting!</p>
              <p className="text-muted-foreground">
                Pastikan Anda sudah membaca deskripsi produk dengan teliti sebelum melanjutkan.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full btn-premium"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            `Bayar ${formatCurrency(total)}`
          )}
        </Button>
      </form>
    </Form>
  );
}
