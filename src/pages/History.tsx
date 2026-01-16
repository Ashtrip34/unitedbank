import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBanking, Transaction } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Receipt, RotateCcw, Shield } from 'lucide-react';
import { TransactionReceipt } from '@/components/TransactionReceipt';
import { getBankByRouting, getCategoryLabel, categorizeTransaction } from '@/lib/bankData';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function History() {
  const { transactions, loading, requestReversal, privilegedUser } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [reversalTx, setReversalTx] = useState<Transaction | null>(null);
  const [reversing, setReversing] = useState(false);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleReversal = async () => {
    if (!reversalTx) return;
    
    setReversing(true);
    const { error, message } = await requestReversal(reversalTx.id);
    setReversing(false);
    setReversalTx(null);
    
    if (error) {
      toast({ title: 'Reversal Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment Reversed', description: message || 'The payment has been reversed successfully.' });
    }
  };

  const canReverse = (tx: Transaction) => {
    // Only allow reversal for outgoing transfers (negative amounts) by privileged users
    return privilegedUser?.can_request_reversal && tx.amount < 0 && tx.type === 'transfer';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Transaction History</h1>
          {privilegedUser && (
            <Badge variant="outline" className="ml-auto flex items-center gap-1 text-yellow-600 border-yellow-400">
              <Shield className="w-3 h-3" />
              Privileged
            </Badge>
          )}
        </div>
      </header>

      <div className="container py-6">
        <Card variant="elevated">
          <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
            ) : (
              transactions.map((tx) => {
                const bankInfo = tx.recipient_routing ? getBankByRouting(tx.recipient_routing) : null;
                const category = tx.category || categorizeTransaction(tx.description || '');
                const isReversible = canReverse(tx);
                
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                        tx.type === 'deposit' || tx.type === 'reversal' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {bankInfo ? (
                          <img 
                            src={bankInfo.logo} 
                            alt={bankInfo.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : tx.type === 'deposit' || tx.type === 'reversal' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                          <Badge variant="secondary" className="text-xs">{getCategoryLabel(category)}</Badge>
                          {tx.type === 'reversal' && (
                            <Badge variant="outline" className="text-xs text-success border-success">Reversed</Badge>
                          )}
                        </div>
                        {tx.recipient_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            To: {tx.recipient_name}
                            {bankInfo && <span className="text-primary">({bankInfo.name})</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`font-semibold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>{tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}</span>
                        <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                      </div>
                      {isReversible && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setReversalTx(tx)} 
                          title="Request Reversal"
                          className="text-yellow-600 border-yellow-400 hover:bg-yellow-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setSelectedTx(tx)} title="View Receipt">
                        <Receipt className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionReceipt 
        transaction={selectedTx} 
        open={!!selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />

      {/* Reversal Confirmation Dialog */}
      <AlertDialog open={!!reversalTx} onOpenChange={() => setReversalTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Reversal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reverse this payment of {reversalTx && formatCurrency(Math.abs(reversalTx.amount))}?
              <br /><br />
              <strong>Transaction:</strong> {reversalTx?.description}
              <br />
              <strong>Recipient:</strong> {reversalTx?.recipient_name || 'N/A'}
              <br /><br />
              This action will immediately credit the amount back to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reversing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReversal} 
              disabled={reversing}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {reversing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Reverse Payment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}