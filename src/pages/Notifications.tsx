import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, BellOff, Settings, CheckCircle, AlertTriangle, CreditCard, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  id: string;
  email_transactions: boolean;
  email_low_balance: boolean;
  email_scheduled_payments: boolean;
  sms_transactions: boolean;
  sms_low_balance: boolean;
  low_balance_threshold: number;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch notifications
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (notifData) {
      setNotifications(notifData as Notification[]);
    }

    // Fetch or create preferences
    const { data: prefData } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (prefData) {
      setPreferences(prefData as NotificationPreferences);
    } else {
      // Create default preferences
      const { data: newPref } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (newPref) {
        setPreferences(newPref as NotificationPreferences);
      }
    }
    
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          toast({ 
            title: (payload.new as Notification).title,
            description: (payload.new as Notification).message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: 'All notifications marked as read' });
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('id', preferences.id);
    
    if (error) {
      toast({ title: 'Error saving preferences', variant: 'destructive' });
    } else {
      setPreferences({ ...preferences, ...updates });
      toast({ title: 'Preferences updated' });
    }
    
    setSaving(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <CreditCard className="w-5 h-5 text-primary" />;
      case 'low_balance':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'scheduled_payment':
        return <Calendar className="w-5 h-5 text-accent" />;
      case 'security':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </header>

      <div className="container py-8 max-w-2xl">
        <Tabs defaultValue="notifications">
          <TabsList className="mb-6">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <CardContent>
                  <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                  <p className="text-muted-foreground">You'll receive alerts about transactions, scheduled payments, and more</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <Card variant={notif.read ? 'default' : 'elevated'} className={`cursor-pointer ${!notif.read ? 'border-primary/30' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notif.read ? 'bg-primary/10' : 'bg-muted'}`}>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-medium ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notif.title}
                              </h3>
                              <span className="text-xs text-muted-foreground">{formatDate(notif.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            {preferences && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Email Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_transactions">Transaction alerts</Label>
                        <Switch
                          id="email_transactions"
                          checked={preferences.email_transactions}
                          onCheckedChange={(checked) => updatePreferences({ email_transactions: checked })}
                          disabled={saving}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_low_balance">Low balance warnings</Label>
                        <Switch
                          id="email_low_balance"
                          checked={preferences.email_low_balance}
                          onCheckedChange={(checked) => updatePreferences({ email_low_balance: checked })}
                          disabled={saving}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_scheduled">Scheduled payment reminders</Label>
                        <Switch
                          id="email_scheduled"
                          checked={preferences.email_scheduled_payments}
                          onCheckedChange={(checked) => updatePreferences({ email_scheduled_payments: checked })}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">SMS Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sms_transactions">Transaction alerts</Label>
                        <Switch
                          id="sms_transactions"
                          checked={preferences.sms_transactions}
                          onCheckedChange={(checked) => updatePreferences({ sms_transactions: checked })}
                          disabled={saving}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sms_low_balance">Low balance warnings</Label>
                        <Switch
                          id="sms_low_balance"
                          checked={preferences.sms_low_balance}
                          onCheckedChange={(checked) => updatePreferences({ sms_low_balance: checked })}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Alert Thresholds</h4>
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Low balance threshold</Label>
                      <div className="flex gap-2 items-center">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          id="threshold"
                          type="number"
                          className="w-32"
                          value={preferences.low_balance_threshold}
                          onChange={(e) => updatePreferences({ low_balance_threshold: parseFloat(e.target.value) || 0 })}
                          disabled={saving}
                        />
                        <span className="text-sm text-muted-foreground">Notify when balance falls below this amount</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
