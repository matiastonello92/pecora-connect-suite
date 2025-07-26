import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useKitchenInventory } from '@/context/KitchenInventoryContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ChefHat, 
  Save, 
  Star, 
  StarOff, 
  Plus, 
  Minus, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { KitchenCategory, KitchenProduct } from '@/types/kitchenInventory';

export const KitchenInventory = () => {
  const { user, language, hasPermission } = useAuth();
  const { t } = useTranslation(language);
  const { toast } = useToast();
  const {
    currentInventory,
    products,
    loading,
    isInventoryPeriod,
    updateInventoryItem,
    toggleProductFavorite,
    saveInventory,
    createNewInventory
  } = useKitchenInventory();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    // Start with all categories expanded for better UX
    {
      'dairy-derivatives': true,
      'meats-cold-cuts': true,
      'fish': true,
      'spices-seasonings': true,
      'preserves-oils-pickles': true,
      'nuts': true,
      'fresh-fruits-vegetables': true,
      'flours': true,
      'fruits': true
    }
  );

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

  // Show all categories and products - no filtering needed for the main inventory input

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

  const updateProductPrice = (productId: string, price: number) => {
    // In a real app, this would update the product's unit price in the database
    console.log(`Updating price for product ${productId}: ${price}`);
  };

  const updateProductLastOrderDate = (productId: string, date: string) => {
    // In a real app, this would update the product's last order date in the database
    console.log(`Updating last order date for product ${productId}: ${date}`);
  };

  const validateInventory = (): boolean => {
    if (!currentInventory) return false;
    
    // Check if at least one product has quantity or price entered
    const hasData = currentInventory.items.some(item => item.quantity > 0) ||
                   products.some(product => product.unitPrice > 0);
    
    return hasData;
  };

  const handleSaveInventory = () => {
    if (!validateInventory()) {
      toast({
        title: t('validation-error'),
        description: t('inventory-validation-message'),
        variant: "destructive",
      });
      return;
    }

    saveInventory();
    toast({
      title: t('inventory-saved'),
      description: t('inventory-saved-message'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <ChefHat className="h-8 w-8 text-primary" />
            {t('kitchen-inventory-title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('kitchen-inventory-description')}
          </p>
        </div>
      </div>

      {/* Access Control */}
      {!hasKitchenAccess && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('access-denied-kitchen')}
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Period Check */}
      {hasKitchenAccess && !isInventoryPeriod && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            {t('inventory-period-message')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Inventory Input */}
      {hasKitchenAccess && isInventoryPeriod && (
        <>
          {!currentInventory && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">{t('start-inventory-title')}</h3>
                  <p className="text-muted-foreground mb-6">{t('start-inventory-description')}</p>
                  <Button onClick={createNewInventory} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    {t('start-new-inventory')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentInventory && (
            <div className="space-y-6">
              {/* Product Categories */}
              <div className="space-y-6">
                {Object.entries(categorizedProducts).map(([category, categoryProducts]) => (
                  <Card key={category} className="border-2">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-xl text-primary">
                          {t(`category.${category}`)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {categoryProducts.length} {t('items')}
                          </Badge>
                          {expandedCategories[category] ? (
                            <Minus className="h-5 w-5" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    {expandedCategories[category] && (
                      <CardContent className="space-y-4 pt-0">
                        {categoryProducts.map((product) => {
                          const inventoryItem = getInventoryItem(product.id);
                          const quantity = inventoryItem?.quantity || 0;
                          
                          return (
                            <Card key={product.id} className="border border-border/40">
                              <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {/* Product Info */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-lg">{t(product.nameKey)}</h4>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleProductFavorite(product.id)}
                                        className="p-1 h-auto"
                                      >
                                        {product.isFavorite ? 
                                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> :
                                          <StarOff className="h-4 w-4 text-muted-foreground" />
                                        }
                                      </Button>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                          {t('last-order-date')}
                                        </label>
                                        <Input
                                          type="date"
                                          defaultValue={product.lastOrderDate?.toISOString().split('T')[0] || ''}
                                          onChange={(e) => updateProductLastOrderDate(product.id, e.target.value)}
                                          className="mt-1"
                                          disabled={currentInventory.isLocked}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                          {t('unit-price')} (€/{product.unit})
                                        </label>
                                        <Input
                                          type="number"
                                          placeholder="0.00"
                                          step="0.01"
                                          min="0"
                                          defaultValue={product.unitPrice || ''}
                                          onChange={(e) => updateProductPrice(product.id, parseFloat(e.target.value) || 0)}
                                          className="mt-1"
                                          disabled={currentInventory.isLocked}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                      {t('quantity')} ({product.unit})
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(product.id, -1)}
                                        disabled={currentInventory.isLocked || quantity <= 0}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={quantity || ''}
                                        onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                                        className="w-24 text-center"
                                        min="0"
                                        step="0.1"
                                        disabled={currentInventory.isLocked}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(product.id, 1)}
                                        disabled={currentInventory.isLocked}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Status Info */}
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">
                                        {t('current-stock')}:
                                      </span>
                                      <div className="text-lg font-semibold">
                                        {quantity} {product.unit}
                                      </div>
                                    </div>
                                    {product.unitPrice > 0 && quantity > 0 && (
                                      <div>
                                        <span className="text-sm font-medium text-muted-foreground">
                                          {t('total-value')}:
                                        </span>
                                        <div className="text-lg font-semibold text-primary">
                                          €{(quantity * product.unitPrice).toFixed(2)}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Additional Actions */}
                                  <div className="flex flex-col gap-2">
                                    {quantity > 0 && (
                                      <Badge variant="secondary" className="w-fit">
                                        {t('in-stock')}
                                      </Badge>
                                    )}
                                    {product.unitPrice === 0 && (
                                      <Badge variant="outline" className="w-fit">
                                        {t('price-needed')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {/* Save Button */}
              <div className="sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {currentInventory.items.filter(item => item.quantity > 0).length} {t('products-with-stock')}
                  </div>
                  <Button 
                    onClick={handleSaveInventory}
                    size="lg"
                    disabled={currentInventory.isLocked}
                    className="min-w-32"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {t('save-inventory')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};