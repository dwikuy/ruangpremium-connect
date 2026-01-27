import { CheckCircle, Mail, ExternalLink, Copy, Check, Key, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DeliveryData {
  type?: string;
  provider?: string;
  result?: {
    type?: string;
    status?: string;
    target_email?: string;
    message?: string;
    sent_at?: string;
  };
  items?: string[];
  delivered_at?: string;
}

interface DeliveryResultProps {
  productName: string;
  deliveryData: DeliveryData | Record<string, unknown> | null;
  deliveredAt?: string | null;
}

export function DeliveryResult({ productName, deliveryData, deliveredAt }: DeliveryResultProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  if (!deliveryData) return null;

  const data = deliveryData as DeliveryData;
  
  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle INVITE type delivery (ChatGPT Team, Canva, Spotify, etc.)
  if (data.type === 'INVITE') {
    const result = data.result || {};
    const targetEmail = result.target_email || '';
    const providerName = getProviderDisplayName(data.provider || '');
    const isSuccess = result.status === 'INVITED' || result.status === 'SUCCESS';

    return (
      <div className="p-5 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-success mb-1">{productName}</h4>
            
            {isSuccess ? (
              <div className="space-y-3">
                <p className="text-foreground">
                  ✅ Undangan <span className="font-semibold text-primary">{providerName}</span> sudah dikirim ke:
                </p>
                
                <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-border/50">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-sm font-medium truncate">{targetEmail}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto flex-shrink-0"
                    onClick={() => handleCopy(targetEmail, 0)}
                  >
                    {copiedIndex === 0 ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📧 Silakan cek inbox email (dan folder spam)</p>
                  <p>🔗 Klik link di email untuk bergabung ke workspace</p>
                </div>
              </div>
            ) : (
              <p className="text-warning">
                ⏳ Status: {result.status || 'Pending'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle STOCK type delivery (voucher codes, keys, etc.)
  if (data.type === 'STOCK' && Array.isArray(data.items)) {
    return (
      <div className="p-5 bg-gradient-to-br from-primary/10 to-gold/5 rounded-xl border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-primary mb-3">{productName}</h4>
            
            <div className="space-y-2">
              {data.items.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-border/50"
                >
                  <Gift className="h-4 w-4 text-gold flex-shrink-0" />
                  <code className="font-mono text-sm flex-1 truncate">{item}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleCopy(item, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              💡 Klik icon copy untuk menyalin kode
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for unknown types - still show nicely formatted
  return (
    <div className="p-5 bg-muted/30 rounded-xl border border-border">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold mb-2">{productName}</h4>
          <p className="text-sm text-muted-foreground">
            Pesanan telah selesai diproses.
          </p>
          {deliveredAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Dikirim: {new Date(deliveredAt).toLocaleString('id-ID')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getProviderDisplayName(provider: string): string {
  const providers: Record<string, string> = {
    chatgpt: 'ChatGPT Team',
    canva: 'Canva Pro Team',
    spotify: 'Spotify Family',
    netflix: 'Netflix',
    youtube: 'YouTube Premium',
    figma: 'Figma',
    notion: 'Notion',
    grammarly: 'Grammarly',
  };
  return providers[provider.toLowerCase()] || provider;
}
