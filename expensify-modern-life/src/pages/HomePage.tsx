import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Layout showAuthButton={true}>
      <div className="min-h-screen gradient-bg flex items-center justify-center relative">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <div className="text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              Expense Planner
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Take control of your finances with our intuitive expense tracking and savings management platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
            <div className="relative group bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 overflow-hidden">
              {/* Animated color shadow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm animate-pulse"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-spin-slow"></div>
              
              {/* Card content */}
              <div className="relative bg-card/90 backdrop-blur-md p-6 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/25 group-hover:shadow-pink-500/50 transition-all duration-300">
                  <span className="text-white text-xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Track Expenses
                </h3>
                <p className="text-muted-foreground">
                  Monitor your daily, weekly, and monthly spending with detailed categorization.
                </p>
              </div>
            </div>
            
            <div className="relative group bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 overflow-hidden">
              {/* Animated color shadow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm animate-pulse"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-spin-slow"></div>
              
              {/* Card content */}
              <div className="relative bg-card/90 backdrop-blur-md p-6 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/50 transition-all duration-300">
                  <span className="text-white text-xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Manage Savings
                </h3>
                <p className="text-muted-foreground">
                  Set savings goals and track your progress with visual indicators.
                </p>
              </div>
            </div>
            
            <div className="relative group bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 overflow-hidden">
              {/* Animated color shadow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm animate-pulse"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-spin-slow"></div>
              
              {/* Card content */}
              <div className="relative bg-card/90 backdrop-blur-md p-6 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/50 transition-all duration-300">
                  <span className="text-white text-xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Financial Insights
                </h3>
                <p className="text-muted-foreground">
                  Get detailed analytics and insights about your spending patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </Layout>
  );
}