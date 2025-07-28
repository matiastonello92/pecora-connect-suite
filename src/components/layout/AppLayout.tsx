import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useTranslation } from '@/lib/i18n';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { LocationBlocker } from './LocationBlocker';
import { useLocation } from '@/context/LocationContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const language = 'en'; // Temporarily hardcode language
  const { t } = useTranslation(language);
  const { isLocationBlocked, suggestedLocation } = useLocation();
  const { isLoading } = useSimpleAuth();

  // Show loading spinner while authentication is in progress
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show location blocker if no valid location is set or if there's a suggested location
  if (isLocationBlocked || suggestedLocation) {
    return <LocationBlocker />;
  }

  return (
    <SidebarProvider>
      <UnreadMessagesProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            
            <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
              <div className="max-w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </UnreadMessagesProvider>
    </SidebarProvider>
  );
};