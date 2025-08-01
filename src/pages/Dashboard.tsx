import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

  import {
    Package,
    CheckSquare,
    MessageSquare,
    Calculator,
    AlertTriangle,
    Users,
    Calendar,
    TrendingUp,
    DollarSign,
  } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useEnhancedAuth();
  

  // Check if user has access to financial section  
  const hasFinancialAccess = true; // Allow all for now

  // All stats now start with 0 - will be populated with real data
  const stats = [
    {
      title: "Pending Inventories",
      value: '0',
      icon: Package,
      color: 'bg-orange-500',
      urgent: false,
    },
    {
      title: "Open Checklists",
      value: '0',
      icon: CheckSquare,
      color: 'bg-blue-500',
    },
    {
      title: "Unread Messages",
      value: '0',
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      title: "Equipment Alerts",
      value: '0',
      icon: AlertTriangle,
      color: 'bg-red-500',
      urgent: false,
    },
  ];

  // No mock activity data - will show "No recent activity" message

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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-secondary/20 via-background to-accent/10 rounded-lg p-4 sm:p-6 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-playfair font-bold text-primary mb-2">
              Welcome, {profile?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-inter">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </p>
            <div className="mt-2">
              <Badge className="bg-primary text-primary-foreground">
                <span className="text-xs sm:text-sm">
                  Admin • All Locations
                </span>
              </Badge>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-muted-foreground shrink-0">
            <Calendar className="h-5 w-5" />
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Stats Grid - Now clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const linkTo = stat.title === "Pending Inventories" ? '/inventory' :
                        stat.title === "Open Checklists" ? '/checklists' :
                        stat.title === "Unread Messages" ? '/communication' :
                        stat.title === "Equipment Alerts" ? '/equipment' : '#';
          
          return (
            <Link key={index} to={linkTo}>
              <Card className={`relative hover:shadow-md transition-shadow cursor-pointer ${stat.urgent ? 'ring-2 ring-red-200' : ''}`}>
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
                      Requires Attention
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Financial Section - Only for authorized users */}
      {hasFinancialAccess && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-playfair text-green-800">
              <DollarSign className="h-6 w-6" />
              Financial
            </CardTitle>
            <p className="text-green-600 text-sm">
              Access financial reports and cash register data
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link to="/financial">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Calculator className="h-4 w-4 mr-2" />
                  Open Financial Section
                </Button>
              </Link>
              <Link to="/financial">
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Now with navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="font-playfair">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Link to="/inventory">
              <Button variant="outline" className="flex flex-col items-center p-3 sm:p-4 h-auto w-full">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mb-2" />
                <span className="text-xs sm:text-sm font-medium text-center">Update Inventory</span>
              </Button>
            </Link>
            
            <Link to="/checklists">
              <Button variant="outline" className="flex flex-col items-center p-3 sm:p-4 h-auto w-full">
                <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2" />
                <span className="text-xs sm:text-sm font-medium text-center">Complete Checklist</span>
              </Button>
            </Link>
            
            <Link to="/cash-register">
              <Button variant="outline" className="flex flex-col items-center p-3 sm:p-4 h-auto w-full">
                <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2" />
                <span className="text-xs sm:text-sm font-medium text-center">Cash Register</span>
              </Button>
            </Link>
            
            <Link to="/communication">
              <Button variant="outline" className="flex flex-col items-center p-3 sm:p-4 h-auto w-full">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mb-2" />
                <span className="text-xs sm:text-sm font-medium text-center">Send Message</span>
              </Button>
            </Link>

            {hasFinancialAccess && (
              <Link to="/financial">
                <Button variant="outline" className="flex flex-col items-center p-3 sm:p-4 h-auto w-full border-green-300 hover:bg-green-50">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-center">Financial</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}