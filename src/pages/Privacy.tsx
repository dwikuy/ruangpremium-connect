import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, UserCheck, Bell, Globe, Mail } from 'lucide-react';

export default function Privacy() {
  return (
    <MainLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Kebijakan Privasi</h1>
            <p className="text-muted-foreground">
              Terakhir diperbarui: 29 Januari 2026
            </p>
          </div>

          {/* Introduction */}
          <Card className="glass-card mb-8">
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                RuangPremium berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan 
                bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda 
                saat menggunakan layanan kami. Dengan mengakses atau menggunakan platform kami, Anda 
                menyetujui praktik yang dijelaskan dalam kebijakan ini.
              </p>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-6">
            {/* Data Collection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  1. Informasi yang Kami Kumpulkan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informasi yang Anda Berikan:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Nama lengkap dan alamat email saat registrasi</li>
                    <li>Nomor telepon untuk keperluan komunikasi</li>
                    <li>Informasi pembayaran (diproses melalui payment gateway)</li>
                    <li>Data input yang diperlukan untuk fulfillment produk</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Informasi yang Dikumpulkan Otomatis:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Alamat IP dan informasi perangkat</li>
                    <li>Data penggunaan dan aktivitas di platform</li>
                    <li>Cookies dan teknologi pelacakan serupa</li>
                    <li>Log transaksi dan riwayat pembelian</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  2. Penggunaan Informasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Kami menggunakan informasi yang dikumpulkan untuk:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Memproses dan mengirimkan pesanan Anda</li>
                  <li>Mengelola akun dan memberikan layanan pelanggan</li>
                  <li>Mengirim notifikasi terkait transaksi dan pembaruan layanan</li>
                  <li>Meningkatkan kualitas produk dan layanan kami</li>
                  <li>Mencegah penipuan dan aktivitas ilegal</li>
                  <li>Memenuhi kewajiban hukum yang berlaku</li>
                  <li>Mengirim informasi promosi (dengan persetujuan Anda)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  3. Keamanan Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Kami menerapkan langkah-langkah keamanan yang ketat untuk melindungi data Anda:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Enkripsi SSL/TLS untuk semua transmisi data</li>
                  <li>Penyimpanan data terenkripsi di server yang aman</li>
                  <li>Akses terbatas hanya untuk personel yang berwenang</li>
                  <li>Pemantauan keamanan 24/7 terhadap ancaman</li>
                  <li>Backup data berkala untuk mencegah kehilangan</li>
                  <li>Audit keamanan rutin dan pengujian penetrasi</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  4. Berbagi Informasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Kami TIDAK menjual data pribadi Anda. Informasi hanya dibagikan kepada:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Payment Gateway:</strong> Untuk memproses pembayaran dengan aman</li>
                  <li><strong>Provider Layanan:</strong> Untuk fulfillment produk digital yang Anda beli</li>
                  <li><strong>Pihak Berwenang:</strong> Jika diwajibkan oleh hukum atau proses hukum</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Semua pihak ketiga yang bekerja sama dengan kami wajib mematuhi standar 
                  perlindungan data yang ketat.
                </p>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-primary" />
                  5. Hak Anda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Anda memiliki hak penuh atas data pribadi Anda:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Akses:</strong> Meminta salinan data pribadi yang kami simpan</li>
                  <li><strong>Koreksi:</strong> Memperbarui atau memperbaiki data yang tidak akurat</li>
                  <li><strong>Penghapusan:</strong> Meminta penghapusan data (dengan batasan tertentu)</li>
                  <li><strong>Portabilitas:</strong> Menerima data Anda dalam format yang dapat dibaca mesin</li>
                  <li><strong>Keberatan:</strong> Menolak pemrosesan data untuk tujuan tertentu</li>
                  <li><strong>Penarikan Persetujuan:</strong> Menarik persetujuan kapan saja</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Untuk menggunakan hak-hak ini, hubungi kami melalui halaman Hubungi Kami.
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  6. Cookies & Teknologi Pelacakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Kami menggunakan cookies untuk:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Menjaga sesi login Anda tetap aktif</li>
                  <li>Mengingat preferensi dan pengaturan Anda</li>
                  <li>Menganalisis penggunaan platform untuk peningkatan layanan</li>
                  <li>Mencegah penipuan dan aktivitas mencurigakan</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Anda dapat mengatur browser untuk menolak cookies, namun beberapa fitur 
                  mungkin tidak berfungsi dengan optimal.
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  7. Penyimpanan Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Data akun disimpan selama akun Anda aktif</li>
                  <li>Riwayat transaksi disimpan sesuai ketentuan hukum perpajakan</li>
                  <li>Data dapat dihapus atas permintaan Anda (kecuali yang diwajibkan hukum)</li>
                  <li>Backup data dihapus dalam 30 hari setelah penghapusan utama</li>
                </ul>
              </CardContent>
            </Card>

            {/* Policy Updates */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  8. Perubahan Kebijakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan 
                  signifikan akan diumumkan melalui email atau notifikasi di platform. Penggunaan 
                  berkelanjutan setelah perubahan berarti Anda menerima kebijakan yang diperbarui. 
                  Kami menyarankan untuk meninjau halaman ini secara berkala.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  9. Hubungi Kami
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau ingin menggunakan 
                  hak privasi Anda, silakan hubungi kami melalui halaman{' '}
                  <a href="/contact" className="text-primary hover:underline">Hubungi Kami</a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
