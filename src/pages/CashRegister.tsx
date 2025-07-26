import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCashRegister } from '@/context/CashRegisterContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, CreditCard, Banknote, Smartphone, Plus, Minus, Trash2, Clock, CheckCircle } from 'lucide-react';
import { PaymentMethod, OrderStatus } from '@/types/cashRegister';

export const CashRegister = () => {
  const { user, language } = useAuth();
  const { t } = useTranslation(language);
  const {
    menuItems,
    orders,
    currentOrder,
    currentSession,
    dailySales,
    startNewOrder,
    addItemToOrder,
    updateOrderItem,
    removeOrderItem,
    completeOrder,
    cancelOrder,
    updateOrderStatus,
    calculateOrderTotal
  } = useCashRegister();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableNumber, setTableNumber] = useState<number>();
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleStartOrder = () => {
    startNewOrder(tableNumber, customerName);
    setTableNumber(undefined);
    setCustomerName('');
  };

  const handlePayment = (paymentMethod: PaymentMethod) => {
    completeOrder(paymentMethod);
    setPaymentDialogOpen(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('cashRegister')}</h1>
          <p className="text-muted-foreground">
            Point of Sale System
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="text-sm text-muted-foreground">Daily Sales</div>
            <div className="text-xl font-bold text-green-600">
              {formatPrice(dailySales)}
            </div>
          </Card>
          {currentSession && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Session Active
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="pos" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            POS
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Menu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!currentOrder && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start New Order</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="number"
                          placeholder="Table Number (optional)"
                          value={tableNumber || ''}
                          onChange={(e) => setTableNumber(parseInt(e.target.value) || undefined)}
                        />
                        <Input
                          placeholder="Customer Name (optional)"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <Button onClick={handleStartOrder} className="w-full">
                          Start Order
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className={`cursor-pointer transition-colors ${
                    !item.isAvailable ? 'opacity-50' : 'hover:bg-muted/50'
                  }`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                      <Badge variant="outline" className="w-fit text-xs">
                        {item.category}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {item.preparationTime}min prep
                        </div>
                        <Button
                          size="sm"
                          onClick={() => currentOrder && addItemToOrder(item, 1)}
                          disabled={!currentOrder || !item.isAvailable}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Current Order */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Order
                    {currentOrder && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelOrder}
                      >
                        Cancel
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentOrder ? (
                    <div className="space-y-4">
                      {currentOrder.tableNumber && (
                        <div className="text-sm">
                          <strong>Table:</strong> {currentOrder.tableNumber}
                        </div>
                      )}
                      {currentOrder.customerName && (
                        <div className="text-sm">
                          <strong>Customer:</strong> {currentOrder.customerName}
                        </div>
                      )}

                      <div className="space-y-2">
                        {currentOrder.items.length > 0 ? (
                          currentOrder.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.menuItem.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatPrice(item.menuItem.price)} × {item.quantity}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateOrderItem(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateOrderItem(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeOrderItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No items added yet
                          </div>
                        )}
                      </div>

                      {currentOrder.items.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatPrice(calculateOrderTotal() / 1.1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (10%):</span>
                            <span>{formatPrice(calculateOrderTotal() * 0.1)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{formatPrice(calculateOrderTotal())}</span>
                          </div>

                          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="w-full mt-4">
                                Process Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Select Payment Method</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4">
                                <Button
                                  onClick={() => handlePayment('cash')}
                                  className="h-20 flex-col"
                                >
                                  <Banknote className="h-6 w-6 mb-2" />
                                  Cash
                                </Button>
                                <Button
                                  onClick={() => handlePayment('card')}
                                  className="h-20 flex-col"
                                >
                                  <CreditCard className="h-6 w-6 mb-2" />
                                  Card
                                </Button>
                                <Button
                                  onClick={() => handlePayment('digital')}
                                  className="h-20 flex-col"
                                >
                                  <Smartphone className="h-6 w-6 mb-2" />
                                  Digital
                                </Button>
                                <Button
                                  onClick={() => handlePayment('voucher')}
                                  className="h-20 flex-col"
                                >
                                  <CheckCircle className="h-6 w-6 mb-2" />
                                  Voucher
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active order</p>
                      <p className="text-xs">Start a new order to begin</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                        <CardTitle className="text-base">
                          Order #{order.id.slice(-4)}
                        </CardTitle>
                        <Badge variant="outline">
                          {order.type}
                        </Badge>
                        {order.tableNumber && (
                          <Badge variant="secondary">
                            Table {order.tableNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {formatTime(order.createdAt)}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(order.total)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {order.items.length} items • {order.paymentMethod}
                      </div>
                      <div className="flex gap-2">
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={item.isAvailable ? "default" : "secondary"}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};