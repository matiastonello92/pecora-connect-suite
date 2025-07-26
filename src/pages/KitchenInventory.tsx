import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useKitchenInventory } from '@/context/KitchenInventoryContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  Package, 
  Save, 
  Download, 
  Star, 
  StarOff, 
  Plus, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronRight,
  FileText,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { KitchenCategory, KitchenProduct } from '@/types/kitchenInventory';

export const KitchenInventory = () => {
  const { user, language, hasPermission } = useAuth();
  const { t } = useTranslation(language);
  const {
    currentInventory,
    historicalInventories,
    products,
    loading,
    isInventoryPeriod,
    updateInventoryItem,
    toggleProductFavorite,
    saveInventory,
    approveInventory,
    exportInventory,
    detectAnomalies,
    createNewInventory
  } = useKitchenInventory();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Check if user has access to kitchen inventory
  const hasKitchenAccess = user?.department === 'kitchen' || hasPermission('manager');
  const canApprove = hasPermission('manager');

  if (!hasKitchenAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have access to the Kitchen Inventory section. Only Kitchen department users and managers can access this area.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group products by category
  const categorizedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<KitchenCategory, KitchenProduct[]>);

  // Filter products based on search and favorites
  const filteredCategories = Object.entries(categorizedProducts).reduce((acc, [category, categoryProducts]) => {
    const filtered = categoryProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t(product.nameKey).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorites = !showOnlyFavorites || product.isFavorite;
      return matchesSearch && matchesFavorites;
    });
    
    if (filtered.length > 0) {
      acc[category as KitchenCategory] = filtered;
    }
    return acc;
  }, {} as Record<KitchenCategory, KitchenProduct[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getInventoryItem = (productId: string) => {
    return currentInventory?.items.find(item => item.productId === productId);
  };

  const updateQuantity = (productId: string, change: number) => {
    const currentItem = getInventoryItem(productId);
    const currentQuantity = currentItem?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    updateInventoryItem(productId, newQuantity, currentItem?.notes);
  };

  const handleQuantityInput = (productId: string, value: string) => {
    const quantity = parseFloat(value) || 0;
    const currentItem = getInventoryItem(productId);
    updateInventoryItem(productId, quantity, currentItem?.notes);
  };

  const handleNotesChange = (productId: string, notes: string) => {
    const currentItem = getInventoryItem(productId);
    updateInventoryItem(productId, currentItem?.quantity || 0, notes);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChefHat className="h-8 w-8" />
            {t('kitchen-inventory-title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('kitchen-inventory-description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {currentInventory && (
            <>
              <Button 
                variant="outline" 
                onClick={() => exportInventory('csv')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('export-csv')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportInventory('pdf')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {t('export-pdf')}
              </Button>
              {currentInventory.status === 'draft' && !currentInventory.isLocked && (
                <Button 
                  onClick={saveInventory}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {t('save-inventory')}
                </Button>
              )}
              {currentInventory.status === 'completed' && canApprove && (
                <Button 
                  onClick={() => approveInventory(currentInventory.id)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('approve-inventory')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inventory Period Check */}
      {!isInventoryPeriod && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {t('inventory-not-available')}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Inventory Status */}
      {currentInventory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('current-inventory')} - {currentInventory.month}/{currentInventory.year}
              </span>
              <Badge 
                variant={
                  currentInventory.status === 'draft' ? 'secondary' :
                  currentInventory.status === 'completed' ? 'default' :
                  currentInventory.status === 'approved' ? 'default' : 'secondary'
                }
              >
                {currentInventory.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium">{t('status')}</div>
                <div className="text-lg">
                  {currentInventory.status === 'draft' && t('current-inventory')}
                  {currentInventory.status === 'completed' && t('inventory-completed')}
                  {currentInventory.status === 'approved' && t('inventory-approved')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Items Counted</div>
                <div className="text-lg">
                  {currentInventory.items.filter(item => item.quantity > 0).length} / {products.length}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">{t('anomalies-detected')}</div>
                <div className="text-lg flex items-center gap-2">
                  {currentInventory.anomalies.length}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={detectAnomalies}
                    className="flex items-center gap-1"
                  >
                    <TrendingUp className="h-3 w-3" />
                    {t('detect-anomalies')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="current">{t('current-inventory')}</TabsTrigger>
          <TabsTrigger value="historical">{t('historical-inventories')}</TabsTrigger>
          <TabsTrigger value="anomalies">{t('anomalies-detected')}</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {!currentInventory && isInventoryPeriod && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No current inventory started for this month</p>
                  <Button onClick={createNewInventory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentInventory && (
            <>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder={`${t('search')} products...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant={showOnlyFavorites ? "default" : "outline"}
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  {t('favorite')}
                </Button>
              </div>

              {/* Product Categories */}
              <div className="space-y-4">
                {Object.entries(filteredCategories).map(([category, categoryProducts]) => (
                  <Card key={category}>
                    <Collapsible
                      open={expandedCategories[category]}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {expandedCategories[category] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                              {t(`category.${category}`)}
                            </span>
                            <Badge variant="outline">
                              {categoryProducts.length} items
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          {categoryProducts.map((product) => {
                            const inventoryItem = getInventoryItem(product.id);
                            const quantity = inventoryItem?.quantity || 0;
                            const totalPrice = quantity * product.unitPrice;
                            
                            return (
                              <div 
                                key={product.id} 
                                className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                {/* Product Info */}
                                <div className="lg:col-span-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{t(product.nameKey)}</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleProductFavorite(product.id)}
                                      className="p-1 h-auto"
                                    >
                                      {product.isFavorite ? 
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> :
                                        <StarOff className="h-4 w-4" />
                                      }
                                    </Button>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.unitPrice > 0 ? formatPrice(product.unitPrice) : 'Price not set'} / {product.unit}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t('last-order-date')}: {product.lastOrderDate ? formatDate(product.lastOrderDate) : t('never-ordered')}
                                  </div>
                                </div>

                                {/* Quantity Controls */}
                                <div className="lg:col-span-3 flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(product.id, -1)}
                                    disabled={currentInventory.isLocked}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={quantity || ''}
                                    onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                                    className="w-20 text-center"
                                    min="0"
                                    step="0.1"
                                    disabled={currentInventory.isLocked}
                                  />
                                  <span className="text-sm min-w-fit">{product.unit}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(product.id, 1)}
                                    disabled={currentInventory.isLocked}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Total Price */}
                                <div className="lg:col-span-2">
                                  <div className="text-sm font-medium">
                                    {product.unitPrice > 0 ? formatPrice(totalPrice) : 'Set price first'}
                                  </div>
                                </div>

                                {/* Notes */}
                                <div className="lg:col-span-3">
                                  <Textarea
                                    placeholder={t('notes')}
                                    value={inventoryItem?.notes || ''}
                                    onChange={(e) => handleNotesChange(product.id, e.target.value)}
                                    className="min-h-8"
                                    disabled={currentInventory.isLocked}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          {historicalInventories.length > 0 ? (
            historicalInventories.map((inventory) => (
              <Card key={inventory.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {inventory.month}/{inventory.year} - {inventory.department}
                    </CardTitle>
                    <Badge variant={inventory.status === 'approved' ? 'default' : 'secondary'}>
                      {inventory.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">{t('total-value')}</div>
                      <div className="text-lg font-bold">{formatPrice(inventory.totalValue)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Created</div>
                      <div className="text-sm">{formatDate(inventory.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Items</div>
                      <div className="text-sm">{inventory.items.length}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Anomalies</div>
                      <div className="text-sm">{inventory.anomalies.length}</div>
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
                  <p>No historical inventories found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {currentInventory?.anomalies.length ? (
            currentInventory.anomalies.map((anomaly) => {
              const product = products.find(p => p.id === anomaly.productId);
              return (
                <Alert key={anomaly.id} className={
                  anomaly.severity === 'high' ? 'border-red-500' :
                  anomaly.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product && t(product.nameKey)}</div>
                        <div className="text-sm">{anomaly.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Current: {anomaly.currentValue} | Previous: {anomaly.previousValue}
                        </div>
                      </div>
                      <Badge variant={
                        anomaly.severity === 'high' ? 'destructive' :
                        anomaly.severity === 'medium' ? 'default' : 'secondary'
                      }>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No anomalies detected in current inventory</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};