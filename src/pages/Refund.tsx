import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCcw, AlertCircle, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Refund() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <RefreshCcw className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-4">
            Kebijakan Refund
          </h1>
          <p className="text-muted-foreground">
            Terakhir diperbarui: Januari 2025
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Important Notice */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Penting untuk Diketahui</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Karena produk kami adalah produk digital yang langsung dapat digunakan setelah 
                    pembelian, refund <strong>TIDAK DAPAT</strong> dilakukan jika produk/akun berfungsi 
                    dengan normal. Refund hanya diberikan jika terjadi kendala teknis atau error 
                    dari sistem kami.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="border-border/50">
            <CardContent className="p-8 space-y-8">
              {/* Refund Eligible */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Kondisi yang Memenuhi Syarat Refund</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Refund dapat diproses jika terjadi kondisi berikut:
                </p>
                <ul className="text-muted-foreground space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <span>
                      <strong>Error pada sistem:</strong> Pembayaran berhasil namun produk tidak terkirim 
                      karena kesalahan sistem kami.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <span>
                      <strong>Produk tidak valid:</strong> Kode/voucher yang dikirim tidak dapat digunakan 
                      atau sudah digunakan sebelumnya (bukan oleh pembeli).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <span>
                      <strong>Akun tidak ter-upgrade:</strong> Untuk produk INVITE, jika akun gagal 
                      di-upgrade setelah waktu yang dijanjikan (maksimal 48 jam).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <span>
                      <strong>Kesalahan dari pihak kami:</strong> Produk yang dikirim tidak sesuai 
                      dengan yang dipesan.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <span>
                      <strong>Duplikat pembayaran:</strong> Pembayaran terdebet lebih dari sekali 
                      untuk satu order yang sama.
                    </span>
                  </li>
                </ul>
              </section>

              {/* Refund Not Eligible */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Kondisi yang TIDAK Memenuhi Syarat Refund</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Refund <strong>TIDAK DAPAT</strong> diproses untuk kondisi berikut:
                </p>
                <ul className="text-muted-foreground space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Akun berfungsi normal:</strong> Jika produk/akun sudah aktif dan berfungsi 
                      dengan baik, refund tidak dapat dilakukan dengan alasan apapun (berubah pikiran, 
                      tidak jadi pakai, dll).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Kesalahan input data:</strong> Kesalahan memasukkan email, username, atau 
                      data lainnya yang menyebabkan produk terkirim ke akun yang salah.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Akun diblokir oleh provider:</strong> Jika akun Anda diblokir/banned oleh 
                      pihak provider (Spotify, Netflix, dll) karena melanggar ToS mereka.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Kode sudah digunakan:</strong> Jika kode/voucher sudah diaktifkan atau 
                      di-redeem oleh pembeli.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Perubahan pikiran:</strong> Pembeli berubah pikiran setelah membeli atau 
                      tidak jadi menggunakan produk.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Sharing akun:</strong> Akun premium yang dibeli di-share ke orang lain 
                      dan mengakibatkan masalah.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <span>
                      <strong>Masalah perangkat:</strong> Produk tidak bisa digunakan karena masalah 
                      pada perangkat pembeli (HP, laptop, koneksi internet, dll).
                    </span>
                  </li>
                </ul>
              </section>

              {/* Process */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Proses Pengajuan Refund</h2>
                <ol className="text-muted-foreground space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      1
                    </span>
                    <span>
                      Hubungi customer service kami via WhatsApp atau email dalam waktu 
                      <strong> maksimal 24 jam</strong> setelah pembelian.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      2
                    </span>
                    <span>
                      Sertakan bukti-bukti pendukung: Order ID, bukti pembayaran, screenshot error/masalah.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      3
                    </span>
                    <span>
                      Tim kami akan memverifikasi laporan Anda dalam waktu 1-3 hari kerja.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      4
                    </span>
                    <span>
                      Jika refund disetujui, dana akan dikembalikan dalam waktu 3-7 hari kerja 
                      ke metode pembayaran asal atau saldo akun.
                    </span>
                  </li>
                </ol>
              </section>

              {/* Refund Amount */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Jumlah Refund</h2>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Refund penuh (100%) jika produk sama sekali tidak dapat digunakan karena kesalahan kami.</li>
                  <li>Refund sebagian (prorata) jika produk bisa digunakan sebagian waktu sebelum terjadi masalah.</li>
                  <li>Penggantian produk dapat ditawarkan sebagai alternatif refund uang.</li>
                </ul>
              </section>

              {/* Contact */}
              <section className="pt-4 border-t border-border/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">
                      Ada pertanyaan tentang refund?
                    </span>
                  </div>
                  <Button asChild>
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                      Hubungi Customer Service
                    </a>
                  </Button>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
