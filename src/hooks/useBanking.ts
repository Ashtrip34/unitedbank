import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  tier?: 'free' | 'plus' | 'pro' | 'enterprise';
  category?: 'personal' | 'business';
  parent_account_id?: string | null;
  is_sub_account?: boolean;
  sub_account_name?: string | null;
  sub_account_has_login?: boolean;
  transfer_limit?: number;
  secondary_balance?: number | null;
  secondary_currency?: string | null;
}

export interface PrivilegedUser {
  id: string;
  email: string;
  can_deposit: boolean;
  can_request_reversal: boolean;
  instant_reversal: boolean;
}

export interface Transaction {
  id: string;
  account_id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  recipient_name: string | null;
  recipient_account: string | null;
  recipient_routing: string | null;
  recipient_bank: string | null;
  status: string;
  reference_number: string;
  category: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  country_code?: string | null;
  is_international?: boolean;
}

const sendEmailNotification = async (data: {
  type: 'sent' | 'received' | 'deposit' | 'reversal';
  email: string;
  name: string;
  amount: number;
  recipientName?: string;
  senderName?: string;
  description?: string;
  accountNumber?: string;
  referenceNumber?: string;
  originalTransaction?: string;
}) => {
  try {
    const response = await supabase.functions.invoke('send-transfer-notification', {
      body: data,
    });
    console.log('Email notification sent:', response);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
};

export function useBanking() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [privilegedUser, setPrivilegedUser] = useState<PrivilegedUser | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToTransactions();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch main account (not sub-accounts)
    const { data: accountData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .or('is_sub_account.is.null,is_sub_account.eq.false')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (accountData) {
      setAccount(accountData as Account);
      
      // Fetch transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountData.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (txData) {
        setTransactions(txData as Transaction[]);
      }
    }
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData as Profile);
      
      // Check if user is privileged
      if (profileData.email) {
        const { data: privilegedData } = await supabase
          .from('privileged_users')
          .select('*')
          .eq('email', profileData.email)
          .single();
        
        if (privilegedData) {
          setPrivilegedUser(privilegedData as PrivilegedUser);
        } else {
          setPrivilegedUser(null);
        }
      }
    }
    
    setLoading(false);
  };

  const subscribeToTransactions = () => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const deposit = async (amount: number, description: string) => {
    if (!user || !account || !profile) return { error: new Error('No account found') };

    // Check if user is privileged for deposits
    if (!privilegedUser?.can_deposit) {
      return { error: new Error('Unable to add money') };
    }

    // Update balance
    const newBalance = Number(account.balance) + amount;
    
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', account.id);

    if (updateError) return { error: updateError };

    // Create transaction
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        account_id: account.id,
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        description: description || 'Deposit',
        status: 'completed',
      })
      .select()
      .single();

    if (txError) return { error: txError };

    // Send email notification for deposit
    if (profile.email) {
      sendEmailNotification({
        type: 'deposit',
        email: profile.email,
        name: profile.full_name || 'Valued Customer',
        amount: amount,
        description: description || 'Deposit',
        accountNumber: account.account_number,
        referenceNumber: txData?.reference_number,
      });
    }

    await fetchData();
    return { error: null };
  };

  const requestReversal = async (transactionId: string) => {
    if (!user || !account || !profile) return { error: new Error('No account found') };

    // Check if user is privileged for reversals
    if (!privilegedUser?.can_request_reversal) {
      return { error: new Error('Only authorized accounts can request payment reversals') };
    }

    // Get the original transaction details first
    const { data: originalTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    // Call the process_reversal function for instant reversal
    const { data, error } = await supabase.rpc('process_reversal', {
      p_transaction_id: transactionId,
      p_user_id: user.id,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    const result = data as { success: boolean; error?: string; message?: string; new_balance?: number };

    if (!result.success) {
      return { error: new Error(result.error || 'Reversal failed') };
    }

    // Send email notification for reversal
    if (profile.email) {
      sendEmailNotification({
        type: 'reversal',
        email: profile.email,
        name: profile.full_name || 'Valued Customer',
        amount: Math.abs(originalTx?.amount || 0),
        description: 'Payment Reversal Processed',
        accountNumber: account.account_number,
        originalTransaction: originalTx?.description || 'Transfer',
      });
    }

    await fetchData();
    return { error: null, message: result.message };
  };

  const getTierTransferLimit = () => {
    // All accounts now have a 2 million limit
    return 2000000;
  };

  const transfer = async (
    amount: number,
    recipientName: string,
    recipientAccount: string,
    recipientRouting: string,
    recipientBank: string,
    description: string
  ) => {
    if (!user || !account || !profile) return { error: new Error('No account found') };

    if (Number(account.balance) < amount) {
      return { error: new Error('Insufficient funds') };
    }

    if (amount > 2000000) {
      return { error: new Error('Transfer limit is $2,000,000 per transaction') };
    }

    // Calculate 1.5% transaction fee
    const feeAmount = amount * 0.015;
    const netAmount = amount - feeAmount;

    // Update balance
    const newBalance = Number(account.balance) - amount;
    
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', account.id);

    if (updateError) return { error: updateError };

    // Create transaction (10% fee is deducted, recipient receives net amount)
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        account_id: account.id,
        user_id: user.id,
        type: 'transfer',
        amount: -amount,
        description: (description || `Transfer to ${recipientName}`) + ` (Fee: $${feeAmount.toFixed(2)})`,
        recipient_name: recipientName,
        recipient_account: recipientAccount,
        recipient_routing: recipientRouting,
        recipient_bank: recipientBank,
        status: 'completed',
      })
      .select()
      .single();

    if (txError) return { error: txError };

    // Send email notification for outgoing transfer
    if (profile.email) {
      sendEmailNotification({
        type: 'sent',
        email: profile.email,
        name: profile.full_name || 'Valued Customer',
        amount: amount,
        recipientName: recipientName,
        description: description,
        accountNumber: account.account_number,
        referenceNumber: txData?.reference_number,
      });
    }

    await fetchData();
    return { error: null };
  };

  const internalTransfer = async (
    amount: number,
    recipientAccountNumber: string,
    description: string,
    verifyOnly: boolean = false
  ): Promise<{ error: Error | null; recipientName?: string }> => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    // Call the database function for internal transfer
    const { data, error } = await supabase.rpc('internal_transfer', {
      sender_user_id: user.id,
      recipient_account_number: recipientAccountNumber,
      transfer_amount: verifyOnly ? 0 : amount,
      transfer_description: description || null,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    const result = data as { success: boolean; error?: string; recipient_name?: string; message?: string };

    if (!result.success) {
      // For verify-only calls, "Cannot transfer to your own account" means account was found
      if (verifyOnly && result.error === 'Cannot transfer to your own account') {
        return { error: new Error('Cannot transfer to your own account') };
      }
      return { error: new Error(result.error || 'Transfer failed') };
    }

    if (!verifyOnly && profile.email && account) {
      // Send email notification to sender
      sendEmailNotification({
        type: 'sent',
        email: profile.email,
        name: profile.full_name || 'Valued Customer',
        amount: amount,
        recipientName: result.recipient_name,
        description: description,
        accountNumber: account.account_number,
      });

      // Get recipient's email and send notification
      const { data: recipientAccountData } = await supabase
        .from('accounts')
        .select('user_id, account_number')
        .eq('account_number', recipientAccountNumber)
        .single();

      if (recipientAccountData) {
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', recipientAccountData.user_id)
          .single();

        if (recipientProfile?.email) {
          sendEmailNotification({
            type: 'received',
            email: recipientProfile.email,
            name: recipientProfile.full_name || 'Valued Customer',
            amount: amount,
            senderName: profile.full_name || 'United Bank User',
            description: description || 'Internal transfer received',
            accountNumber: recipientAccountData.account_number,
          });
        }
      }

      await fetchData();
    }

    return { error: null, recipientName: result.recipient_name };
  };

  return {
    account,
    transactions,
    profile,
    loading,
    deposit,
    transfer,
    internalTransfer,
    requestReversal,
    getTierTransferLimit,
    privilegedUser,
    refetch: fetchData,
  };
}
