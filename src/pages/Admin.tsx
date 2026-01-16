import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdmin } from '@/hooks/useAdmin';
import { usePrivilegedUsers } from '@/hooks/usePrivilegedUsers';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAdmin2FA } from '@/hooks/useAdmin2FA';
import { useAdminIPCheck } from '@/hooks/useAdminIPCheck';
import AdminGuard from '@/components/AdminGuard';
import { Admin2FASetup } from '@/components/Admin2FASetup';
import { Admin2FAVerification } from '@/components/Admin2FAVerification';
import { AdminActivityDashboard } from '@/components/AdminActivityDashboard';
import { AdminIPWhitelist } from '@/components/AdminIPWhitelist';
import { AdminIPBlockedScreen } from '@/components/AdminIPBlockedScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Users,
  CreditCard,
  DollarSign,
  Eye,
  Edit,
  LogOut,
  Search,
  Shield,
  TrendingUp,
  Plus,
  Trash2,
  Crown,
  ClipboardList,
  RotateCcw,
  Settings,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const {
    role,
    stats,
    profiles,
    accounts,
    transactions,
    fetchAdminData,
    updateAccountBalance,
    isSuperAdmin,
  } = useAdmin();

  const {
    privilegedUsers,
    loading: privilegedLoading,
    addPrivilegedUser,
    updatePrivilegedUser,
    removePrivilegedUser,
  } = usePrivilegedUsers();

  const { logBalanceChange, logPrivilegedUserAdded, logPrivilegedUserRemoved, logPrivilegedUserUpdated } = useAuditLog();
  const { is2FAEnabled, isVerified, setIsVerified, loading: loading2FA } = useAdmin2FA();
  const { currentIP, isIPAllowed, loading: loadingIP } = useAdminIPCheck();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [newBalance, setNewBalance] = useState('');
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Privileged user management state
  const [addPrivilegedOpen, setAddPrivilegedOpen] = useState(false);
  const [deletePrivilegedOpen, setDeletePrivilegedOpen] = useState(false);
  const [selectedPrivileged, setSelectedPrivileged] = useState<any>(null);
  const [newPrivilegedEmail, setNewPrivilegedEmail] = useState('');
  const [newPrivilegedCanDeposit, setNewPrivilegedCanDeposit] = useState(true);
  const [newPrivilegedCanReversal, setNewPrivilegedCanReversal] = useState(true);
  const [newPrivilegedInstantReversal, setNewPrivilegedInstantReversal] = useState(true);

  // Check IP access first
  if (loadingIP) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If IP is not allowed, show blocked screen (skip for super admins for initial setup)
  if (isIPAllowed === false && !isSuperAdmin) {
    return <AdminIPBlockedScreen currentIP={currentIP} />;
  }

  // If 2FA is enabled but not verified this session, show verification
  if (!loading2FA && is2FAEnabled && !isVerified) {
    return <Admin2FAVerification onVerified={() => setIsVerified(true)} onCancel={() => navigate('/dashboard')} />;
  }

  useEffect(() => {
    fetchAdminData();
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) as any;
    if (data) setAuditLogs(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewUser = (profile: any) => {
    setSelectedUser(profile);
    setUserDetailsOpen(true);
  };

  const handleEditBalance = (account: any) => {
    setSelectedAccount(account);
    setNewBalance(account.balance.toString());
    setEditBalanceOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!selectedAccount) return;

    try {
      const oldBalance = Number(selectedAccount.balance);
      const newBalanceNum = parseFloat(newBalance);
      const user = getUserForAccount(selectedAccount.user_id);
      
      await updateAccountBalance(selectedAccount.id, newBalanceNum);
      await logBalanceChange(selectedAccount.id, selectedAccount.account_number, oldBalance, newBalanceNum, user?.full_name || 'Unknown');
      
      toast({ title: 'Balance updated successfully' });
      setEditBalanceOpen(false);
      fetchAuditLogs();
    } catch (error: any) {
      toast({ title: 'Error updating balance', description: error.message, variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleAddPrivilegedUser = async () => {
    if (!newPrivilegedEmail.trim()) {
      toast({ title: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    try {
      const permissions = {
        can_deposit: newPrivilegedCanDeposit,
        can_request_reversal: newPrivilegedCanReversal,
        instant_reversal: newPrivilegedInstantReversal,
      };
      await addPrivilegedUser(newPrivilegedEmail, permissions);
      await logPrivilegedUserAdded(newPrivilegedEmail, permissions);
      
      toast({ title: 'Privileged user added successfully' });
      setAddPrivilegedOpen(false);
      setNewPrivilegedEmail('');
      setNewPrivilegedCanDeposit(true);
      setNewPrivilegedCanReversal(true);
      setNewPrivilegedInstantReversal(true);
      fetchAuditLogs();
    } catch (error: any) {
      toast({ title: 'Error adding privileged user', description: error.message, variant: 'destructive' });
    }
  };

  const handleTogglePrivilegedPermission = async (
    id: string,
    email: string,
    field: 'can_deposit' | 'can_request_reversal' | 'instant_reversal',
    currentValue: boolean
  ) => {
    try {
      await updatePrivilegedUser(id, { [field]: !currentValue });
      await logPrivilegedUserUpdated(email, field, currentValue, !currentValue);
      toast({ title: 'Permission updated' });
      fetchAuditLogs();
    } catch (error: any) {
      toast({ title: 'Error updating permission', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeletePrivilegedUser = async () => {
    if (!selectedPrivileged) return;
    
    try {
      await removePrivilegedUser(selectedPrivileged.id);
      await logPrivilegedUserRemoved(selectedPrivileged.email);
      toast({ title: 'Privileged user removed' });
      setDeletePrivilegedOpen(false);
      setSelectedPrivileged(null);
      fetchAuditLogs();
    } catch (error: any) {
      toast({ title: 'Error removing privileged user', description: error.message, variant: 'destructive' });
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_number?.includes(searchTerm) ||
      profiles.find((p) => p.user_id === a.user_id)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference_number?.includes(searchTerm)
  );

  const filteredPrivilegedUsers = privilegedUsers.filter(
    (p) => p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserForAccount = (userId: string) => {
    return profiles.find((p) => p.user_id === userId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground capitalize">{role} Access</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Accounts</p>
                    <p className="text-3xl font-bold">{stats?.totalAccounts || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats?.totalBalance || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Transactions</p>
                    <p className="text-3xl font-bold">{stats?.recentTransactionsCount || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users, accounts, or transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">Users ({profiles.length})</TabsTrigger>
            <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="privileged" className="flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Privileged
              </TabsTrigger>
            )}
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1">
              <ClipboardList className="w-3 h-3" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user profiles and accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name || 'N/A'}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          {profile.is_international ? (
                            <Badge variant="secondary">{profile.country_code}</Badge>
                          ) : (
                            <Badge>US</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(profile.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(profile)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>All Accounts</CardTitle>
                <CardDescription>View and manage account balances</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => {
                      const user = getUserForAccount(account.user_id);
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono">{account.account_number}</TableCell>
                          <TableCell>{user?.full_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {account.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="capitalize">{account.tier}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(account.balance))}
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleEditBalance(account)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>View transaction history across all accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          {transaction.reference_number?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>{transaction.recipient_name || '-'}</TableCell>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transaction.amount > 0 ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(Number(transaction.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privileged Users Tab */}
          {isSuperAdmin && (
            <TabsContent value="privileged">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        Privileged Users
                      </CardTitle>
                      <CardDescription>Manage users with special deposit and reversal permissions</CardDescription>
                    </div>
                    <Button onClick={() => setAddPrivilegedOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {privilegedLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : filteredPrivilegedUsers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No privileged users found.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-center">Can Deposit</TableHead>
                          <TableHead className="text-center">Can Request Reversal</TableHead>
                          <TableHead className="text-center">Instant Reversal</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPrivilegedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={user.can_deposit}
                                onCheckedChange={() => handleTogglePrivilegedPermission(user.id, user.email, 'can_deposit', user.can_deposit)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={user.can_request_reversal}
                                onCheckedChange={() => handleTogglePrivilegedPermission(user.id, user.email, 'can_request_reversal', user.can_request_reversal)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={user.instant_reversal}
                                onCheckedChange={() => handleTogglePrivilegedPermission(user.id, user.email, 'instant_reversal', user.instant_reversal)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedPrivileged(user);
                                  setDeletePrivilegedOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate('/admin/reversals')}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  View Reversal History
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Activity Dashboard Tab */}
          <TabsContent value="activity">
            <AdminActivityDashboard />
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Admin Activity Log
                </CardTitle>
                <CardDescription>Track all administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No audit logs yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">{log.action_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[400px]">{log.description}</TableCell>
                          <TableCell className="text-sm">{formatDate(log.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Admin2FASetup />
              {isSuperAdmin && <AdminIPWhitelist />}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Built by <span className="font-semibold text-primary">Bluephes Technology</span>
        </div>
      </div>

      {/* Edit Balance Dialog */}
      <Dialog open={editBalanceOpen} onOpenChange={setEditBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account Number</Label>
              <p className="font-mono text-sm">{selectedAccount?.account_number}</p>
            </div>
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-lg font-bold">{formatCurrency(Number(selectedAccount?.balance || 0))}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newBalance">New Balance</Label>
              <Input
                id="newBalance"
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBalanceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBalance}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{selectedUser.country_code || 'US'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-mono text-xs">{selectedUser.user_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Accounts</Label>
                <div className="space-y-2">
                  {accounts
                    .filter((a) => a.user_id === selectedUser.user_id)
                    .map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-mono text-sm">{account.account_number}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {account.category} • {account.tier}
                          </p>
                        </div>
                        <p className="font-bold">{formatCurrency(Number(account.balance))}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Privileged User Dialog */}
      <Dialog open={addPrivilegedOpen} onOpenChange={setAddPrivilegedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Add Privileged User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="privilegedEmail">Email Address</Label>
              <Input
                id="privilegedEmail"
                type="email"
                placeholder="user@example.com"
                value={newPrivilegedEmail}
                onChange={(e) => setNewPrivilegedEmail(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Can Deposit</p>
                  <p className="text-sm text-muted-foreground">Allow making deposits</p>
                </div>
                <Switch
                  checked={newPrivilegedCanDeposit}
                  onCheckedChange={setNewPrivilegedCanDeposit}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Can Request Reversal</p>
                  <p className="text-sm text-muted-foreground">Allow requesting payment reversals</p>
                </div>
                <Switch
                  checked={newPrivilegedCanReversal}
                  onCheckedChange={setNewPrivilegedCanReversal}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Instant Reversal</p>
                  <p className="text-sm text-muted-foreground">Process reversals immediately</p>
                </div>
                <Switch
                  checked={newPrivilegedInstantReversal}
                  onCheckedChange={setNewPrivilegedInstantReversal}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPrivilegedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPrivilegedUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Privileged User Confirmation */}
      <AlertDialog open={deletePrivilegedOpen} onOpenChange={setDeletePrivilegedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Privileged User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{selectedPrivileged?.email}</strong> from privileged users?
              <br /><br />
              This user will no longer be able to make deposits or request payment reversals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrivilegedUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
