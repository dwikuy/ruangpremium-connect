

# RuangPremium - Digital Product Storefront

## 🎯 Overview
Platform storefront digital product dengan pembayaran QRIS (Tokopay), fulfillment otomatis untuk produk STOCK dan INVITE, serta sistem reseller lengkap. Desain dark mode premium dengan aksen gold untuk kesan eksklusif.

---

## 🎨 Design System
- **Warna utama**: Dark background (#0a0a0b) dengan aksen gold (#d4af37) dan deep purple (#7c3aed)
- **Typography**: Modern sans-serif, clean dan mudah dibaca
- **Kartu produk**: Glass morphism effect dengan border subtle
- **Button**: Gradient gold-to-purple untuk CTA utama

---

## 📦 Fase 1: Foundation & Katalog

### Database Setup
- **products** - Data produk dengan tipe STOCK/INVITE
- **product_categories** - Kategori produk
- **stock_items** - Inventori untuk produk STOCK
- **provider_accounts** - Pool akun provider untuk INVITE (ChatGPT, Canva, dll)
- **users/profiles** - Data user dengan roles
- **user_roles** - Tabel terpisah untuk roles (guest/member/reseller/admin)

### Halaman Public
- **Home** (`/`) - Hero, produk unggulan, kategori
- **Katalog** (`/products`) - Grid produk dengan filter & search, badge STOCK/INVITE
- **Detail Produk** (`/products/:slug`) - Info lengkap, harga, tombol beli
- **Halaman statis** - FAQ, Terms, Privacy, Support

---

## 📦 Fase 2: Checkout & Payment

### Alur Checkout
- **Checkout** (`/checkout/:productId`) - Form data pembeli
  - Guest: input nama, email, WhatsApp
  - Member/Reseller: auto-fill dari profil
  - Produk INVITE: input data target (email/ID)
  - Apply kupon & redeem poin
  - Popup "Wajib Baca Deskripsi" (opsional per produk)

### Integrasi Tokopay QRIS
- Edge function untuk create invoice QRIS
- **Invoice** (`/invoice/:orderId`) - Tampil QR code + countdown timer
- Polling status pembayaran realtime
- Webhook handler untuk update status pembayaran

### Order Tracking
- **Tracking** (`/track/:token`) - Status order untuk guest (tanpa login)
- Tampilkan status: payment → processing → delivered
- Hasil delivery (voucher/kode/invite status)

---

## 📦 Fase 3: Fulfillment Otomatis

### Sistem Job Queue
- Database table `fulfillment_jobs` dengan status tracking
- Worker processing untuk eksekusi job

### STOCK Fulfillment
- Ambil stok available → reserve → assign ke order → mark sold
- Simpan delivered secret terenkripsi
- Notifikasi hasil ke buyer

### INVITE Fulfillment (Adapter Pattern)
- **Provider Adapter System** - Interface fleksibel untuk multiple providers
- Mapping produk → provider + plan
- Pool management akun provider:
  - Rotasi akun aktif
  - Kuota harian per akun
  - Cooldown management
- Retry mechanism dengan exponential backoff
- Logging & error handling

---

## 📦 Fase 4: User Authentication & Member Area

### Auth
- Login/Register dengan Supabase Auth
- Forgot password flow
- Role-based access (Guest/Member/Reseller/Admin)

### Member Dashboard
- **Profil** (`/account`) - Edit data diri
- **Order History** (`/account/orders`) - Riwayat pesanan
- **Order Detail** (`/account/orders/:id`) - Detail + hasil delivery
- **Poin** (`/account/points`) - Saldo & riwayat poin

---

## 📦 Fase 5: Sistem Poin & Kupon

### Poin Rewards
- Earn otomatis setelah order sukses (configurable rate)
- Redeem saat checkout dengan max limit
- Riwayat transaksi poin

### Kupon/Voucher
- Multiple tipe: persentase atau nominal
- Syarat: min belanja, max diskon, produk tertentu
- Limit penggunaan total & per user
- Masa berlaku

---

## 📦 Fase 6: Reseller System

### Reseller Dashboard
- **Dashboard** (`/reseller`) - Overview penjualan
- **Orders** (`/reseller/orders`) - Order yang dibuat
- **Wallet** (`/reseller/wallet`) - Saldo & topup via QRIS

### Fitur Reseller
- Harga khusus reseller per produk
- Buat order untuk customer
- Poin reseller terpisah

### Wallet System (2 Mode)
- **Mode 1**: Topup saldo → belanja harga reseller
- **Mode 2**: Bayar QRIS retail → cashback ke wallet

---

## 📦 Fase 7: Reseller API

### API Endpoints
- Generate/revoke API key per reseller
- Dokumentasi endpoint di dashboard
- Rate limiting

### Fitur API
- List produk & harga reseller
- Create order
- Generate invoice QRIS
- Cek status & ambil delivery result
- Webhook ke sistem reseller (opsional)

---

## 📦 Fase 8: Admin Panel

### Dashboard
- Ringkasan order, revenue, pending jobs
- Alert stok menipis

### Management
- **Products** - CRUD produk, set tipe STOCK/INVITE, input schema
- **Pricing** - Harga retail & reseller
- **Coupons** - Kelola voucher/kupon
- **Orders** - List, filter, detail, aksi (retry/cancel)
- **Payments** - Log invoice & webhook Tokopay

### Inventory & Fulfillment
- **Inventory** - Import stok CSV, audit trail
- **Providers** - Daftar provider (ChatGPT, Canva, dll)
- **Provider Accounts** - Pool akun + kuota + status
- **Fulfillment Jobs** - Queue monitoring & error handling

### Settings
- **Poin & Wallet Rules** - Configure earn rate, redeem value, cashback
- **Resellers** - Approve, manage API key, limits

---

## 🔒 Security

- Row Level Security (RLS) di semua tabel
- User roles di tabel terpisah (mencegah privilege escalation)
- Enkripsi data sensitif (stok voucher, credentials provider)
- Webhook signature validation
- Rate limiting untuk API reseller

---

## 🔧 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **Payment**: Tokopay QRIS API
- **Styling**: Dark mode premium dengan glass morphism

