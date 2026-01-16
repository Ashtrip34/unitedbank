import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBanking } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, History, LogOut, Copy, Eye, EyeOff, PieChart, Calendar, Globe, FileText, Bell, TrendingUp, Users, Briefcase, Receipt, Shield, Gauge } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import unitedBankLogo from '@/assets/united-bank-logo.png';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { account, transactions, profile, loading, getTierTransferLimit, privilegedUser } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);

  const transferLimit = getTierTransferLimit();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero text-primary-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={unitedBankLogo} alt="United Bank" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold">United Bank</span>
            </div>
            <Button variant="glass" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="container pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-primary-foreground/70 mb-1">Welcome back, {profile?.full_name || 'User'}</p>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                {showBalance ? formatCurrencyFull(Number(account?.balance || 0)) : '••••••'}
              </h1>
              <button onClick={() => setShowBalance(!showBalance)} className="text-primary-foreground/70 hover:text-primary-foreground">
                {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <span>Account:</span>
                <span className="font-mono">{account?.account_number}</span>
                <button onClick={() => copyToClipboard(account?.account_number || '', 'Account number')}>
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>Routing:</span>
                <span className="font-mono">{account?.routing_number}</span>
                <button onClick={() => copyToClipboard(account?.routing_number || '', 'Routing number')}>
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Transfer Limit Display */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Gauge className="w-4 h-4 text-primary-foreground/70" />
              <span className="text-primary-foreground/70">Transfer Limit:</span>
              <span className="font-semibold text-primary-foreground">{formatCurrency(transferLimit)}</span>
              <span className="text-primary-foreground/50">per transaction</span>
            </div>

            {/* Privileged Account Badge */}
            {privilegedUser && (
              <div className="mt-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">Privileged Account</span>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="container -mt-4">
        <div className="grid grid-cols-4 gap-3 mb-3">
          <Button variant="default" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/deposit')}>
            <ArrowDownLeft className="w-5 h-5" />
            <span className="text-xs">Deposit</span>
          </Button>
          <Button variant="accent" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/transfer')}>
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-xs">Transfer</span>
          </Button>
          <Button variant="secondary" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/history')}>
            <History className="w-5 h-5" />
            <span className="text-xs">History</span>
          </Button>
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/expenses')}>
            <PieChart className="w-5 h-5" />
            <span className="text-xs">Expenses</span>
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/bill-pay')}>
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Bill Pay</span>
          </Button>
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/international')}>
            <Globe className="w-5 h-5" />
            <span className="text-xs">International</span>
          </Button>
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/statements')}>
            <FileText className="w-5 h-5" />
            <span className="text-xs">Statements</span>
          </Button>
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/notifications')}>
            <Bell className="w-5 h-5" />
            <span className="text-xs">Alerts</span>
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/credit-score')}>
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Credit</span>
          </Button>
          <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/sub-accounts')}>
            <Users className="w-5 h-5" />
            <span className="text-xs">Sub-Accts</span>
          </Button>
          {account?.category === 'business' && (
            <>
              <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/team')}>
                <Briefcase className="w-5 h-5" />
                <span className="text-xs">Team</span>
              </Button>
              <Button variant="outline" size="lg" className="flex-col h-auto py-4 gap-2" onClick={() => navigate('/invoicing')}>
                <Receipt className="w-5 h-5" />
                <span className="text-xs">Invoices</span>
              </Button>
            </>
          )}
        </div>

        {/* Account Tier Badge */}
        {account?.tier && (
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              account.tier === 'enterprise' ? 'bg-yellow-500/20 text-yellow-700' :
              account.tier === 'pro' ? 'bg-purple-500/20 text-purple-700' :
              account.tier === 'plus' ? 'bg-blue-500/20 text-blue-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {account.tier.charAt(0).toUpperCase() + account.tier.slice(1)} Account
            </span>
            {account.category === 'business' && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-accent/20 text-accent flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                Business
              </span>
            )}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="container py-8">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activity</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet. Make a deposit to get started!</p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrencyFull(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
