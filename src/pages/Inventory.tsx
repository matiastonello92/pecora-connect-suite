import React, { useState } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useInventory } from '@/context/InventoryContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, AlertTriangle, TrendingDown, Plus, Search, Filter, Clock } from 'lucide-react';
import { InventoryPagination } from '@/components/inventory/InventoryPagination';

export const Inventory = () => {
  const { user } = useSimpleAuth();
  
  
  const {
    items,
    sessions,
    currentSession,
    loading,
    addItem,
    updateItem,
    startInventorySession,
    updateSessionItem,
    getLowStockItems,
    getExpiringItems
  } = useInventory();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const categories = ['all', ...Array.from(new Set(items.map(item => item.category)))];
  const lowStockItems = getLowStockItems();
  const expiringItems = getExpiringItems(7); // Items expiring in 7 days

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStockStatus = (item: any) => {
    if (item.currentStock <= item.minStock) return 'low';
    if (item.currentStock >= item.maxStock) return 'high';
    return 'normal';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-500';
      case 'high': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Manage restaurant inventory and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => startInventorySession('kitchen')}>
            <Package className="h-4 w-4 mr-2" />
            Start Count Session
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="text-center py-4 text-muted-foreground">
                Add item form would be implemented here
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{items.length}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{lowStockItems.length}</div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{expiringItems.length}</div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formatPrice(items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Min: {item.minStock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No low stock items
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringItems.length > 0 ? (
                  <div className="space-y-2">
                    {expiringItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-yellow-600">
                            {item.expiryDate && formatDate(item.expiryDate)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.currentStock} {item.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No items expiring soon
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {currentSession && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Active Inventory Session - {currentSession.department}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Started: {formatDate(currentSession.startedAt)} • 
                    Progress: {currentSession.items.filter(i => i.countedQuantity > 0).length} / {currentSession.items.length} items
                  </div>
                  <div className="grid gap-2">
                    {currentSession.items.slice(0, 3).map((sessionItem) => (
                      <div key={sessionItem.itemId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{sessionItem.item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Expected: {sessionItem.expectedQuantity} {sessionItem.item.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Count"
                            className="w-20"
                            value={sessionItem.countedQuantity || ''}
                            onChange={(e) => updateSessionItem(
                              currentSession.id,
                              sessionItem.itemId,
                              parseInt(e.target.value) || 0
                            )}
                          />
                          <span className="text-sm">{sessionItem.item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <InventoryPagination
            items={items}
            itemsPerPage={20}
            onItemSelect={(item) => console.log('Selected item:', item)}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {session.department} Inventory Session
                      </CardTitle>
                      <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm font-medium">Started</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(session.startedAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Started By</div>
                        <div className="text-sm text-muted-foreground">{session.startedBy}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Items</div>
                        <div className="text-sm text-muted-foreground">
                          {session.items.length} items
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Progress</div>
                        <div className="text-sm text-muted-foreground">
                          {session.items.filter(i => i.countedQuantity > 0).length} / {session.items.length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No inventory sessions yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">{lowStockItems.length} items below minimum stock</div>
                        <div className="text-sm text-muted-foreground">
                          Immediate restocking required
                        </div>
                      </div>
                    </div>
                  )}
                  {expiringItems.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="font-medium">{expiringItems.length} items expiring within 7 days</div>
                        <div className="text-sm text-muted-foreground">
                          Use soon or consider promotions
                        </div>
                      </div>
                    </div>
                  )}
                  {lowStockItems.length === 0 && expiringItems.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No active alerts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};