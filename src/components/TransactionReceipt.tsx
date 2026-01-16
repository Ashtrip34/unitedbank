import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Download, Share2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Transaction } from '@/hooks/useBanking';
import { getBankByRouting, getCategoryLabel } from '@/lib/bankData';
import html2canvas from 'html2canvas';
import unitedBankLogo from '@/assets/united-bank-logo.png';

interface TransactionReceiptProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionReceipt({ transaction, open, onClose }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const bankInfo = transaction.recipient_routing ? getBankByRouting(transaction.recipient_routing) : null;
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount));
  const formatDate = (date: string) => new Date(date).toLocaleString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  const maskNumber = (num: string | null) => {
    if (!num || num.length < 4) return '****';
    return '****' + num.slice(-4);
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'failed': return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `receipt-${transaction.reference_number}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Transaction Receipt',
            text: `Receipt for ${formatCurrency(transaction.amount)} - ${transaction.description}`,
            files: [file],
          });
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt-${transaction.reference_number}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transaction.reference_number}.png`;
      a.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Transaction Receipt
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="bg-card p-6 rounded-lg space-y-6">

          {/* Bank Logo & Info */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {bankInfo ? (
                <img 
                  src={bankInfo.logo} 
                  alt={bankInfo.name} 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <img src={unitedBankLogo} alt="United Bank" className="w-10 h-10 object-contain" />
              )}
              <Building2 className={`w-8 h-8 text-primary hidden`} />
            </div>
            {bankInfo && <p className="font-medium text-foreground">{bankInfo.name}</p>}
          </div>

          {/* Amount */}
          <div className="text-center">
            <p className={`text-3xl font-bold ${transaction.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
              {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-muted-foreground capitalize">{transaction.type}</p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            <span className="capitalize font-medium">{transaction.status}</span>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{formatDate(transaction.created_at)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference ID</span>
              <span className="font-mono text-xs">{transaction.reference_number.slice(0, 8)}...</span>
            </div>
            
            {transaction.description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-[60%]">{transaction.description}</span>
              </div>
            )}

            {transaction.category && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="secondary">{getCategoryLabel(transaction.category)}</Badge>
              </div>
            )}

            {transaction.type === 'transfer' && (
              <>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Recipient Details</p>
                </div>
                
                {transaction.recipient_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{transaction.recipient_name}</span>
                  </div>
                )}
                
                {transaction.recipient_bank && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{transaction.recipient_bank}</span>
                  </div>
                )}
                
                {transaction.recipient_account && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-mono">{maskNumber(transaction.recipient_account)}</span>
                  </div>
                )}
                
                {transaction.recipient_routing && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Routing</span>
                    <span className="font-mono">{maskNumber(transaction.recipient_routing)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">United Bank - Official Transaction Receipt</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="accent" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
