import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  CheckSquare,
  MessageSquare,
  Calculator,
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const { user, language } = useAuth();
  const { t } = useTranslation(language);

  const stats = [
    {
      title: 'Pending Inventories',
      value: '3',
      icon: Package,
      color: 'bg-orange-500',
      urgent: true,
    },
    {
      title: 'Open Checklists',
      value: '7',
      icon: CheckSquare,
      color: 'bg-blue-500',
    },
    {
      title: 'Unread Messages',
      value: '12',
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      title: 'Equipment Alerts',
      value: '2',
      icon: AlertTriangle,
      color: 'bg-red-500',
      urgent: true,
    },
  ];

  const recentActivity = [
    {
      action: 'Kitchen inventory completed',
      user: 'Marco Bianchi',
      time: '2 hours ago',
      type: 'inventory',
    },
    {
      action: 'Cash register closed',
      user: 'Sofia Rossi',
      time: '4 hours ago',
      type: 'cash',
    },
    {
      action: 'Equipment maintenance scheduled',
      user: 'Luigi Verdi',
      time: '6 hours ago',
      type: 'equipment',
    },
    {
      action: 'New user invitation sent',
      user: 'Maria Neri',
      time: '1 day ago',
      type: 'user',
    },
  ];

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'kitchen':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pizzeria':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'service':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finance':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'super_manager':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-secondary/20 via-background to-accent/10 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-2">
              {t('welcome')}, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground font-inter">
              {new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : language === 'fr' ? 'fr-FR' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </p>
            <div className="mt-2">
              <Badge className={getDepartmentColor(user?.department || '')}>
                {t(user?.department || '')} • {user?.location}
              </Badge>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`relative ${stat.urgent ? 'ring-2 ring-red-200' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              {stat.urgent && (
                <div className="flex items-center mt-2 text-sm text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-playfair">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'inventory' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'cash' ? 'bg-green-100 text-green-600' :
                    activity.type === 'equipment' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.type === 'inventory' && <Package className="h-4 w-4" />}
                    {activity.type === 'cash' && <Calculator className="h-4 w-4" />}
                    {activity.type === 'equipment' && <AlertTriangle className="h-4 w-4" />}
                    {activity.type === 'user' && <Users className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-playfair">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Update Inventory</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <CheckSquare className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Complete Checklist</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <Calculator className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Close Register</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">Send Message</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}