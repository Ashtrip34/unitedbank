import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBanking } from '@/hooks/useBanking';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, UserPlus, Mail, Shield, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface AuthorizedUser {
  id: string;
  account_id: string;
  user_id: string;
  invited_email: string | null;
  permission_level: string | null;
  status: string | null;
  created_at: string | null;
}

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  permissionLevel: z.enum(['viewer', 'editor', 'admin']),
});

export default function TeamManagement() {
  const { user } = useAuth();
  const { account } = useBanking();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<string>('viewer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) navigate('/auth');
    else fetchAuthorizedUsers();
  }, [user, account]);

  const fetchAuthorizedUsers = async () => {
    if (!account) return;
    
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching authorized users:', error);
    } else {
      setAuthorizedUsers(data || []);
    }
    setLoading(false);
  };

  const validateForm = () => {
    try {
      inviteSchema.parse({ email, permissionLevel });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !account || !user) return;

    setInviting(true);
    
    const { error } = await supabase
      .from('authorized_users')
      .insert({
        account_id: account.id,
        user_id: user.id,
        invited_email: email,
        permission_level: permissionLevel,
        status: 'pending',
      });

    setInviting(false);

    if (error) {
      toast({
        title: 'Invitation failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Invitation sent!',
        description: `${email} has been invited as a ${permissionLevel}.`,
      });
      setEmail('');
      setPermissionLevel('viewer');
      setShowInviteForm(false);
      fetchAuthorizedUsers();
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'User removed' });
      fetchAuthorizedUsers();
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const { error } = await supabase
      .from('authorized_users')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } else {
      toast({ title: `User ${newStatus}` });
      fetchAuthorizedUsers();
    }
  };

  const getPermissionBadgeVariant = (level: string | null) => {
    switch (level) {
      case 'admin': return 'destructive';
      case 'editor': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'outline';
    }
  };

  if (account?.category !== 'business') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Team Management</h1>
          </div>
        </header>
        <div className="container py-16 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Business Feature</h2>
          <p className="text-muted-foreground mb-6">
            Team management is only available for business accounts.
          </p>
          <Button variant="accent" onClick={() => navigate('/business-signup')}>
            Upgrade to Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Team Management</h1>
        </div>
      </header>

      <div className="container py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Invite Card */}
          <Card variant="elevated" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Invite Team Member
                  </CardTitle>
                  <CardDescription>
                    Add authorized users to access your business account
                  </CardDescription>
                </div>
                {!showInviteForm && (
                  <Button variant="accent" onClick={() => setShowInviteForm(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {showInviteForm && (
              <CardContent>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!errors.email}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permission">Permission Level</Label>
                    <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Viewer - Can view transactions and balances
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Editor - Can make transfers and deposits
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Admin - Full access including team management
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="accent" disabled={inviting}>
                      {inviting ? (
                        <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Team Members List */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : authorizedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No team members yet. Invite someone to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {authorizedUsers.map((authUser) => (
                    <div
                      key={authUser.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{authUser.invited_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getPermissionBadgeVariant(authUser.permission_level)}>
                              {authUser.permission_level || 'viewer'}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(authUser.status)}>
                              {authUser.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {authUser.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateStatus(authUser.id, 'active')}
                              title="Approve"
                            >
                              <Check className="w-4 h-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateStatus(authUser.id, 'revoked')}
                              title="Deny"
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(authUser.id)}
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
