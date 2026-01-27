import { MainLayout } from '@/components/layout/MainLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, ShoppingBag, CreditCard, Shield, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const faqCategories = [
  {
    icon: ShoppingBag,
    title: 'Pembelian & Produk',
    items: [
      {
        question: 'Bagaimana cara membeli produk di RuangPremium?',
        answer: 'Pilih produk yang diinginkan, isi data yang diperlukan (seperti email akun), lalu lanjutkan ke pembayaran. Setelah pembayaran berhasil, produk akan diproses secara otomatis.',
      },
      {
        question: 'Apa perbedaan produk tipe STOCK dan INVITE?',
        answer: 'Produk STOCK adalah voucher/kode yang langsung dikirim setelah pembayaran (instant delivery). Produk INVITE adalah upgrade akun yang membutuhkan proses invite ke akun Anda (biasanya 1-24 jam).',
      },
      {
        question: 'Berapa lama waktu pengiriman produk?',
        answer: 'Produk STOCK dikirim instan (1-5 menit). Produk INVITE diproses dalam 1-24 jam tergantung antrian dan ketersediaan slot.',
      },
      {
        question: 'Apakah produk yang dijual original?',
        answer: 'Ya, semua produk yang kami jual adalah 100% original dan legal. Kami bekerja sama dengan provider resmi untuk memastikan kualitas produk.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Pembayaran',
    items: [
      {
        question: 'Metode pembayaran apa saja yang tersedia?',
        answer: 'Saat ini kami menerima pembayaran melalui QRIS yang bisa dibayar menggunakan semua e-wallet dan mobile banking yang mendukung QRIS (GoPay, OVO, DANA, ShopeePay, LinkAja, dll).',
      },
      {
        question: 'Berapa lama batas waktu pembayaran?',
        answer: 'Batas waktu pembayaran adalah 15 menit setelah order dibuat. Jika melewati batas waktu, order akan otomatis dibatalkan.',
      },
      {
        question: 'Apakah ada biaya tambahan saat pembayaran?',
        answer: 'Tidak ada biaya tambahan. Harga yang tertera sudah termasuk semua biaya.',
      },
      {
        question: 'Bagaimana jika pembayaran gagal?',
        answer: 'Jika pembayaran gagal, Anda bisa membuat order baru. Jika saldo sudah terpotong tapi status belum berubah, silakan hubungi customer service kami dengan bukti pembayaran.',
      },
    ],
  },
  {
    icon: Shield,
    title: 'Keamanan & Privasi',
    items: [
      {
        question: 'Apakah data saya aman?',
        answer: 'Ya, kami menggunakan enkripsi SSL dan tidak menyimpan data sensitif seperti password. Data Anda hanya digunakan untuk keperluan transaksi.',
      },
      {
        question: 'Apakah password akun saya diperlukan?',
        answer: 'Tidak, kami tidak pernah meminta password akun Anda. Untuk produk INVITE, kami hanya memerlukan email/username akun yang akan di-upgrade.',
      },
      {
        question: 'Bagaimana cara melindungi akun saya setelah upgrade?',
        answer: 'Pastikan Anda tidak membagikan akses akun ke orang lain. Aktifkan 2FA jika tersedia. Jangan mengubah region/negara akun untuk menghindari banned.',
      },
    ],
  },
  {
    icon: Clock,
    title: 'Masa Aktif & Perpanjangan',
    items: [
      {
        question: 'Berapa lama masa aktif produk?',
        answer: 'Masa aktif bervariasi tergantung produk yang dibeli (1 bulan, 3 bulan, 1 tahun, dll). Informasi masa aktif tertera di deskripsi produk.',
      },
      {
        question: 'Bagaimana cara memperpanjang langganan?',
        answer: 'Anda bisa membeli produk yang sama kembali sebelum masa aktif habis. Perpanjangan akan ditambahkan ke sisa waktu yang ada.',
      },
      {
        question: 'Apakah ada notifikasi sebelum langganan habis?',
        answer: 'Saat ini belum ada notifikasi otomatis. Kami sarankan Anda mencatat tanggal berakhirnya langganan.',
      },
    ],
  },
];

export default function FAQ() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Temukan jawaban untuk pertanyaan yang sering diajukan tentang layanan kami.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="mx-auto max-w-4xl space-y-8">
          {faqCategories.map((category, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mx-auto max-w-2xl mt-12">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="flex flex-col items-center text-center p-8">
              <MessageCircle className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Masih punya pertanyaan?
              </h3>
              <p className="text-muted-foreground mb-6">
                Tim support kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                    Hubungi via WhatsApp
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/track">Lacak Pesanan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
