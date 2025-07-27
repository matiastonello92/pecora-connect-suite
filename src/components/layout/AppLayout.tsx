import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { language } = useAuth();
  const { t } = useTranslation(language);

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