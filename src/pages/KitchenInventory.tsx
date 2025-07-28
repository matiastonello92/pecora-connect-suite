import React, { useState } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useKitchenInventory } from '@/context/KitchenInventoryContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  ChefHat, 
  Save, 
  Star, 
  StarOff, 
  Plus, 
  Minus, 
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react';
import { KitchenCategory, KitchenProduct } from '@/types/kitchenInventory';

export const KitchenInventory = () => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const hasPermission = (permission: string) => true; // Temporarily allow all permissions
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

  const [dailyInventoryData, setDailyInventoryData] = useState<Record<string, { quantity: number; missing: boolean }>>({});
  const [activeTab, setActiveTab] = useState('monthly');
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
  const hasKitchenAccess = true; // Simplified for now - will need proper permission check
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

  const updateDailyQuantity = (productId: string, quantity: number) => {
    setDailyInventoryData(prev => ({
      ...prev,
      [productId]: { ...prev[productId], quantity }
    }));
  };

  const toggleMissingProduct = (productId: string, missing: boolean) => {
    setDailyInventoryData(prev => ({
      ...prev,
      [productId]: { ...prev[productId], missing, quantity: prev[productId]?.quantity || 0 }
    }));
  };

  const handleSubmitDailyInventory = () => {
    const hasData = Object.values(dailyInventoryData).some(item => item.quantity > 0 || item.missing);
    
    if (!hasData) {
      toast({
        title: t('validation-error'),
        description: t('daily-inventory-validation-message'),
        variant: "destructive",
      });
      return;
    }

    // Save daily inventory with timestamp
    const dailyRecord = {
      id: `daily-${Date.now()}`,
      date: new Date(),
      data: dailyInventoryData,
      submittedBy: user?.email || 'current@user.com'
    };
    
    // In a real app, this would save to backend
    localStorage.setItem(`dailyInventory-${new Date().toISOString().split('T')[0]}`, JSON.stringify(dailyRecord));
    
    toast({
      title: t('daily-inventory-saved'),
      description: t('daily-inventory-saved-message'),
    });
    
    setDailyInventoryData({});
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

      {hasKitchenAccess && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('monthly-inventory')}
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('daily-inventory')}
            </TabsTrigger>
          </TabsList>

          {/* Monthly Inventory Tab */}
          <TabsContent value="monthly">
            {!isInventoryPeriod && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  {t('inventory-period-message')}
                </AlertDescription>
              </Alert>
            )}
            {/* Monthly Inventory Content - Existing Logic */}
            {isInventoryPeriod && !currentInventory && (
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
          </TabsContent>

          {/* Daily Inventory Tab */}
          <TabsContent value="daily">
            <div className="space-y-6">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {t('daily-inventory-description')}
                </AlertDescription>
              </Alert>

              {/* Daily Inventory Product List */}
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
                          const dailyData = dailyInventoryData[product.id] || { quantity: 0, missing: false };
                          
                          return (
                            <Card key={product.id} className="border border-border/40">
                              <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    <div className="flex items-center gap-4">
                                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Switch
                                          checked={dailyData.missing}
                                          onCheckedChange={(checked) => toggleMissingProduct(product.id, checked)}
                                        />
                                        {t('missing-product')}
                                      </label>
                                    </div>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                      {t('current-stock')} ({product.unit})
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateDailyQuantity(product.id, Math.max(0, dailyData.quantity - 1))}
                                        disabled={dailyData.quantity <= 0}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={dailyData.quantity || ''}
                                        onChange={(e) => updateDailyQuantity(product.id, parseFloat(e.target.value) || 0)}
                                        className="w-24 text-center"
                                        min="0"
                                        step="0.1"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateDailyQuantity(product.id, dailyData.quantity + 1)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <div className="flex flex-col gap-2">
                                    {dailyData.missing && (
                                      <Badge variant="destructive" className="w-fit">
                                        {t('missing')}
                                      </Badge>
                                    )}
                                    {dailyData.quantity > 0 && !dailyData.missing && (
                                      <Badge variant="secondary" className="w-fit">
                                        {t('available')}
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

              {/* Submit Daily Inventory Button */}
              <div className="sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {Object.values(dailyInventoryData).filter(item => item.quantity > 0 || item.missing).length} {t('products-recorded')}
                  </div>
                  <Button 
                    onClick={handleSubmitDailyInventory}
                    size="lg"
                    className="min-w-32"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {t('submit-daily-inventory')}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};