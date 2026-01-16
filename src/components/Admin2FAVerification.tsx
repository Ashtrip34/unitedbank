import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin2FA } from '@/hooks/useAdmin2FA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import unitedBankLogo from '@/assets/united-bank-logo.png';

interface Admin2FAVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
}

export function Admin2FAVerification({ onVerified, onCancel }: Admin2FAVerificationProps) {
  const { toast } = useToast();
  const { validateCode } = useAdmin2FA();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({ title: 'Please enter your verification code', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await validateCode(code);
      if (isValid) {
        onVerified();
      } else {
        toast({ title: 'Invalid verification code', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error verifying code', description: error.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app or use a backup code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <img src={unitedBankLogo} alt="United Bank" className="w-4 h-4" />
            <span>United Bank Admin Security</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
