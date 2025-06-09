
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useRef } from 'react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {

  const navigate = useNavigate();
  const loginEmailRef = useRef<HTMLInputElement>(null);
const loginPasswordRef = useRef<HTMLInputElement>(null);

const signupNameRef = useRef<HTMLInputElement>(null);
const signupEmailRef = useRef<HTMLInputElement>(null);
const signupPasswordRef = useRef<HTMLInputElement>(null);

const [isLoading, setIsLoading] = useState(false);
const [tab, setTab] = useState<'login' | 'signup'>('login');


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    let response;
    if (tab === 'login') {
      const email = loginEmailRef.current?.value || '';
      const password = loginPasswordRef.current?.value || '';

      response = await fetch(`${import.meta.env.API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } else {
      const name = signupNameRef.current?.value || '';
      const email = signupEmailRef.current?.value || '';
      const password = signupPasswordRef.current?.value || '';

      response = await fetch(`${import.meta.env.API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
    }

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    localStorage.setItem('token', data.token);

    toast({
      title: 'Success!',
      description: tab === 'login' ? 'Logged in successfully!' : 'Account created!',
    });

    if (tab === 'login') navigate('/dashboard');
    onOpenChange(false);
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-center text-expense-blue-dark dark:text-expense-blue">
            Welcome to Expense Planner
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(val) => setTab(val as 'login' | 'signup')} className="w-full">

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
  id="email"
  type="email"
  placeholder="Enter your email"
  ref={loginEmailRef}
  required
/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
  id="password"
  type="password"
  placeholder="Enter your password"
  ref={loginPasswordRef}
  required
/>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-expense-blue hover:bg-expense-blue-dark"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
  id="name"
  type="text"
  placeholder="Enter your full name"
  ref={signupNameRef}
  required
/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
  id="signup-email"
  type="email"
  placeholder="Enter your email"
  ref={signupEmailRef}
  required
/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
  id="signup-password"
  type="password"
  placeholder="Create a password"
  ref={signupPasswordRef}
  required
/>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-expense-blue hover:bg-expense-blue-dark"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
