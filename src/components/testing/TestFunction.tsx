import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

/**
 * Test Function Component for Detection System Testing
 * This is a new component to test the automatic detection system
 */
export const TestDetectionFunction = () => {
  const handleTestClick = () => {
    console.log('Test detection function executed');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Test Detection Function
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This is a new test function that should be automatically detected by the change detection system.
        </p>
        <Button onClick={handleTestClick} className="w-full">
          Execute Test Function
        </Button>
      </CardContent>
    </Card>
  );
};

// Additional test hook for detection
export const useTestDetectionHook = () => {
  const [testState, setTestState] = React.useState('idle');
  
  const runTest = React.useCallback(() => {
    setTestState('running');
    setTimeout(() => setTestState('completed'), 1000);
  }, []);

  return { testState, runTest };
};