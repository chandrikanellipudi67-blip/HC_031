import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import codexLogo from '@/assets/codex-logo.png';
import ChatWidget from '@/components/ChatWidget';

interface DesktopLayoutProps {
  children: ReactNode;
}

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Top Header */}
          <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-card/95 backdrop-blur-sm">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="text-foreground" />
              
              <div className="flex items-center gap-3 flex-1">
                <div className="text-lg font-bold text-foreground">Medinet</div>
                <div className="hidden md:block">
                  <p className="text-sm text-muted-foreground">Healthcare Facility Finder</p>
                </div>
              </div>

              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
        <ChatWidget />
      </div>
    </SidebarProvider>
  );
};

export default DesktopLayout;
