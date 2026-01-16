import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminIPBlockedScreenProps {
  currentIP: string | null;
}

export function AdminIPBlockedScreen({ currentIP }: AdminIPBlockedScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-2">
          Your IP address is not authorized to access the admin panel.
        </p>
        {currentIP && (
          <p className="text-sm font-mono bg-muted px-3 py-1 rounded inline-block mb-6">
            {currentIP}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          Please contact a super administrator to add your IP address to the whitelist.
        </p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
