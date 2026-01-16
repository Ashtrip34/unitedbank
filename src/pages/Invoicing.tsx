import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBanking } from '@/hooks/useBanking';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Plus, Send, Eye, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  due_date: string;
  status: string | null;
  items: InvoiceItem[];
  notes: string | null;
  created_at: string | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

const invoiceSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email('Please enter a valid email'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    rate: z.number().min(0, 'Rate must be positive'),
  })).min(1, 'At least one item is required'),
});

export default function Invoicing() {
  const { user } = useAuth();
  const { account } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) navigate('/auth');
    else fetchInvoices();
  }, [user, account]);

  const fetchInvoices = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
    } else {
      // Cast the items field properly since it comes as Json from Supabase
      const typedInvoices = (data || []).map(inv => ({
        ...inv,
        items: (inv.items as unknown as InvoiceItem[]) || [],
      }));
      setInvoices(typedInvoices);
    }
    setLoading(false);
  };

  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const validateForm = () => {
    try {
      invoiceSchema.parse({ 
        clientName, 
        clientEmail, 
        dueDate,
        items: items.filter(i => i.description.trim() !== ''),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path.join('.')] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !account || !user) return;

    setCreating(true);
    
    const validItems = items.filter(i => i.description.trim() !== '');
    const total = calculateTotal();

    const { error } = await supabase
      .from('invoices')
      .insert([{
        user_id: user.id,
        account_id: account.id,
        invoice_number: generateInvoiceNumber(),
        client_name: clientName,
        client_email: clientEmail,
        amount: total,
        due_date: dueDate,
        items: validItems as unknown as any,
        notes: notes || null,
        status: 'draft',
      }]);

    setCreating(false);

    if (error) {
      toast({
        title: 'Failed to create invoice',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Invoice created!',
        description: `Invoice for ${clientName} has been created.`,
      });
      resetForm();
      fetchInvoices();
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setDueDate('');
    setNotes('');
    setItems([{ description: '', quantity: 1, rate: 0 }]);
    setShowCreateForm(false);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Invoice sent!' });
      fetchInvoices();
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Invoice marked as paid!' });
      fetchInvoices();
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Invoice deleted' });
      fetchInvoices();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  if (account?.category !== 'business') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Invoicing</h1>
          </div>
        </header>
        <div className="container py-16 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Business Feature</h2>
          <p className="text-muted-foreground mb-6">
            Invoicing is only available for business accounts.
          </p>
          <Button variant="accent" onClick={() => navigate('/business-signup')}>
            Upgrade to Business
          </Button>
        </div>
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
          <h1 className="text-xl font-semibold">Invoicing</h1>
        </div>
      </header>

      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Create Invoice Card */}
          <Card variant="elevated" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Invoice
                  </CardTitle>
                  <CardDescription>
                    Create and send professional invoices to your clients
                  </CardDescription>
                </div>
                {!showCreateForm && (
                  <Button variant="accent" onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {showCreateForm && (
              <CardContent>
                <form onSubmit={handleCreateInvoice} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        placeholder="Acme Corp"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        error={!!errors.clientName}
                      />
                      {errors.clientName && (
                        <p className="text-sm text-destructive">{errors.clientName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Client Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        placeholder="client@company.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        error={!!errors.clientEmail}
                      />
                      {errors.clientEmail && (
                        <p className="text-sm text-destructive">{errors.clientEmail}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      error={!!errors.dueDate}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-destructive">{errors.dueDate}</p>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    <Label>Line Items</Label>
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="1"
                        />
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                        <span className="w-24 py-2 text-right font-medium">
                          {formatCurrency(item.quantity * item.rate)}
                        </span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="flex justify-end py-3 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{formatCurrency(calculateTotal())}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Payment terms, thank you message, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="accent" disabled={creating}>
                      {creating ? (
                        <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      ) : (
                        'Create Invoice'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Invoices List */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No invoices yet. Create your first invoice to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.client_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.invoice_number} • Due {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getStatusBadgeVariant(invoice.status)}>
                              {invoice.status || 'draft'}
                            </Badge>
                            <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice.id)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        )}
                        {invoice.status === 'sent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkPaid(invoice.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
