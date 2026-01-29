import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Instagram } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-premium">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <span className="font-display text-xl font-bold text-gold-gradient">
                RuangPremium
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Toko produk digital premium dengan harga terbaik. Proses otomatis dan instan 24 jam.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/ruangpremium"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@ruangpremium.id"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold">Produk</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="text-muted-foreground transition-colors hover:text-primary">
                  Semua Produk
                </Link>
              </li>
              <li>
                <Link to="/products?type=STOCK" className="text-muted-foreground transition-colors hover:text-primary">
                  Voucher & Kode
                </Link>
              </li>
              <li>
                <Link to="/products?type=INVITE" className="text-muted-foreground transition-colors hover:text-primary">
                  Upgrade Akun
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold">Bantuan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-muted-foreground transition-colors hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground transition-colors hover:text-primary">
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-muted-foreground transition-colors hover:text-primary">
                  Lacak Pesanan
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground transition-colors hover:text-primary">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-muted-foreground transition-colors hover:text-primary">
                  Kebijakan Refund
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground md:flex-row md:text-left">
          <p>© {currentYear} RuangPremium. Hak cipta dilindungi.</p>
          <p>Pembayaran aman via QRIS</p>
        </div>
      </div>
    </footer>
  );
}
