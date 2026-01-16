import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBanking } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowDownLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { deposit } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await deposit(numAmount, description || 'Deposit');
    setLoading(false);

    if (error) {
      toast({ title: 'Deposit failed', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Deposit Successful!</h1>
          <p className="text-muted-foreground mb-6">${amount} has been added to your account.</p>
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
          <h1 className="text-xl font-semibold">Deposit Funds</h1>
        </div>
      </header>

      <div className="container py-8 max-w-md">
        <Card variant="elevated">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <ArrowDownLeft className="w-6 h-6 text-success" />
            </div>
            <CardTitle>Add Money</CardTitle>
            <CardDescription>Deposit funds into your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8" min="0" step="0.01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input placeholder="e.g., Paycheck, Cash deposit" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button type="submit" variant="success" size="lg" className="w-full" disabled={loading}>
                {loading ? <div className="w-5 h-5 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" /> : 'Deposit Funds'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
