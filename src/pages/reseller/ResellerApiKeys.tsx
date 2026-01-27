import { useState } from 'react';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useResellerApiKeys, 
  useGenerateApiKey, 
  useRevokeApiKey,
  useDeleteApiKey 
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
  XCircle
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

export default function ResellerApiKeys() {
  const { data: apiKeys, isLoading } = useResellerApiKeys();
  const generateApiKey = useGenerateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const deleteApiKey = useDeleteApiKey();
  const { toast } = useToast();
  
  const [keyName, setKeyName] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ rawKey: string; keyPrefix: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

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
      description: 'API key telah disalin ke clipboard.',
    });
  };

  const activeKeys = apiKeys?.filter(k => k.is_active) || [];
  const revokedKeys = apiKeys?.filter(k => !k.is_active) || [];

  return (
    <ResellerLayout 
      title="API Keys" 
      description="Kelola API keys untuk integrasi dengan sistem Anda"
    >
      {/* New Key Modal */}
      {newKeyData && (
        <Dialog open={!!newKeyData} onOpenChange={() => setNewKeyData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{key.name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success">
                        Aktif
                      </span>
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
                  <div className="flex gap-2">
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/20 text-destructive">
                        Dicabut
                      </span>
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
