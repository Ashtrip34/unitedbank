import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBanking } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, Plus, Pause, Play, Trash2, Edit, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledPayment {
  id: string;
  user_id: string;
  account_id: string;
  recipient_name: string;
  recipient_account: string;
  recipient_routing: string;
  recipient_bank: string | null;
  amount: number;
  description: string | null;
  frequency: string;
  next_payment_date: string;
  end_date: string | null;
  status: string;
  category: string | null;
  created_at: string;
}

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'One Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function BillPay() {
  const { user } = useAuth();
  const { account } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ScheduledPayment | null>(null);
  
  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientRouting, setRecipientRouting] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('scheduled_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('next_payment_date', { ascending: true });
    
    if (error) {
      toast({ title: 'Error loading payments', variant: 'destructive' });
    } else {
      setPayments(data as ScheduledPayment[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setRecipientName('');
    setRecipientAccount('');
    setRecipientRouting('');
    setRecipientBank('');
    setAmount('');
    setDescription('');
    setFrequency('monthly');
    setNextPaymentDate('');
    setEditingPayment(null);
  };

  const openEditDialog = (payment: ScheduledPayment) => {
    setEditingPayment(payment);
    setRecipientName(payment.recipient_name);
    setRecipientAccount(payment.recipient_account);
    setRecipientRouting(payment.recipient_routing);
    setRecipientBank(payment.recipient_bank || '');
    setAmount(payment.amount.toString());
    setDescription(payment.description || '');
    setFrequency(payment.frequency);
    setNextPaymentDate(payment.next_payment_date);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    if (recipientRouting.length !== 9) {
      toast({ title: 'Routing number must be 9 digits', variant: 'destructive' });
      return;
    }

    setFormLoading(true);

    const paymentData = {
      user_id: user.id,
      account_id: account.id,
      recipient_name: recipientName,
      recipient_account: recipientAccount,
      recipient_routing: recipientRouting,
      recipient_bank: recipientBank || null,
      amount: numAmount,
      description: description || null,
      frequency,
      next_payment_date: nextPaymentDate,
    };

    let error;
    if (editingPayment) {
      const { error: updateError } = await supabase
        .from('scheduled_payments')
        .update(paymentData)
        .eq('id', editingPayment.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('scheduled_payments')
        .insert(paymentData);
      error = insertError;
    }

    setFormLoading(false);

    if (error) {
      toast({ title: 'Error saving payment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingPayment ? 'Payment updated' : 'Payment scheduled', variant: 'default' });
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    }
  };

  const togglePaymentStatus = async (payment: ScheduledPayment) => {
    const newStatus = payment.status === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('scheduled_payments')
      .update({ status: newStatus })
      .eq('id', payment.id);

    if (error) {
      toast({ title: 'Error updating payment', variant: 'destructive' });
    } else {
      fetchPayments();
    }
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase
      .from('scheduled_payments')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting payment', variant: 'destructive' });
    } else {
      toast({ title: 'Payment deleted' });
      fetchPayments();
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="destructive">Cancelled</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Bill Pay & Scheduled Transfers</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPayment ? 'Edit Payment' : 'Schedule New Payment'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input 
                    placeholder="e.g., Electric Company" 
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Routing Number</Label>
                    <Input 
                      placeholder="9 digits" 
                      value={recipientRouting} 
                      onChange={(e) => setRecipientRouting(e.target.value.replace(/\D/g, '').slice(0, 9))} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input 
                      placeholder="Account #" 
                      value={recipientAccount} 
                      onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, ''))} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bank Name (Optional)</Label>
                  <Input 
                    placeholder="e.g., Chase Bank" 
                    value={recipientBank} 
                    onChange={(e) => setRecipientBank(e.target.value)} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="pl-7" 
                        min="0" 
                        step="0.01" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Next Payment Date</Label>
                  <Input 
                    type="date" 
                    value={nextPaymentDate} 
                    onChange={(e) => setNextPaymentDate(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input 
                    placeholder="e.g., Monthly electricity bill" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                </div>

                <Button type="submit" variant="accent" className="w-full" disabled={formLoading}>
                  {formLoading ? (
                    <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  ) : editingPayment ? 'Update Payment' : 'Schedule Payment'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled payments</h3>
              <p className="text-muted-foreground mb-4">Set up recurring bills and scheduled transfers</p>
              <Button variant="accent" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Payment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card variant="elevated">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{payment.recipient_name}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{payment.recipient_bank || 'Bank'} • ****{payment.recipient_account.slice(-4)}</p>
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Next: {formatDate(payment.next_payment_date)} • {FREQUENCY_OPTIONS.find(f => f.value === payment.frequency)?.label}
                          </p>
                          {payment.description && <p>{payment.description}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(payment.amount)}</p>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => togglePaymentStatus(payment)}
                            title={payment.status === 'active' ? 'Pause' : 'Resume'}
                          >
                            {payment.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(payment)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deletePayment(payment.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
