import React, { useState } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, Plus, Search, ShoppingCart, FileText, TrendingUp, Package } from 'lucide-react';

export const Suppliers = () => {
  const { user } = useEnhancedAuth();
  
  const hasPermission = (permission: string) => true; // Temporarily allow all permissions
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Mock data for demonstration
  const [suppliers] = useState([
    {
      id: '1',
      name: 'Fresh Produce Co.',
      category: 'Vegetables',
      email: 'orders@freshproduce.com',
      phone: '+33 4 93 123 456',
      status: 'active',
      location: 'menton' // Default location - will need location context
    },
    {
      id: '2',
      name: 'Mediterranean Meats',
      category: 'Meat & Poultry',
      email: 'sales@medmeats.fr',
      phone: '+33 4 93 234 567',
      status: 'active',
      location: 'menton' // Default location - will need location context
    }
  ]);

  const [orders] = useState([
    {
      id: '1',
      supplierName: 'Fresh Produce Co.',
      orderNumber: 'ORD-2024-001',
      status: 'pending',
      totalAmount: 245.80,
      orderDate: new Date('2024-01-15'),
      deliveryDate: new Date('2024-01-17')
    },
    {
      id: '2',
      supplierName: 'Mediterranean Meats',
      orderNumber: 'ORD-2024-002',
      status: 'delivered',
      totalAmount: 580.50,
      orderDate: new Date('2024-01-14'),
      deliveryDate: new Date('2024-01-16')
    }
  ]);

  // Check permissions
  const canManageSuppliers = hasPermission('manager');

  if (!canManageSuppliers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Truck className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              You don't have permission to access the supplier management section. 
              Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Suppliers
          </h1>
          <p className="text-muted-foreground">
            Manage suppliers and orders for your location
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 text-muted-foreground">
              Supplier form would be implemented here
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Order Management
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Supplier List
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Order Status
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Archived Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.supplierName}</div>
                      <div className="text-sm text-muted-foreground">
                        Ordered: {formatDate(order.orderDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(order.totalAmount)}</div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Delivery: {formatDate(order.deliveryDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Category</div>
                      <div className="text-sm text-muted-foreground">{supplier.category}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{supplier.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm text-muted-foreground">{supplier.phone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">2</div>
                  <div className="text-sm text-muted-foreground">Pending Orders</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-muted-foreground">In Transit</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-muted-foreground">Delivered This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archived Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No archived orders yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};