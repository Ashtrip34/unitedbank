import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin2FA } from '@/hooks/useAdmin2FA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Admin2FASetupProps {
  onSetupComplete?: () => void;
}

export function Admin2FASetup({ onSetupComplete }: Admin2FASetupProps) {
  const { toast } = useToast();
  const { is2FAEnabled, setup2FA, verify2FA, disable2FA, loading } = useAdmin2FA();
  
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleSetup = async () => {
    try {
      const data = await setup2FA();
      setSetupData(data);
      setSetupOpen(true);
    } catch (error: any) {
      toast({ title: 'Error setting up 2FA', description: error.message, variant: 'destructive' });
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast({ title: 'Please enter the verification code', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      const success = await verify2FA(verificationCode);
      if (success) {
        toast({ title: '2FA enabled successfully' });
        setShowBackupCodes(true);
        onSetupComplete?.();
      } else {
        toast({ title: 'Invalid verification code', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error verifying code', description: error.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode.trim()) {
      toast({ title: 'Please enter your 2FA code', variant: 'destructive' });
      return;
    }

    try {
      const success = await disable2FA(disableCode);
      if (success) {
        toast({ title: '2FA disabled successfully' });
        setDisableOpen(false);
        setDisableCode('');
      } else {
        toast({ title: 'Invalid code', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error disabling 2FA', description: error.message, variant: 'destructive' });
    }
  };

  const copySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const closeSetupDialog = () => {
    setSetupOpen(false);
    setSetupData(null);
    setVerificationCode('');
    setShowBackupCodes(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            {is2FAEnabled ? (
              <Badge className="bg-success/10 text-success border-0">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <ShieldOff className="w-3 h-3 mr-1" />
                Disabled
              </Badge>
            )}
          </div>
          <CardDescription>
            Add an extra layer of security to your admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {is2FAEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when accessing the admin panel.
              </p>
              <Button variant="destructive" onClick={() => setDisableOpen(true)}>
                Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable two-factor authentication to add an extra layer of security to your admin account. You'll need an authenticator app like Google Authenticator or Authy.
              </p>
              <Button onClick={handleSetup}>
                <Key className="w-4 h-4 mr-2" />
                Setup 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={closeSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {showBackupCodes
                ? 'Save your backup codes in a secure location.'
                : 'Scan the QR code or enter the secret key in your authenticator app.'}
            </DialogDescription>
          </DialogHeader>

          {showBackupCodes ? (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Backup Codes</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Store these codes safely. Each code can only be used once.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {setupData?.backupCodes.map((code, i) => (
                    <code key={i} className="bg-background px-2 py-1 rounded text-sm font-mono text-center">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <Button onClick={closeSetupDialog} className="w-full">
                I've saved my backup codes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code placeholder - in production, you'd generate an actual QR code */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Secret Key</p>
                <p className="text-xs text-muted-foreground mb-2">
                  If you can't scan the QR code, enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono break-all">
                    {setupData?.secret}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copySecret}>
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification">Verification Code</Label>
                <Input
                  id="verification"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeSetupDialog}>
                  Cancel
                </Button>
                <Button onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current 2FA code to disable two-factor authentication. This will make your account less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="disableCode">2FA Code</Label>
            <Input
              id="disableCode"
              placeholder="Enter 6-digit code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableCode('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
