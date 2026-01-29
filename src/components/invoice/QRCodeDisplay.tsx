import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { PaymentInfo } from '@/types/database';

interface QRCodeDisplayProps {
  payment: PaymentInfo | null;
  amount: number;
  loading: boolean;
  isExpired: boolean;
  onCreatePayment: () => void;
}

export function QRCodeDisplay({
  payment,
  amount,
  loading,
  isExpired,
  onCreatePayment,
}: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!payment?.expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(payment.expires_at!).getTime();
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [payment?.expires_at]);

  const handleCopyRefId = async () => {
    if (payment?.ref_id) {
      await navigator.clipboard.writeText(payment.ref_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-center">Memuat QR Code...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Skeleton className="w-64 h-64 rounded-lg" />
          <Skeleton className="w-32 h-8" />
        </CardContent>
      </Card>
    );
  }

  if (!payment && !isExpired) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-center">Pembayaran QRIS</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-center">
            Klik tombol untuk menampilkan QRIS, lalu scan dari e-wallet / m-banking.
          </p>
          <Button onClick={onCreatePayment} className="btn-premium w-full max-w-md">
            Bayar {formatCurrency(amount)}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card className="glass-card border-destructive/50">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Pembayaran Kadaluarsa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-center">
            Waktu pembayaran telah habis. Silakan buat pembayaran baru.
          </p>
          <Button onClick={onCreatePayment} className="btn-premium">
            <RefreshCw className="mr-2 h-4 w-4" />
            Buat QR Baru
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Scan QR untuk Bayar</CardTitle>
          <Badge variant="outline" className="text-gold border-gold">
            <Clock className="mr-1 h-3 w-3" />
            {timeLeft}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* QR Code Image */}
        {payment?.qr_link && (
          <div className="bg-white p-4 rounded-lg">
            <img
              src={payment.qr_link}
              alt="QR Code Pembayaran"
              className="w-64 h-64 object-contain"
            />
          </div>
        )}

        {/* Amount */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Total Pembayaran</p>
          <p className="text-3xl font-bold text-gold">{formatCurrency(amount)}</p>
        </div>

        {/* Reference ID */}
        {payment?.ref_id && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ref:</span>
            <code className="bg-muted px-2 py-1 rounded">{payment.ref_id}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopyRefId}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}

        {/* Alternative Payment Link */}
        {payment?.pay_url && (
          <Button variant="outline" asChild className="w-full">
            <a href={payment.pay_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Buka Link Pembayaran
            </a>
          </Button>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <p>1. Buka aplikasi e-wallet atau mobile banking</p>
          <p>2. Pilih menu Scan QR / QRIS</p>
          <p>3. Scan QR code di atas</p>
          <p>4. Konfirmasi pembayaran</p>
        </div>
      </CardContent>
    </Card>
  );
}
