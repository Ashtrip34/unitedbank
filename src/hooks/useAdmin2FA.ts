import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as OTPAuth from 'otpauth';

interface Admin2FA {
  id: string;
  user_id: string;
  secret_key: string;
  is_enabled: boolean;
  backup_codes: string[] | null;
  verified_at: string | null;
  created_at: string;
}

export function useAdmin2FA() {
  const { user } = useAuth();
  const [twoFAData, setTwoFAData] = useState<Admin2FA | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user) {
      fetch2FAStatus();
    }
  }, [user]);

  const fetch2FAStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('admin_2fa')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching 2FA status:', error);
      } else {
        setTwoFAData(data);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  };

  const generateTOTP = (secret: string): OTPAuth.TOTP => {
    return new OTPAuth.TOTP({
      issuer: 'United Bank Admin',
      label: user?.email || 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const setup2FA = async (): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> => {
    if (!user) throw new Error('User not authenticated');

    const secret = generateSecret();
    const totp = generateTOTP(secret);
    const qrCodeUrl = totp.toString();
    const backupCodes = generateBackupCodes();

    // Store the secret (not yet enabled)
    const { error } = await supabase
      .from('admin_2fa')
      .upsert({
        user_id: user.id,
        secret_key: secret,
        is_enabled: false,
        backup_codes: backupCodes,
      });

    if (error) throw error;

    await fetch2FAStatus();
    return { secret, qrCodeUrl, backupCodes };
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    if (!user || !twoFAData) return false;

    const totp = generateTOTP(twoFAData.secret_key);
    const isValid = totp.validate({ token: code, window: 1 }) !== null;

    if (isValid) {
      const { error } = await supabase
        .from('admin_2fa')
        .update({
          is_enabled: true,
          verified_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      await fetch2FAStatus();
    }

    return isValid;
  };

  const validateCode = async (code: string): Promise<boolean> => {
    if (!twoFAData) return false;

    // Check TOTP
    const totp = generateTOTP(twoFAData.secret_key);
    if (totp.validate({ token: code, window: 1 }) !== null) {
      setIsVerified(true);
      return true;
    }

    // Check backup codes
    if (twoFAData.backup_codes?.includes(code.toUpperCase())) {
      // Remove used backup code
      const newBackupCodes = twoFAData.backup_codes.filter(c => c !== code.toUpperCase());
      await supabase
        .from('admin_2fa')
        .update({ backup_codes: newBackupCodes })
        .eq('user_id', user?.id);
      
      setIsVerified(true);
      await fetch2FAStatus();
      return true;
    }

    return false;
  };

  const disable2FA = async (code: string): Promise<boolean> => {
    if (!user || !twoFAData) return false;

    const isValid = await validateCode(code);
    if (!isValid) return false;

    const { error } = await supabase
      .from('admin_2fa')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    setTwoFAData(null);
    setIsVerified(false);
    return true;
  };

  return {
    twoFAData,
    loading,
    isVerified,
    setIsVerified,
    is2FAEnabled: twoFAData?.is_enabled ?? false,
    setup2FA,
    verify2FA,
    validateCode,
    disable2FA,
    refetch: fetch2FAStatus,
  };
}
