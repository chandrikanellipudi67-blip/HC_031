import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home2, Heart, Call, User } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import AppBar from './AppBar';
import ChatWidget from '@/components/ChatWidget';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home2, label: t('nav.home') },
    { path: '/favorites', icon: Heart, label: t('nav.favorites') },
    { path: '/emergency', icon: Call, label: t('nav.emergency') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      {/* App Bar */}
      <AppBar />
      
      {/* Main content */}
      <main className="pb-20">{children}</main>

      {/* Bottom navigation with gradient effect */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-lg safe-bottom">
        <div className="flex items-center justify-around h-20 px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-1 px-3 rounded-none transition-all ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={26} variant={isActive ? 'Bold' : 'Outline'} />
                <span className="text-[12px] font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
      <ChatWidget />
    </div>
  );
};

export default MobileLayout;