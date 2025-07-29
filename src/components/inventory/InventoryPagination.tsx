import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  unitCost: number;
  location: string;
  supplier: string;
  minStock: number;
  maxStock: number;
  expiryDate?: Date;
}

interface InventoryPaginationProps {
  items: InventoryItem[];
  itemsPerPage?: number;
  onItemSelect?: (item: InventoryItem) => void;
}

export const InventoryPagination = ({ 
  items, 
  itemsPerPage = 20, 
  onItemSelect 
}: InventoryPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(items.map(item => item.category)))];
  }, [items]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const getStockStatus = (item: InventoryItem) => {
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
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
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
      </div>

      {/* Items grid */}
      <div className="grid gap-4">
        {currentItems.map((item) => {
          const stockStatus = getStockStatus(item);
          return (
            <Card 
              key={item.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                onItemSelect ? 'hover:bg-accent/50' : ''
              }`}
              onClick={() => onItemSelect?.(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStockColor(stockStatus)}`} />
                    <h3 className="font-medium">{item.name}</h3>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {item.currentStock} {item.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(item.unitCost)} per {item.unit}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-muted-foreground">{item.location}</div>
                  </div>
                  <div>
                    <div className="font-medium">Supplier</div>
                    <div className="text-muted-foreground">{item.supplier}</div>
                  </div>
                  <div>
                    <div className="font-medium">Stock Range</div>
                    <div className="text-muted-foreground">
                      {item.minStock} - {item.maxStock} {item.unit}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Expiry</div>
                    <div className="text-muted-foreground">
                      {item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};