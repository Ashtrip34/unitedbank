import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'super_admin' | 'admin' | 'viewer';

interface AdminUser {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalAccounts: number;
  totalBalance: number;
  totalTransactions: number;
  recentTransactionsCount: number;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setRole(null);
      } else if (data) {
        setIsAdmin(true);
        setRole(data.role as AppRole);
      } else {
        setIsAdmin(false);
        setRole(null);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!isAdmin) return;

    try {
      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (profilesData) setProfiles(profilesData);
      if (accountsData) setAccounts(accountsData);
      if (transactionsData) setTransactions(transactionsData);

      // Calculate stats
      const totalBalance = accountsData?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recentTransactions = transactionsData?.filter(
        t => new Date(t.created_at) >= today
      ).length || 0;

      setStats({
        totalUsers: profilesData?.length || 0,
        totalAccounts: accountsData?.length || 0,
        totalBalance,
        totalTransactions: transactionsData?.length || 0,
        recentTransactionsCount: recentTransactions,
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const updateAccountBalance = async (accountId: string, newBalance: number) => {
    if (role !== 'super_admin') {
      throw new Error('Only super admins can modify balances');
    }

    const { error } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (error) throw error;

    // Refresh data
    await fetchAdminData();
  };

  const addAdminUser = async (userId: string, adminRole: AppRole) => {
    if (role !== 'super_admin') {
      throw new Error('Only super admins can add admin users');
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: adminRole });

    if (error) throw error;
  };

  const removeAdminUser = async (userId: string) => {
    if (role !== 'super_admin') {
      throw new Error('Only super admins can remove admin users');
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  };

  return {
    isAdmin,
    role,
    loading,
    stats,
    profiles,
    accounts,
    transactions,
    fetchAdminData,
    updateAccountBalance,
    addAdminUser,
    removeAdminUser,
    isSuperAdmin: role === 'super_admin',
  };
}
