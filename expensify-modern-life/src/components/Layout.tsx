
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { LoginModal } from './LoginModal';

interface LayoutProps {
  children: React.ReactNode;
  showAuthButton?: boolean;
}

export function Layout({ children, showAuthButton = false }: LayoutProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (showAuthButton) {
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAuthButton]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {!showAuthButton && <AppSidebar />}
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              {!showAuthButton && <SidebarTrigger />}
              <h1 className="text-xl font-bold text-expense-blue-dark dark:text-expense-blue">
                Expense Planner
              </h1>
            </div>
            
            {showAuthButton && (
              <Button 
                onClick={() => setShowLoginModal(true)}
                className="bg-expense-blue hover:bg-expense-blue-dark text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </header>

          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>

          <footer className="bg-card border-t py-4 text-center text-sm text-muted-foreground">
            © 2025 Expense Planner
          </footer>
        </div>
      </div>

      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </SidebarProvider>
  );
}
