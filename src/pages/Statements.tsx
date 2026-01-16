import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBanking } from '@/hooks/useBanking';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileText, Download, Calendar, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export default function Statements() {
  const { user } = useAuth();
  const { account, transactions, profile } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();
  const statementRef = useRef<HTMLDivElement>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 3 }, (_, i) => (new Date().getFullYear() - i).toString());

  const getFilteredTransactions = () => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });
  };

  const filteredTransactions = getFilteredTransactions();
  
  const totalDeposits = filteredTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalWithdrawals = filteredTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleDownload = async () => {
    if (!statementRef.current) return;
    
    setGenerating(true);
    
    try {
      const canvas = await html2canvas(statementRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${months[parseInt(selectedMonth)]}-${selectedYear}.png`;
      a.click();
      
      toast({ title: 'Statement downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error generating statement', variant: 'destructive' });
    }
    
    setGenerating(false);
  };

  const generateStatement = () => {
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Account Statements</h1>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Generate Statement</CardTitle>
            <CardDescription>Download your account activity for any month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, i) => (
                      <SelectItem key={i} value={i.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="accent" onClick={generateStatement}>
                <Calendar className="w-4 h-4 mr-2" />
                Generate Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        {showPreview && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Statement Preview</h2>
              <Button variant="accent" onClick={handleDownload} disabled={generating}>
                {generating ? (
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
            </div>
            
            <div ref={statementRef} className="bg-white p-8 rounded-lg shadow-lg text-gray-900">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">United Bank</h1>
                    <p className="text-sm text-gray-500">Member FDIC</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">Account Statement</p>
                  <p className="text-gray-500">{months[parseInt(selectedMonth)]} {selectedYear}</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Account Holder</h3>
                  <p className="font-semibold">{profile?.full_name || 'Account Holder'}</p>
                  <p className="text-sm text-gray-600">{profile?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Account Details</h3>
                  <p className="font-semibold">****{account?.account_number.slice(-4)}</p>
                  <p className="text-sm text-gray-600">Routing: {account?.routing_number}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Opening Balance</p>
                  <p className="text-xl font-bold">{formatCurrency(Number(account?.balance || 0) + totalWithdrawals - totalDeposits)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deposits</p>
                  <p className="text-xl font-bold text-green-600">+{formatCurrency(totalDeposits)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Withdrawals</p>
                  <p className="text-xl font-bold text-red-600">-{formatCurrency(totalWithdrawals)}</p>
                </div>
              </div>

              {/* Transactions */}
              <div>
                <h3 className="font-semibold mb-4">Transaction History</h3>
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions for this period</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Type</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-100">
                          <td className="py-3 text-sm">{formatDate(tx.created_at)}</td>
                          <td className="py-3 text-sm">{tx.description || tx.type}</td>
                          <td className="py-3 text-sm capitalize">{tx.type}</td>
                          <td className={`py-3 text-sm text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
                  This statement is generated electronically and is valid without signature.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  United Bank • FDIC Insured • Equal Housing Lender
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
