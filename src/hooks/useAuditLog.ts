import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  action_type: string;
  target_table: string;
  target_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  description: string;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action_type: entry.action_type,
          target_table: entry.target_table,
          target_id: entry.target_id,
          old_value: entry.old_value as any,
          new_value: entry.new_value as any,
          description: entry.description,
        } as any);

      if (error) {
        console.error('Error logging audit action:', error);
      }
    } catch (err) {
      console.error('Error logging audit action:', err);
    }
  };

  const logBalanceChange = async (
    accountId: string,
    accountNumber: string,
    oldBalance: number,
    newBalance: number,
    ownerName: string
  ) => {
    await logAction({
      action_type: 'balance_update',
      target_table: 'accounts',
      target_id: accountId,
      old_value: { balance: oldBalance },
      new_value: { balance: newBalance },
      description: `Updated balance for account ${accountNumber} (${ownerName}) from $${oldBalance.toFixed(2)} to $${newBalance.toFixed(2)}`,
    });
  };

  const logPrivilegedUserAdded = async (email: string, permissions: Record<string, boolean>) => {
    await logAction({
      action_type: 'privileged_user_added',
      target_table: 'privileged_users',
      new_value: { email, ...permissions },
      description: `Added privileged user: ${email}`,
    });
  };

  const logPrivilegedUserRemoved = async (email: string) => {
    await logAction({
      action_type: 'privileged_user_removed',
      target_table: 'privileged_users',
      old_value: { email },
      description: `Removed privileged user: ${email}`,
    });
  };

  const logPrivilegedUserUpdated = async (
    email: string,
    field: string,
    oldValue: boolean,
    newValue: boolean
  ) => {
    await logAction({
      action_type: 'privileged_user_updated',
      target_table: 'privileged_users',
      old_value: { [field]: oldValue },
      new_value: { [field]: newValue },
      description: `Updated ${field} for privileged user ${email}: ${oldValue} → ${newValue}`,
    });
  };

  return {
    logAction,
    logBalanceChange,
    logPrivilegedUserAdded,
    logPrivilegedUserRemoved,
    logPrivilegedUserUpdated,
  };
}
