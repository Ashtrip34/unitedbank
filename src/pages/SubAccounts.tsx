import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBanking } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Wallet, Users, PiggyBank, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function SubAccounts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account } = useBanking();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subAccountName, setSubAccountName] = useState('');
  const [hasOwnLogin, setHasOwnLogin] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subPassword, setSubPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch sub-accounts
  const { data: subAccounts, isLoading } = useQuery({
    queryKey: ['sub-accounts', user?.id],
    queryFn: async () => {
      if (!account) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('parent_account_id', account.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!account,
  });

  const handleCreateSubAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;

    setIsCreating(true);

    try {
      // Generate unique account number
      const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

      if (hasOwnLogin) {
        // Create a new user for the sub-account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: subEmail,
          password: subPassword,
          options: {
            data: {
              full_name: subAccountName,
              is_sub_account: true,
              parent_user_id: user.id,
            },
          },
        });

        if (authError) throw authError;

        // Wait for trigger to create account, then update it
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (authData.user) {
          await supabase
            .from('accounts')
            .update({
              parent_account_id: account.id,
              is_sub_account: true,
              sub_account_name: subAccountName,
              sub_account_has_login: true,
            })
            .eq('user_id', authData.user.id);
        }
      } else {
        // Create sub-account without separate login
        const { error } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            account_number: newAccountNumber,
            balance: 0,
            parent_account_id: account.id,
            is_sub_account: true,
            sub_account_name: subAccountName,
            sub_account_has_login: false,
            tier: account.tier,
            category: account.category,
          });

        if (error) throw error;
      }

      toast({
        title: "Sub-account created!",
        description: `${subAccountName} account has been created successfully.`,
      });

      setDialogOpen(false);
      setSubAccountName('');
      setSubEmail('');
      setSubPassword('');
      setHasOwnLogin(false);
      queryClient.invalidateQueries({ queryKey: ['sub-accounts'] });
    } catch (error: any) {
      console.error('Error creating sub-account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sub-account",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Sub-Accounts</h1>
              <p className="text-sm text-muted-foreground">Manage savings & family accounts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Create New Sub-Account */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground">Create Sub-Account</p>
                    <p className="text-sm text-muted-foreground mt-1">For savings, kids, or specific goals</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sub-Account</DialogTitle>
              <DialogDescription>
                Create a new account for savings, your child, or a specific goal.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubAccount} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subAccountName">Account Name</Label>
                <Input
                  id="subAccountName"
                  placeholder="e.g., Savings, Kids Account"
                  value={subAccountName}
                  onChange={(e) => setSubAccountName(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Separate Login</p>
                  <p className="text-sm text-muted-foreground">Allow this account to have its own login credentials</p>
                </div>
                <Switch
                  checked={hasOwnLogin}
                  onCheckedChange={setHasOwnLogin}
                />
              </div>

              {hasOwnLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="subEmail">Email for Sub-Account</Label>
                    <Input
                      id="subEmail"
                      type="email"
                      placeholder="child@example.com"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      required={hasOwnLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="subPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={subPassword}
                        onChange={(e) => setSubPassword(e.target.value)}
                        required={hasOwnLogin}
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  'Create Sub-Account'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Existing Sub-Accounts */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subAccounts && subAccounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {subAccounts.map((subAccount, index) => (
              <motion.div
                key={subAccount.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {subAccount.sub_account_name?.toLowerCase().includes('saving') ? (
                            <PiggyBank className="w-5 h-5 text-primary" />
                          ) : subAccount.sub_account_name?.toLowerCase().includes('kid') ? (
                            <Users className="w-5 h-5 text-primary" />
                          ) : (
                            <Wallet className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{subAccount.sub_account_name || 'Sub Account'}</CardTitle>
                          <CardDescription>****{subAccount.account_number.slice(-4)}</CardDescription>
                        </div>
                      </div>
                      {subAccount.sub_account_has_login && (
                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                          Has Login
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(subAccount.balance)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Available Balance</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Sub-Accounts Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Create sub-accounts for savings goals, family members, or specific purposes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <PiggyBank className="w-6 h-6 text-primary" />
                <CardTitle className="text-lg">Savings Goals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create dedicated savings accounts for vacations, emergencies, or major purchases.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-accent" />
                <CardTitle className="text-lg">Family Accounts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up accounts for your children with optional separate login access.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
