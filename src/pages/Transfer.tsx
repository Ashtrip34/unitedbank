import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBanking } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowUpRight, CheckCircle, Search, Building2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import unitedBankLogo from '@/assets/united-bank-logo.png';

const MOCK_BANKS = [
  { name: 'Chase Bank', routing: '021000021' },
  { name: 'Bank of America', routing: '026009593' },
  { name: 'Wells Fargo', routing: '121000248' },
  { name: 'Citibank', routing: '021000089' },
  { name: 'US Bank', routing: '122105155' },
];

export default function Transfer() {
  const [transferType, setTransferType] = useState<'external' | 'internal'>('internal');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientRouting, setRecipientRouting] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [description, setDescription] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifiedRecipient, setVerifiedRecipient] = useState<string | null>(null);
  const { transfer, internalTransfer, account } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredBanks = MOCK_BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));

  const selectBank = (bank: typeof MOCK_BANKS[0]) => {
    setRecipientBank(bank.name);
    setRecipientRouting(bank.routing);
    setBankSearch('');
  };

  const handleVerifyAccount = async () => {
    if (recipientAccount.length !== 10) {
      toast({ title: 'Account number must be 10 digits', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await internalTransfer(0, recipientAccount, '', true); // Verify only
    setLoading(false);

    if (result.error) {
      toast({ title: 'Account not found', description: result.error.message, variant: 'destructive' });
      setVerifiedRecipient(null);
    } else if (result.recipientName) {
      setVerifiedRecipient(result.recipientName);
      toast({ title: 'Account verified', description: `Recipient: ${result.recipientName}` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setLoading(true);

    if (transferType === 'internal') {
      if (recipientAccount.length !== 10) {
        toast({ title: 'Account number must be 10 digits', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { error, recipientName: name } = await internalTransfer(numAmount, recipientAccount, description);
      setLoading(false);

      if (error) {
        toast({ title: 'Transfer failed', description: error.message, variant: 'destructive' });
      } else {
        setRecipientName(name || 'United Bank User');
        setSuccess(true);
      }
    } else {
      if (recipientRouting.length !== 9) {
        toast({ title: 'Routing number must be 9 digits', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { error } = await transfer(numAmount, recipientName, recipientAccount, recipientRouting, recipientBank, description);
      setLoading(false);

      if (error) {
        toast({ title: 'Transfer failed', description: error.message, variant: 'destructive' });
      } else {
        setSuccess(true);
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Transfer Complete!</h1>
          <p className="text-muted-foreground mb-6">${amount} sent to {recipientName || verifiedRecipient || 'recipient'}</p>
          <Button variant="accent" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Send Money</h1>
        </div>
      </header>

      <div className="container py-8 max-w-md">
        <Card variant="elevated">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <ArrowUpRight className="w-6 h-6 text-accent" />
            </div>
            <CardTitle>Transfer Funds</CardTitle>
            <CardDescription>Send money to any bank account securely</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={transferType} onValueChange={(v) => {
              setTransferType(v as 'external' | 'internal');
              setVerifiedRecipient(null);
              setRecipientAccount('');
              setRecipientName('');
            }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <img src={unitedBankLogo} alt="United Bank" className="w-4 h-4 object-contain" />
                  United Bank
                </TabsTrigger>
                <TabsTrigger value="external" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  External Bank
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="internal" className="space-y-4 mt-0">
                  <div className="p-4 bg-accent/5 rounded-lg border border-accent/20 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={unitedBankLogo} alt="United Bank" className="w-8 h-8 object-contain" />
                      <div>
                        <p className="font-medium">United Bank Transfer</p>
                        <p className="text-sm text-muted-foreground">Instant transfers between United Bank accounts</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipient Account Number</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="10-digit account number" 
                        value={recipientAccount} 
                        onChange={(e) => {
                          setRecipientAccount(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setVerifiedRecipient(null);
                        }}
                        maxLength={10}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleVerifyAccount}
                        disabled={recipientAccount.length !== 10 || loading}
                      >
                        Verify
                      </Button>
                    </div>
                    {verifiedRecipient && (
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Recipient: {verifiedRecipient}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="external" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Search Bank</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search banks..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} className="pl-10" />
                    </div>
                    {bankSearch && filteredBanks.length > 0 && (
                      <div className="border rounded-lg divide-y">
                        {filteredBanks.map((bank) => (
                          <button key={bank.routing} type="button" onClick={() => selectBank(bank)} className="w-full px-4 py-3 text-left hover:bg-muted transition-colors">
                            <p className="font-medium">{bank.name}</p>
                            <p className="text-sm text-muted-foreground">Routing: {bank.routing}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {recipientBank && <p className="text-sm text-success">Selected: {recipientBank}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Routing Number</Label>
                      <Input placeholder="9 digits" value={recipientRouting} onChange={(e) => setRecipientRouting(e.target.value.replace(/\D/g, '').slice(0, 9))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input placeholder="Account #" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipient Name</Label>
                    <Input placeholder="John Doe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  </div>
                </TabsContent>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8" min="0" max="2000000" step="0.01" />
                  </div>
                  <p className="text-xs text-muted-foreground">Available: ${Number(account?.balance || 0).toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Note (optional)</Label>
                  <Input placeholder="What's this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <Button 
                  type="submit" 
                  variant="accent" 
                  size="lg" 
                  className="w-full" 
                  disabled={
                    loading || 
                    !amount || 
                    (transferType === 'internal' && recipientAccount.length !== 10) ||
                    (transferType === 'external' && (!recipientName || !recipientAccount || !recipientRouting))
                  }
                >
                  {loading ? <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> : 'Send Money'}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
