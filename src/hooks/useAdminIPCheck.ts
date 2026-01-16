import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IPWhitelist {
  id: string;
  ip_address: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function useAdminIPCheck() {
  const [currentIP, setCurrentIP] = useState<string | null>(null);
  const [isIPAllowed, setIsIPAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [whitelist, setWhitelist] = useState<IPWhitelist[]>([]);

  useEffect(() => {
    checkIPAccess();
  }, []);

  const checkIPAccess = async () => {
    setLoading(true);
    try {
      // Fetch current IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip = ipData.ip;
      setCurrentIP(ip);

      // Fetch whitelist
      const { data: whitelistData } = await supabase
        .from('admin_ip_whitelist')
        .select('*')
        .eq('is_active', true) as { data: IPWhitelist[] | null };

      if (whitelistData) {
        setWhitelist(whitelistData);
        
        // Check if IP is allowed
        const allowed = whitelistData.some(entry => {
          if (entry.ip_address === '0.0.0.0/0') return true; // Allow all
          if (entry.ip_address.includes('/')) {
            // CIDR notation - basic check
            return isIPInRange(ip, entry.ip_address);
          }
          return entry.ip_address === ip;
        });
        
        setIsIPAllowed(allowed);
      } else {
        // If no whitelist, allow by default
        setIsIPAllowed(true);
      }
    } catch (error) {
      console.error('Error checking IP:', error);
      // On error, allow access but log it
      setIsIPAllowed(true);
    }
    setLoading(false);
  };

  const isIPInRange = (ip: string, cidr: string): boolean => {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~((1 << (32 - parseInt(bits))) - 1);
      
      const ipToInt = (ipStr: string) => {
        const parts = ipStr.split('.');
        return (parseInt(parts[0]) << 24) | (parseInt(parts[1]) << 16) | (parseInt(parts[2]) << 8) | parseInt(parts[3]);
      };
      
      return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
    } catch {
      return false;
    }
  };

  const addIP = async (ipAddress: string, description: string) => {
    const { error } = await supabase
      .from('admin_ip_whitelist')
      .insert({ ip_address: ipAddress, description });
    
    if (!error) {
      await checkIPAccess();
    }
    return { error };
  };

  const removeIP = async (id: string) => {
    const { error } = await supabase
      .from('admin_ip_whitelist')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await checkIPAccess();
    }
    return { error };
  };

  const toggleIP = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('admin_ip_whitelist')
      .update({ is_active: isActive })
      .eq('id', id);
    
    if (!error) {
      await checkIPAccess();
    }
    return { error };
  };

  return {
    currentIP,
    isIPAllowed,
    loading,
    whitelist,
    addIP,
    removeIP,
    toggleIP,
    refetch: checkIPAccess,
  };
}
