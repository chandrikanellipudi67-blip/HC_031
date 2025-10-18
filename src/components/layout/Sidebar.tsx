import { useLocation, useNavigate } from 'react-router-dom';
import { Home2, Heart, Call, User, Category, Login, Logout } from 'iconsax-react';
import { Hospital as LucideHospital, FileText, QrCode, UserPlus, Calendar as LucideCalendar, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import codexLogo from '@/assets/codex-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const mainNavItems = [
    { path: '/', icon: Home2, label: t('nav.home') },
      { path: '/phr/login', icon: Category, label: 'PHR' },
      { path: '/phr/chat', icon: Call, label: 'Ask AI' },
    { path: '/categories', icon: Category, label: t('nav.categories') },
    { path: '/favorites', icon: Heart, label: t('nav.favorites') },
    { path: '/emergency', icon: Call, label: t('nav.emergency') },
  ];

  const phrItems = [
    { path: '/phr/patient', icon: LucideHospital, label: 'My Records' },
    { path: '/phr/doctor', icon: UserPlus, label: 'Doctor Dashboard' },
    { path: '/phr/add', icon: FileText, label: 'Add Record' },
    { path: '/phr/reminders', icon: LucideCalendar, label: 'Reminders' },
    { path: '/phr/export', icon: FileText, label: 'Export / PDF' },
    { path: '/phr/qr', icon: QrCode, label: 'QR Health Card' },
    { path: '/phr/find-provider', icon: MapPin, label: 'Find Provider' },
    { path: '/phr/chat', icon: Call, label: 'Assistant Chat' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-primary">Medinet</div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Healthcare Finder</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      onClick={() => navigate(item.path)}
                      className={active ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <Icon size={20} variant={active ? 'Bold' : 'Outline'} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel>PHR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {phrItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton onClick={() => navigate(item.path)}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/profile')}
                  className={isActive('/profile') ? 'bg-accent text-accent-foreground' : ''}
                >
                  <User size={20} variant={isActive('/profile') ? 'Bold' : 'Outline'} />
                  <span>{t('nav.profile')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground px-2">
              <p className="font-medium text-foreground truncate">{user.email}</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <Logout size={16} />
              {t('auth.logout')}
            </Button>
          </div>
        ) : (
          <Button 
            variant="default" 
            className="w-full justify-start gap-2"
            onClick={() => navigate('/auth')}
          >
            <Login size={16} />
            {t('auth.login')}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
