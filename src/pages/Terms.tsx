import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle } from 'lucide-react';

export default function Terms() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-4">
            Syarat & Ketentuan
          </h1>
          <p className="text-muted-foreground">
            Terakhir diperbarui: Januari 2025
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl">
          <Card className="border-border/50">
            <CardContent className="prose prose-invert max-w-none p-8">
              <div className="space-y-8">
                {/* Introduction */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">1. Pendahuluan</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Selamat datang di RuangPremium. Dengan mengakses dan menggunakan layanan kami, 
                    Anda menyetujui untuk terikat dengan syarat dan ketentuan berikut. Mohon baca 
                    dengan seksama sebelum melakukan transaksi.
                  </p>
                </section>

                {/* Definitions */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">2. Definisi</h2>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li><strong>"Kami"</strong> atau <strong>"RuangPremium"</strong> merujuk pada penyedia layanan.</li>
                    <li><strong>"Anda"</strong> atau <strong>"Pembeli"</strong> merujuk pada pengguna yang melakukan transaksi.</li>
                    <li><strong>"Produk"</strong> merujuk pada produk digital yang dijual di platform kami.</li>
                    <li><strong>"Layanan"</strong> merujuk pada semua fitur dan fungsi yang tersedia di platform.</li>
                  </ul>
                </section>

                {/* Account Requirements */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">3. Persyaratan Akun</h2>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Anda harus berusia minimal 17 tahun atau memiliki izin dari orang tua/wali.</li>
                    <li>Informasi yang Anda berikan harus akurat dan dapat dipertanggungjawabkan.</li>
                    <li>Anda bertanggung jawab atas keamanan akun dan semua aktivitas di dalamnya.</li>
                    <li>Satu akun hanya boleh digunakan oleh satu orang.</li>
                  </ul>
                </section>

                {/* Products & Services */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">4. Produk & Layanan</h2>
                  <div className="text-muted-foreground space-y-4">
                    <p>
                      Semua produk yang dijual adalah produk digital berupa voucher, kode aktivasi, 
                      atau layanan upgrade akun. Spesifikasi produk tertera pada halaman produk masing-masing.
                    </p>
                    <p>Ketentuan produk:</p>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Produk <strong>STOCK</strong> dikirim secara otomatis setelah pembayaran berhasil.</li>
                      <li>Produk <strong>INVITE</strong> diproses dalam 1-24 jam kerja.</li>
                      <li>Masa aktif produk sesuai dengan yang tertera di deskripsi.</li>
                      <li>Produk tidak dapat dipindahtangankan ke akun lain setelah diaktifkan.</li>
                    </ul>
                  </div>
                </section>

                {/* Payment */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">5. Pembayaran</h2>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Pembayaran harus dilakukan dalam batas waktu yang ditentukan (15 menit).</li>
                    <li>Order yang tidak dibayar akan otomatis dibatalkan.</li>
                    <li>Harga yang tertera sudah termasuk semua biaya, tidak ada biaya tersembunyi.</li>
                    <li>Pembayaran menggunakan QRIS melalui berbagai e-wallet dan mobile banking.</li>
                  </ul>
                </section>

                {/* Prohibited */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">6. Larangan</h2>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        Pelanggaran terhadap ketentuan ini dapat mengakibatkan pembatalan order, 
                        pemblokiran akun, dan tindakan hukum.
                      </div>
                    </div>
                  </div>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Menjual kembali produk tanpa izin dari RuangPremium.</li>
                    <li>Menggunakan layanan untuk aktivitas ilegal atau melanggar hukum.</li>
                    <li>Menyalahgunakan sistem refund atau chargeback.</li>
                    <li>Berbagi akun atau produk dengan pihak lain tanpa izin.</li>
                    <li>Melakukan tindakan yang dapat merugikan RuangPremium atau pengguna lain.</li>
                  </ul>
                </section>

                {/* Disclaimer */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">7. Batasan Tanggung Jawab</h2>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Kami tidak bertanggung jawab atas kesalahan input data oleh pembeli.</li>
                    <li>Kami tidak bertanggung jawab atas pemblokiran akun oleh pihak provider karena pelanggaran ToS provider.</li>
                    <li>Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan.</li>
                    <li>Force majeure (bencana alam, gangguan server, dll) bukan tanggung jawab kami.</li>
                  </ul>
                </section>

                {/* Changes */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">8. Perubahan Ketentuan</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan 
                    diberitahukan melalui website atau email. Dengan terus menggunakan layanan 
                    setelah perubahan, Anda dianggap menyetujui ketentuan yang baru.
                  </p>
                </section>

                {/* Contact */}
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">9. Kontak</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan 
                    hubungi kami melalui:
                  </p>
                  <ul className="text-muted-foreground space-y-1 mt-3">
                    <li>Email: support@ruangpremium.id</li>
                    <li>WhatsApp: +62 812-3456-7890</li>
                  </ul>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
