import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PrivilegedUser {
  id: string;
  email: string;
  can_deposit: boolean;
  can_request_reversal: boolean;
  instant_reversal: boolean;
  created_at: string;
}

export function usePrivilegedUsers() {
  const [privilegedUsers, setPrivilegedUsers] = useState<PrivilegedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrivilegedUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('privileged_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPrivilegedUsers(data as PrivilegedUser[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrivilegedUsers();
  }, []);

  const addPrivilegedUser = async (email: string, permissions: {
    can_deposit: boolean;
    can_request_reversal: boolean;
    instant_reversal: boolean;
  }) => {
    const { error } = await supabase
      .from('privileged_users')
      .insert({
        email: email.toLowerCase().trim(),
        ...permissions,
      });

    if (error) {
      throw new Error(error.message);
    }

    await fetchPrivilegedUsers();
  };

  const updatePrivilegedUser = async (id: string, updates: {
    can_deposit?: boolean;
    can_request_reversal?: boolean;
    instant_reversal?: boolean;
  }) => {
    const { error } = await supabase
      .from('privileged_users')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    await fetchPrivilegedUsers();
  };

  const removePrivilegedUser = async (id: string) => {
    const { error } = await supabase
      .from('privileged_users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    await fetchPrivilegedUsers();
  };

  return {
    privilegedUsers,
    loading,
    addPrivilegedUser,
    updatePrivilegedUser,
    removePrivilegedUser,
    refetch: fetchPrivilegedUsers,
  };
}