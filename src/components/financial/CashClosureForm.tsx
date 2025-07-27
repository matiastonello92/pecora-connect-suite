import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useFinancial } from '@/context/FinancialContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Star, Save, Send, Euro, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { SatisfactionRating } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';

export const CashClosureForm = () => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const { t } = useTranslation(language);
  const { toast } = useToast();
  const {
    currentClosure,
    createNewClosure,
    updateCurrentClosure,
    submitClosure,
    calculateTotalCovers
  } = useFinancial();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentClosure) {
      createNewClosure();
    }
  }, [currentClosure, createNewClosure]);

  const handleInputChange = (field: string, value: number | string) => {
    updateCurrentClosure({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSatisfactionChange = (rating: SatisfactionRating) => {
    updateCurrentClosure({ satisfactionRating: rating });
    
    // Clear satisfaction comment if rating is 4 or 5
    if (rating >= 4 && currentClosure?.satisfactionComment) {
      updateCurrentClosure({ satisfactionComment: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!currentClosure?.cashCollected && currentClosure?.cashCollected !== 0) {
      newErrors.cashCollected = 'Cash collected is required';
    }
    if (!currentClosure?.lightspeedPayments && currentClosure?.lightspeedPayments !== 0) {
      newErrors.lightspeedPayments = 'Lightspeed payments is required';
    }
    if (!currentClosure?.satispayPayments && currentClosure?.satispayPayments !== 0) {
      newErrors.satispayPayments = 'Satispay payments is required';
    }
    if (!currentClosure?.carteBleueManual && currentClosure?.carteBleueManual !== 0) {
      newErrors.carteBleueManual = 'Carte Bleue manual is required';
    }
    if (!currentClosure?.customerCredit && currentClosure?.customerCredit !== 0) {
      newErrors.customerCredit = 'Customer credit is required';
    }

    // Gift vouchers comment validation
    if ((currentClosure?.giftVouchers || 0) > 0 && !currentClosure?.giftVouchersComment?.trim()) {
      newErrors.giftVouchersComment = 'Comment is required when gift vouchers amount is entered';
    }

    // Other payments comment validation
    if ((currentClosure?.otherPayments || 0) > 0 && !currentClosure?.otherPaymentsComment?.trim()) {
      newErrors.otherPaymentsComment = 'Comment is required when other payments amount is entered';
    }

    // Covers validation
    if (!currentClosure?.lunchCovers && currentClosure?.lunchCovers !== 0) {
      newErrors.lunchCovers = 'Lunch covers is required';
    }
    if (!currentClosure?.afternoonCovers && currentClosure?.afternoonCovers !== 0) {
      newErrors.afternoonCovers = 'Afternoon covers is required';
    }
    if (!currentClosure?.dinnerCovers && currentClosure?.dinnerCovers !== 0) {
      newErrors.dinnerCovers = 'Dinner covers is required';
    }

    // Satisfaction rating validation
    if (!currentClosure?.satisfactionRating) {
      newErrors.satisfactionRating = 'Satisfaction rating is required';
    }

    // Satisfaction comment validation for low ratings
    if ((currentClosure?.satisfactionRating || 0) <= 3 && !currentClosure?.satisfactionComment?.trim()) {
      newErrors.satisfactionComment = 'Comment is required for satisfaction rating of 3 or below';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    updateCurrentClosure({ status: 'draft' });
    toast({
      title: "Draft Saved",
      description: "Your cash closure has been saved as draft.",
    });
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      });
    }
  };

  const confirmSubmit = () => {
    submitClosure();
    setShowConfirmDialog(false);
    toast({
      title: "Cash Closure Submitted",
      description: "Your cash closure has been submitted and notifications sent to management.",
    });
  };

  const totalPayments = (currentClosure?.cashCollected || 0) +
    (currentClosure?.lightspeedPayments || 0) +
    (currentClosure?.satispayPayments || 0) +
    (currentClosure?.carteBleueManual || 0) +
    (currentClosure?.customerCredit || 0) +
    (currentClosure?.giftVouchers || 0) +
    (currentClosure?.otherPayments || 0);

  if (!currentClosure) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Daily Cash Closure
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Date: {new Date().toLocaleDateString(language)}
              </p>
            </div>
            <Badge variant={currentClosure.status === 'draft' ? 'secondary' : 'default'}>
              {currentClosure.status?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Collections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cashCollected">Cash Collected *</Label>
                <Input
                  id="cashCollected"
                  type="number"
                  step="0.01"
                  value={currentClosure.cashCollected || ''}
                  onChange={(e) => handleInputChange('cashCollected', parseFloat(e.target.value) || 0)}
                  className={errors.cashCollected ? 'border-red-500' : ''}
                />
                {errors.cashCollected && <p className="text-sm text-red-500 mt-1">{errors.cashCollected}</p>}
              </div>

              <div>
                <Label htmlFor="lightspeedPayments">Lightspeed Payments *</Label>
                <Input
                  id="lightspeedPayments"
                  type="number"
                  step="0.01"
                  value={currentClosure.lightspeedPayments || ''}
                  onChange={(e) => handleInputChange('lightspeedPayments', parseFloat(e.target.value) || 0)}
                  className={errors.lightspeedPayments ? 'border-red-500' : ''}
                />
                {errors.lightspeedPayments && <p className="text-sm text-red-500 mt-1">{errors.lightspeedPayments}</p>}
              </div>

              <div>
                <Label htmlFor="satispayPayments">Satispay Payments *</Label>
                <Input
                  id="satispayPayments"
                  type="number"
                  step="0.01"
                  value={currentClosure.satispayPayments || ''}
                  onChange={(e) => handleInputChange('satispayPayments', parseFloat(e.target.value) || 0)}
                  className={errors.satispayPayments ? 'border-red-500' : ''}
                />
                {errors.satispayPayments && <p className="text-sm text-red-500 mt-1">{errors.satispayPayments}</p>}
              </div>

              <div>
                <Label htmlFor="carteBleueManual">Carte Bleue (Manual) *</Label>
                <Input
                  id="carteBleueManual"
                  type="number"
                  step="0.01"
                  value={currentClosure.carteBleueManual || ''}
                  onChange={(e) => handleInputChange('carteBleueManual', parseFloat(e.target.value) || 0)}
                  className={errors.carteBleueManual ? 'border-red-500' : ''}
                />
                {errors.carteBleueManual && <p className="text-sm text-red-500 mt-1">{errors.carteBleueManual}</p>}
              </div>

              <div>
                <Label htmlFor="customerCredit">Customer Credit (Invoices) *</Label>
                <Input
                  id="customerCredit"
                  type="number"
                  step="0.01"
                  value={currentClosure.customerCredit || ''}
                  onChange={(e) => handleInputChange('customerCredit', parseFloat(e.target.value) || 0)}
                  className={errors.customerCredit ? 'border-red-500' : ''}
                />
                {errors.customerCredit && <p className="text-sm text-red-500 mt-1">{errors.customerCredit}</p>}
              </div>

              <div>
                <Label htmlFor="giftVouchers">Gift Vouchers</Label>
                <Input
                  id="giftVouchers"
                  type="number"
                  step="0.01"
                  value={currentClosure.giftVouchers || ''}
                  onChange={(e) => handleInputChange('giftVouchers', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {(currentClosure.giftVouchers || 0) > 0 && (
              <div>
                <Label htmlFor="giftVouchersComment">Gift Vouchers Comment *</Label>
                <Textarea
                  id="giftVouchersComment"
                  value={currentClosure.giftVouchersComment || ''}
                  onChange={(e) => handleInputChange('giftVouchersComment', e.target.value)}
                  placeholder="Required when gift vouchers amount is entered"
                  className={errors.giftVouchersComment ? 'border-red-500' : ''}
                />
                {errors.giftVouchersComment && <p className="text-sm text-red-500 mt-1">{errors.giftVouchersComment}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="otherPayments">Other Payment Methods</Label>
              <Input
                id="otherPayments"
                type="number"
                step="0.01"
                value={currentClosure.otherPayments || ''}
                onChange={(e) => handleInputChange('otherPayments', parseFloat(e.target.value) || 0)}
              />
            </div>

            {(currentClosure.otherPayments || 0) > 0 && (
              <div>
                <Label htmlFor="otherPaymentsComment">Other Payments Comment *</Label>
                <Textarea
                  id="otherPaymentsComment"
                  value={currentClosure.otherPaymentsComment || ''}
                  onChange={(e) => handleInputChange('otherPaymentsComment', e.target.value)}
                  placeholder="Required when other payments amount is entered"
                  className={errors.otherPaymentsComment ? 'border-red-500' : ''}
                />
                {errors.otherPaymentsComment && <p className="text-sm text-red-500 mt-1">{errors.otherPaymentsComment}</p>}
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Payments:</span>
                <span className="text-xl font-bold">€{totalPayments.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Covers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Number of Covers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lunchCovers">Lunch *</Label>
                <Input
                  id="lunchCovers"
                  type="number"
                  value={currentClosure.lunchCovers || ''}
                  onChange={(e) => handleInputChange('lunchCovers', parseInt(e.target.value) || 0)}
                  className={errors.lunchCovers ? 'border-red-500' : ''}
                />
                {errors.lunchCovers && <p className="text-sm text-red-500 mt-1">{errors.lunchCovers}</p>}
              </div>

              <div>
                <Label htmlFor="afternoonCovers">Afternoon *</Label>
                <Input
                  id="afternoonCovers"
                  type="number"
                  value={currentClosure.afternoonCovers || ''}
                  onChange={(e) => handleInputChange('afternoonCovers', parseInt(e.target.value) || 0)}
                  className={errors.afternoonCovers ? 'border-red-500' : ''}
                />
                {errors.afternoonCovers && <p className="text-sm text-red-500 mt-1">{errors.afternoonCovers}</p>}
              </div>

              <div>
                <Label htmlFor="dinnerCovers">Dinner *</Label>
                <Input
                  id="dinnerCovers"
                  type="number"
                  value={currentClosure.dinnerCovers || ''}
                  onChange={(e) => handleInputChange('dinnerCovers', parseInt(e.target.value) || 0)}
                  className={errors.dinnerCovers ? 'border-red-500' : ''}
                />
                {errors.dinnerCovers && <p className="text-sm text-red-500 mt-1">{errors.dinnerCovers}</p>}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Covers:</span>
                <span className="text-xl font-bold">{currentClosure.totalCovers || 0}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes & Comments</Label>
            <Textarea
              id="notes"
              value={currentClosure.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Optional notes about the day..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Satisfaction Rating */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Satisfaction Rating *
            </h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={currentClosure.satisfactionRating === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSatisfactionChange(rating as SatisfactionRating)}
                  className="flex items-center gap-1"
                >
                  <Star className={`h-4 w-4 ${currentClosure.satisfactionRating === rating ? 'fill-current' : ''}`} />
                  {rating}
                </Button>
              ))}
            </div>
            {errors.satisfactionRating && <p className="text-sm text-red-500">{errors.satisfactionRating}</p>}

            {(currentClosure.satisfactionRating || 0) <= 3 && (
              <div>
                <Label htmlFor="satisfactionComment">
                  Satisfaction Comment * 
                  <span className="text-sm text-muted-foreground ml-2">
                    (Required for rating of 3 or below)
                  </span>
                </Label>
                <Textarea
                  id="satisfactionComment"
                  value={currentClosure.satisfactionComment || ''}
                  onChange={(e) => handleInputChange('satisfactionComment', e.target.value)}
                  placeholder="Please explain why the satisfaction rating is low..."
                  className={errors.satisfactionComment ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.satisfactionComment && <p className="text-sm text-red-500 mt-1">{errors.satisfactionComment}</p>}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleSubmit}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Closure
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Confirm Submission
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit this cash closure? Once submitted, the report will be locked and cannot be edited without administrator approval. Notifications will be sent to management.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmSubmit}>
                    Submit Closure
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
