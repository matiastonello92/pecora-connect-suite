import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FlexLayoutProps {
  children: ReactNode;
  direction?: 'row' | 'col';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: boolean;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
};

const justifyClasses = {
  start: 'justify-start',
  end: 'justify-end', 
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
};

const alignClasses = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center', 
  baseline: 'items-baseline',
  stretch: 'items-stretch'
};

export const FlexLayout = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'md',
  className = ""
}: FlexLayoutProps) => {
  const classes = cn(
    'flex',
    direction === 'col' ? 'flex-col' : 'flex-row',
    justifyClasses[justify],
    alignClasses[align],
    wrap && 'flex-wrap',
    gapClasses[gap],
    className
  );

  return (
    <div className={classes}>
      {children}
    </div>
  );
};