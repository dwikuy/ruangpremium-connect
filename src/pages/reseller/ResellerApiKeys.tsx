import { useState } from 'react';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useResellerApiKeys, 
  useGenerateApiKey, 
  useRevokeApiKey,
  useDeleteApiKey,
  useUpdateWebhook,
  useWebhookDeliveries
} from '@/hooks/useReseller';
import { 
  Key, 
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Webhook,
  Settings,
  History,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ResellerApiKeys() {
  const { data: apiKeys, isLoading } = useResellerApiKeys();
  const generateApiKey = useGenerateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const deleteApiKey = useDeleteApiKey();
  const updateWebhook = useUpdateWebhook();
  const { toast } = useToast();
  
  const [keyName, setKeyName] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ rawKey: string; keyPrefix: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [webhookDialog, setWebhookDialog] = useState<{ keyId: string; url: string; secret: string; enabled: boolean } | null>(null);
  const [selectedKeyForLogs, setSelectedKeyForLogs] = useState<string | null>(null);

  const { data: webhookLogs, isLoading: loadingLogs } = useWebhookDeliveries(selectedKeyForLogs || undefined);

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    
    const result = await generateApiKey.mutateAsync(keyName);
    setNewKeyData(result);
    setKeyName('');
    setIsCreateOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Disalin!',
      description: 'Teks telah disalin ke clipboard.',
    });
  };

  const handleSaveWebhook = () => {
    if (!webhookDialog) return;
    updateWebhook.mutate({
      keyId: webhookDialog.keyId,
      webhookUrl: webhookDialog.url || undefined,
      webhookSecret: webhookDialog.secret || undefined,
      webhookEnabled: webhookDialog.enabled,
    }, {
      onSuccess: () => setWebhookDialog(null),
    });
  };

  const generateWebhookSecret = () => {
    const secret = 'whsec_' + crypto.randomUUID().replace(/-/g, '');
    if (webhookDialog) {
      setWebhookDialog({ ...webhookDialog, secret });
    }
  };

  const activeKeys = apiKeys?.filter(k => k.is_active) || [];
  const revokedKeys = apiKeys?.filter(k => !k.is_active) || [];

  return (
    <ResellerLayout 
      title="API Keys" 
      description="Kelola API keys dan webhook untuk integrasi dengan sistem Anda"
    >
      {/* New Key Modal */}
      {newKeyData && (
        <Dialog open={!!newKeyData} onOpenChange={() => setNewKeyData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                API Key Berhasil Dibuat!
              </DialogTitle>
              <DialogDescription>
                Simpan API key ini sekarang. Key tidak akan ditampilkan lagi setelah modal ini ditutup.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <p className="text-sm">
                    <strong>Penting:</strong> Salin dan simpan API key ini di tempat yang aman. 
                    Kami tidak menyimpan key asli dan tidak dapat menampilkannya lagi.
                  </p>
                </div>
              </div>
              
              <Label className="text-sm">API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={showKey ? newKeyData.rawKey : '•'.repeat(40)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newKeyData.rawKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewKeyData(null)}>
                Saya Sudah Menyimpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button className="btn-premium mb-6">
            <Plus className="h-4 w-4 mr-2" />
            <span>Buat API Key Baru</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat API Key Baru</DialogTitle>
            <DialogDescription>
              Berikan nama untuk API key ini agar mudah diidentifikasi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="key-name">Nama API Key</Label>
            <Input
              id="key-name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Contoh: Website Toko, App Mobile"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleCreateKey}
              disabled={!keyName.trim() || generateApiKey.isPending}
            >
              {generateApiKey.isPending ? 'Membuat...' : 'Buat Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Settings Dialog */}
      <Dialog open={!!webhookDialog} onOpenChange={() => setWebhookDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Pengaturan Webhook
            </DialogTitle>
            <DialogDescription>
              Konfigurasi webhook untuk menerima notifikasi status order secara real-time
            </DialogDescription>
          </DialogHeader>
          {webhookDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aktifkan Webhook</Label>
                  <p className="text-sm text-muted-foreground">
                    Kirim notifikasi saat status order berubah
                  </p>
                </div>
                <Switch
                  checked={webhookDialog.enabled}
                  onCheckedChange={(checked) => 
                    setWebhookDialog({ ...webhookDialog, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-site.com/webhook"
                  value={webhookDialog.url}
                  onChange={(e) => 
                    setWebhookDialog({ ...webhookDialog, url: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  URL endpoint yang akan menerima POST request
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-secret"
                    placeholder="whsec_..."
                    value={webhookDialog.secret}
                    onChange={(e) => 
                      setWebhookDialog({ ...webhookDialog, secret: e.target.value })
                    }
                  />
                  <Button variant="outline" onClick={generateWebhookSecret}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Secret untuk memverifikasi signature webhook
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">Format Payload Webhook:</p>
                <pre className="text-xs overflow-x-auto bg-background p-2 rounded">
{`{
  "event": "order.paid|order.delivered",
  "order_id": "uuid",
  "order_status": "PAID|DELIVERED",
  "customer_email": "email",
  "customer_name": "name",
  "total_amount": 100000,
  "items": [...],
  "created_at": "timestamp"
}`}
                </pre>
                <p className="mt-2 text-muted-foreground">
                  Header: <code className="bg-background px-1 rounded">X-Webhook-Signature</code> untuk verifikasi
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialog(null)}>
              Batal
            </Button>
            <Button 
              onClick={handleSaveWebhook}
              disabled={updateWebhook.isPending}
            >
              {updateWebhook.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Logs Dialog */}
      <Dialog open={!!selectedKeyForLogs} onOpenChange={() => setSelectedKeyForLogs(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Webhook
            </DialogTitle>
            <DialogDescription>
              Log pengiriman webhook terbaru (50 terakhir)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {loadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !webhookLogs || webhookLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada riwayat webhook
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.delivered_at ? (
                          <Badge className="bg-primary/20 text-primary">
                            {log.response_status}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {log.error || log.response_body || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedKeyForLogs(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Keys */}
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Aktif
          </CardTitle>
          <CardDescription>
            API keys yang dapat digunakan untuk mengakses API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada API key aktif</p>
              <p className="text-sm">Buat API key untuk mulai mengintegrasikan sistem Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeKeys.map((key) => (
                <div 
                  key={key.id}
                  className="flex flex-col gap-4 p-4 rounded-lg bg-muted/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{key.name}</p>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          Aktif
                        </Badge>
                        {(key as any).webhook_enabled && (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                            <Webhook className="h-3 w-3 mr-1" />
                            Webhook
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-sm text-muted-foreground">
                        {key.key_prefix}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dibuat: {format(new Date(key.created_at), 'dd MMM yyyy', { locale: id })}
                        {key.last_used_at && (
                          <> • Terakhir digunakan: {format(new Date(key.last_used_at), 'dd MMM yyyy, HH:mm', { locale: id })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setWebhookDialog({
                          keyId: key.id,
                          url: (key as any).webhook_url || '',
                          secret: (key as any).webhook_secret || '',
                          enabled: (key as any).webhook_enabled || false,
                        })}
                      >
                        <Webhook className="h-4 w-4 mr-2" />
                        Webhook
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedKeyForLogs(key.id)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Logs
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-warning">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cabut
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cabut API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              API key "{key.name}" tidak akan bisa digunakan lagi setelah dicabut.
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeApiKey.mutate(key.id)}
                              className="bg-warning hover:bg-warning/90"
                            >
                              Ya, Cabut Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {/* Webhook URL display */}
                  {(key as any).webhook_enabled && (key as any).webhook_url && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Webhook className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Webhook URL:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[300px]">
                          {(key as any).webhook_url}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Key className="h-5 w-5" />
              API Keys Dicabut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revokedKeys.map((key) => (
                <div 
                  key={key.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 opacity-60"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{key.name}</p>
                      <Badge variant="destructive">
                        Dicabut
                      </Badge>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {key.key_prefix}...
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          API key "{key.name}" akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteApiKey.mutate(key.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </ResellerLayout>
  );
}
