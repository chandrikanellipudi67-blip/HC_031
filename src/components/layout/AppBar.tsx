import { useState } from 'react';
import { HambergerMenu } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import SideMenu from './SideMenu';

const AppBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary via-primary to-accent backdrop-blur-sm border-b border-border/50 shadow-lg">
        <div className="flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/20 transition-colors"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <HambergerMenu size={24} />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-primary-foreground">Medinet</div>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default AppBar;
