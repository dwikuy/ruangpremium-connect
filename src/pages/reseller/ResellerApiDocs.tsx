import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Code2,
  ShoppingBag,
  CreditCard,
  Package,
  Key
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

const CodeBlock = ({ code, language = 'javascript' }: { code: string; language?: string }) => (
  <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm">
    <code className={`language-${language}`}>{code}</code>
  </pre>
);

export default function ResellerApiDocs() {
  return (
    <ResellerLayout 
      title="Dokumentasi API" 
      description="Panduan lengkap untuk mengintegrasikan API reseller"
    >
      <div className="space-y-6">
        {/* Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              API Reseller memungkinkan Anda untuk mengintegrasikan sistem RuangPremium ke website atau aplikasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Base URL</h4>
              <code className="px-3 py-2 rounded bg-muted text-sm block">
                {API_BASE_URL}
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Semua request harus menyertakan header Authorization dengan API key Anda:
              </p>
              <CodeBlock code={`Authorization: Bearer rp_xxxxxxxxxxxxxxxxxxxxxxxx`} />
            </div>

            <div>
              <h4 className="font-medium mb-2">Response Format</h4>
              <p className="text-sm text-muted-foreground">
                Semua response menggunakan format JSON. Response sukses akan memiliki struktur:
              </p>
              <CodeBlock code={`{
  "success": true,
  "data": { ... }
}

// Error response:
{
  "success": false,
  "error": "Error message"
}`} />
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="products" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-1">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Webhook</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* List Products */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-success/20 text-success">GET</Badge>
                    <code className="text-sm">/reseller-api/products</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mendapatkan daftar semua produk yang tersedia dengan harga reseller
                  </p>
                  <h5 className="font-medium text-sm mb-2">Response:</h5>
                  <CodeBlock code={`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ChatGPT Plus 1 Bulan",
      "slug": "chatgpt-plus-1-bulan",
      "description": "...",
      "product_type": "INVITE",
      "retail_price": 250000,
      "reseller_price": 200000,
      "stock_available": 10,
      "category": {
        "id": "uuid",
        "name": "AI Tools"
      }
    }
  ]
}`} />
                </div>

                {/* Get Product */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-success/20 text-success">GET</Badge>
                    <code className="text-sm">/reseller-api/products/:id</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mendapatkan detail produk berdasarkan ID
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Orders API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create Order */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-primary/20 text-primary">POST</Badge>
                    <code className="text-sm">/reseller-api/orders</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Membuat order baru untuk customer
                  </p>
                  <h5 className="font-medium text-sm mb-2">Request Body:</h5>
                  <CodeBlock code={`{
  "product_id": "uuid",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "081234567890",
  "quantity": 1,
  "input_data": {
    "target_email": "customer@gmail.com"
  },
  "payment_method": "WALLET" // atau "QRIS"
}`} />
                  <h5 className="font-medium text-sm mt-4 mb-2">Response:</h5>
                  <CodeBlock code={`{
  "success": true,
  "data": {
    "order_id": "uuid",
    "status": "PAID", // jika WALLET
    "total_amount": 200000,
    "payment": {
      "qr_link": "...", // jika QRIS
      "pay_url": "...",
      "expires_at": "..."
    }
  }
}`} />
                </div>

                {/* List Orders */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-success/20 text-success">GET</Badge>
                    <code className="text-sm">/reseller-api/orders</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mendapatkan daftar order yang dibuat oleh reseller
                  </p>
                </div>

                {/* Get Order */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-success/20 text-success">GET</Badge>
                    <code className="text-sm">/reseller-api/orders/:id</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mendapatkan detail order termasuk status delivery
                  </p>
                  <h5 className="font-medium text-sm mb-2">Response:</h5>
                  <CodeBlock code={`{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "DELIVERED",
    "customer_name": "John Doe",
    "total_amount": 200000,
    "items": [
      {
        "product_name": "ChatGPT Plus 1 Bulan",
        "quantity": 1,
        "delivery_data": {
          "status": "SUCCESS",
          "message": "Invite berhasil dikirim ke customer@gmail.com"
        }
      }
    ]
  }
}`} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payments API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Check Payment */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-success/20 text-success">GET</Badge>
                    <code className="text-sm">/reseller-api/payments/:orderId</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cek status pembayaran order
                  </p>
                  <h5 className="font-medium text-sm mb-2">Response:</h5>
                  <CodeBlock code={`{
  "success": true,
  "data": {
    "order_id": "uuid",
    "payment_status": "PAID",
    "order_status": "DELIVERED",
    "paid_at": "2024-01-15T10:30:00Z"
  }
}`} />
                </div>

                {/* Wallet Balance */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-success/20 text-success">GET</Badge>
                    <code className="text-sm">/reseller-api/wallet</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cek saldo wallet reseller
                  </p>
                  <h5 className="font-medium text-sm mb-2">Response:</h5>
                  <CodeBlock code={`{
  "success": true,
  "data": {
    "balance": 5000000,
    "total_topup": 10000000,
    "total_spent": 5000000,
    "total_cashback": 250000
  }
}`} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Webhook (Opsional)
                </CardTitle>
                <CardDescription>
                  Terima notifikasi real-time ketika status order berubah
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Anda dapat mendaftarkan webhook URL untuk menerima notifikasi ketika:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                    <li>Order dibayar (status: PAID)</li>
                    <li>Order diproses (status: PROCESSING)</li>
                    <li>Order dikirim (status: DELIVERED)</li>
                    <li>Order gagal (status: FAILED)</li>
                  </ul>
                  
                  <h5 className="font-medium text-sm mb-2">Webhook Payload:</h5>
                  <CodeBlock code={`{
  "event": "order.delivered",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "uuid",
    "status": "DELIVERED",
    "customer_email": "john@example.com",
    "items": [
      {
        "product_name": "ChatGPT Plus 1 Bulan",
        "delivery_data": {
          "status": "SUCCESS",
          "message": "Invite berhasil"
        }
      }
    ]
  },
  "signature": "sha256=..."
}`} />

                  <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <p className="text-sm">
                      <strong>Catatan:</strong> Untuk mendaftarkan webhook URL, silakan hubungi admin 
                      atau gunakan halaman pengaturan API key.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rate Limiting */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              API memiliki batasan request untuk mencegah penyalahgunaan:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">Default Limit</p>
                <p className="text-2xl font-bold text-primary">100 req/menit</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">Burst Limit</p>
                <p className="text-2xl font-bold text-primary">10 req/detik</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Jika Anda membutuhkan limit yang lebih tinggi, hubungi admin untuk upgrade.
            </p>
          </CardContent>
        </Card>
      </div>
    </ResellerLayout>
  );
}
