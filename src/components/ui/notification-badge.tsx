import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  show?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'sm',
  className,
  show = true
}) => {
  if (!show || count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: 'h-4 w-4 text-[10px] min-w-[16px] px-1',
    md: 'h-5 w-5 text-xs min-w-[20px] px-1.5',
    lg: 'h-6 w-6 text-sm min-w-[24px] px-2'
  };

  return (
    <Badge
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center rounded-full',
        'bg-destructive text-destructive-foreground border-background border-2',
        'font-semibold leading-none',
        'animate-in fade-in duration-200 shadow-md',
        'z-10', // Ensure badge appears above other elements
        sizeClasses[size],
        className
      )}
    >
      {displayCount}
    </Badge>
  );
};