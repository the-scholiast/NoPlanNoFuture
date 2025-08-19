'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import type { Notification, CreateNotificationData } from '@/types/notificationTypes';
import { 
  getNotifications, 
  createNotification, 
  updateNotification, 
  deleteNotification, 
  testNotification,
  sendNotificationManually
} from '@/lib/api/notificationsApi';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateNotificationData>({
    webhook_url: '',
    cadence: 'weekly',
    day_of_week: 1,
    send_time: '09:00',
    period: '1w',
    include_upcoming: true,
    include_recurring: true,
    include_daily: true,
  });

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (editingNotification) {
        await updateNotification(editingNotification.id, formData);
        toast.success('Notification updated successfully');
      } else {
        await createNotification(formData);
        toast.success('Notification created successfully');
      }
      
      setShowForm(false);
      setEditingNotification(null);
      resetForm();
      loadNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await deleteNotification(id);
      toast.success('Notification deleted successfully');
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleManualSend = async (id: string) => {
    try {
      await sendNotificationManually(id);
      toast.success('Notification sent successfully');
      loadNotifications(); // Refresh to update last_sent_at
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send notification');
    }
  };

  const resetForm = () => {
    setFormData({
      webhook_url: '',
      cadence: 'weekly',
      day_of_week: 1,
      send_time: '09:00',
      period: '1w',
      include_upcoming: true,
      include_recurring: true,
      include_daily: true,
    });
  };

  const editNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      webhook_url: notification.webhook_url,
      cadence: notification.cadence,
      day_of_week: notification.day_of_week || 1,
      send_time: notification.send_time,
      period: notification.period,
      include_upcoming: notification.include_upcoming,
      include_recurring: notification.include_recurring,
      include_daily: notification.include_daily,
    });
    setShowForm(true);
  };

  const getStatusIcon = (notification: Notification) => {
    if (notification.last_error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (notification.last_sent_at) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (day: number) => {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in to access your profile.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account and Discord notifications</p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Notifications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Discord Notifications
                </CardTitle>
                <CardDescription>
                  Manage your Discord webhook notifications for task reminders
                </CardDescription>
              </div>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Notification
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications configured yet.</p>
                <p className="text-sm">Create your first Discord notification to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(notification)}
                          <Badge variant={notification.active ? "default" : "secondary"}>
                            {notification.active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {notification.cadence === 'daily' ? 'Daily' : `${getDayName(notification.day_of_week || 1)}`}
                          </Badge>
                          <Badge variant="outline">
                            {formatTime(notification.send_time)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          Webhook: {notification.webhook_url.substring(0, 50)}...
                        </div>
                        
                        {notification.last_error && (
                          <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Error: {notification.last_error}
                          </div>
                        )}
                        
                        {notification.last_sent_at && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Last sent: {new Date(notification.last_sent_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManualSend(notification.id)}
                          title="Send Now"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editNotification(notification)}
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingNotification ? 'Edit Notification' : 'Add New Notification'}
              </CardTitle>
              <CardDescription>
                Configure a Discord webhook to receive task notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Discord Webhook URL *</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cadence">Cadence</Label>
                    <Select
                      value={formData.cadence}
                      onValueChange={(value: 'daily' | 'weekly') => 
                        setFormData({ ...formData, cadence: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.cadence === 'weekly' && (
                    <div className="space-y-2">
                      <Label htmlFor="day_of_week">Day of Week</Label>
                      <Select
                        value={formData.day_of_week?.toString()}
                        onValueChange={(value) => 
                          setFormData({ ...formData, day_of_week: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="7">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="send_time">Time</Label>
                    <Input
                      id="send_time"
                      type="time"
                      step="1800"
                      value={formData.send_time}
                      onChange={(e) => setFormData({ ...formData, send_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: '1d' | '1w' | '1m') => 
                      setFormData({ ...formData, period: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                      <SelectItem value="1m">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Include Task Types</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include_upcoming"
                        checked={formData.include_upcoming}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, include_upcoming: checked })
                        }
                      />
                      <Label htmlFor="include_upcoming">Upcoming tasks</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include_recurring"
                        checked={formData.include_recurring}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, include_recurring: checked })
                        }
                      />
                      <Label htmlFor="include_recurring">Recurring tasks</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include_daily"
                        checked={formData.include_daily}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, include_daily: checked })
                        }
                      />
                      <Label htmlFor="include_daily">Daily tasks</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingNotification ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingNotification(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
