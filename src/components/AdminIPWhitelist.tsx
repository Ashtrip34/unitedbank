import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Globe, Plus, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useAdminIPCheck } from '@/hooks/useAdminIPCheck';
import { useToast } from '@/hooks/use-toast';

export function AdminIPWhitelist() {
  const { currentIP, isIPAllowed, whitelist, addIP, removeIP, toggleIP, loading } = useAdminIPCheck();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAddIP = async () => {
    if (!newIP.trim()) {
      toast({ title: 'Please enter an IP address', variant: 'destructive' });
      return;
    }

    const { error } = await addIP(newIP.trim(), newDescription.trim());
    
    if (error) {
      toast({ title: 'Error adding IP', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'IP address added successfully' });
      setAddOpen(false);
      setNewIP('');
      setNewDescription('');
    }
  };

  const handleDeleteIP = async () => {
    if (!selectedId) return;

    const { error } = await removeIP(selectedId);
    
    if (error) {
      toast({ title: 'Error removing IP', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'IP address removed' });
      setDeleteOpen(false);
      setSelectedId(null);
    }
  };

  const handleToggleIP = async (id: string, isActive: boolean) => {
    const { error } = await toggleIP(id, !isActive);
    
    if (error) {
      toast({ title: 'Error updating IP', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'IP status updated' });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              IP Whitelist
            </CardTitle>
            <CardDescription>Manage trusted IP addresses for admin access</CardDescription>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add IP
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current IP Status */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Your Current IP</p>
                <p className="text-sm text-muted-foreground font-mono">{currentIP || 'Loading...'}</p>
              </div>
            </div>
            {isIPAllowed !== null && (
              <Badge variant={isIPAllowed ? 'default' : 'destructive'} className="flex items-center gap-1">
                {isIPAllowed ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Allowed
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Blocked
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Whitelist Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : whitelist.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No IP addresses in whitelist.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {whitelist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono">
                    {entry.ip_address}
                    {entry.ip_address === '0.0.0.0/0' && (
                      <Badge variant="secondary" className="ml-2 text-xs">Allow All</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.description || '-'}</TableCell>
                  <TableCell>{formatDate(entry.created_at)}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={entry.is_active}
                      onCheckedChange={() => handleToggleIP(entry.id, entry.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedId(entry.id);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="p-3 rounded bg-warning/10 text-warning text-sm">
          <strong>Note:</strong> The "0.0.0.0/0" entry allows all IP addresses. Remove or disable it to restrict access to specific IPs only.
        </div>
      </CardContent>

      {/* Add IP Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Add IP to Whitelist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address or CIDR</Label>
              <Input
                id="ipAddress"
                placeholder="e.g., 192.168.1.1 or 10.0.0.0/24"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a single IP address or CIDR notation for a range.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Office network, Home IP"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setNewIP(currentIP || '')}>
              Use Current IP ({currentIP})
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddIP}>Add IP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove IP Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this IP address from the whitelist?
              <br /><br />
              Users connecting from this IP will no longer have access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIP}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
