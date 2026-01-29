import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  Send, 
  Phone, 
  MapPin,
  CheckCircle,
  HelpCircle,
  ShoppingBag,
  AlertTriangle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const contactReasons = [
  { value: 'order', label: 'Pertanyaan Pesanan', icon: ShoppingBag },
  { value: 'technical', label: 'Masalah Teknis', icon: AlertTriangle },
  { value: 'refund', label: 'Permintaan Refund', icon: HelpCircle },
  { value: 'reseller', label: 'Program Reseller', icon: Users },
  { value: 'other', label: 'Lainnya', icon: MessageCircle },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    reason: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.reason || !formData.message) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Pesan Anda telah terkirim!');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Pesan Terkirim!</h1>
            <p className="text-muted-foreground mb-8">
              Terima kasih telah menghubungi kami. Tim kami akan merespons dalam waktu 
              1x24 jam kerja. Silakan cek email Anda untuk update.
            </p>
            <Button onClick={() => setIsSubmitted(false)}>
              Kirim Pesan Lain
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Hubungi Kami</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ada pertanyaan atau butuh bantuan? Tim support kami siap membantu Anda. 
              Isi form di bawah atau hubungi kami melalui channel lainnya.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Kirim Pesan</CardTitle>
                  <CardDescription>
                    Isi form berikut dan kami akan merespons secepatnya
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          placeholder="Masukkan nama Anda"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Nomor WhatsApp</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Kategori *</Label>
                        <Select
                          value={formData.reason}
                          onValueChange={(value) => handleChange('reason', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactReasons.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                <div className="flex items-center gap-2">
                                  <reason.icon className="h-4 w-4" />
                                  {reason.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subjek</Label>
                      <Input
                        id="subject"
                        placeholder="Ringkasan pertanyaan Anda"
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Pesan *</Label>
                      <Textarea
                        id="message"
                        placeholder="Jelaskan pertanyaan atau masalah Anda secara detail..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Kirim Pesan
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Kontak Langsung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <a 
                    href="mailto:support@ruangpremium.id" 
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <p className="text-muted-foreground text-sm">support@ruangpremium.id</p>
                    </div>
                  </a>

                  <a 
                    href="https://wa.me/6281234567890" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10">
                      <Phone className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-muted-foreground text-sm">+62 812-3456-7890</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Lokasi</p>
                      <p className="text-muted-foreground text-sm">Indonesia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Jam Operasional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Senin - Jumat</span>
                      <span className="font-medium">09:00 - 21:00 WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sabtu</span>
                      <span className="font-medium">09:00 - 18:00 WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minggu</span>
                      <span className="font-medium">10:00 - 15:00 WIB</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-muted-foreground text-xs">
                        * Layanan otomatis tersedia 24/7. Respon manual dalam 1x24 jam kerja.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Link */}
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Cari Jawaban Cepat?</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Kunjungi halaman FAQ kami untuk jawaban atas pertanyaan yang sering diajukan.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/faq">Lihat FAQ</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
