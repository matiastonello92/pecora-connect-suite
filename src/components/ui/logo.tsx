import { cn } from "@/lib/utils";
import logoImage from "@/assets/pecora-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-24 w-24"
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl", 
  xl: "text-4xl"
};

export const Logo = ({ className, showText = true, size = "md" }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src={logoImage} 
        alt="PecoraNegra Logo" 
        className={cn("object-contain", sizeClasses[size])}
      />
      {showText && (
        <div className="flex flex-col">
          <h1 className={cn(
            "font-playfair font-bold text-primary tracking-wide",
            textSizeClasses[size]
          )}>
            LA PECORANEGRA
          </h1>
          <p className="text-xs text-muted-foreground font-inter uppercase tracking-wider">
            Restaurant Management
          </p>
        </div>
      )}
    </div>
  );
};