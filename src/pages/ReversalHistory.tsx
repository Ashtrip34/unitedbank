import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import AdminGuard from '@/components/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Search, RotateCcw, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ReversalRequest {
  id: string;
  transaction_id: string;
  user_id: string;
  account_id: string;
  amount: number;
  reason: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

function ReversalHistoryDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [reversals, setReversals] = useState<ReversalRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchReversals();
    }
  }, [isAdmin]);

  const fetchReversals = async () => {
    try {
      const { data: reversalData, error: reversalError } = await supabase
        .from('reversal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reversalError) throw reversalError;
      setReversals(reversalData || []);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profileError) throw profileError;
      setProfiles(profileData || []);
    } catch (err) {
      console.error('Error fetching reversals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserForReversal = (userId: string) => {
    return profiles.find((p) => p.user_id === userId);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReversals = reversals.filter((r) => {
    const user = getUserForReversal(r.user_id);
    return (
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.transaction_id.includes(searchTerm) ||
      r.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalReversed = reversals
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Reversal History</h1>
                <p className="text-sm text-muted-foreground">All payment reversals</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Reversals</p>
                <p className="text-3xl font-bold">{reversals.length}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">
                  {reversals.filter((r) => r.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Amount Reversed</p>
                <p className="text-3xl font-bold">{formatCurrency(totalReversed)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, transaction ID, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Reversals Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reversals</CardTitle>
            <CardDescription>Complete history of payment reversals</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : filteredReversals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reversals found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReversals.map((reversal) => {
                    const user = getUserForReversal(reversal.user_id);
                    return (
                      <TableRow key={reversal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {reversal.transaction_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium text-success">
                          +{formatCurrency(Number(reversal.amount))}
                        </TableCell>
                        <TableCell>{getStatusBadge(reversal.status)}</TableCell>
                        <TableCell className="text-sm">{formatDate(reversal.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {reversal.processed_at ? formatDate(reversal.processed_at) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReversalHistory() {
  return (
    <AdminGuard>
      <ReversalHistoryDashboard />
    </AdminGuard>
  );
}
