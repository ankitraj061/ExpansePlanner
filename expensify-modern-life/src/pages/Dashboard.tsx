import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import Insights from '@/components/Insights';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [allTimeExpenses, setAllTimeExpenses] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [expenses, setExpenses] = useState({
    today: 0,
    week: 0,
    month: 0,
  });

  const [monthlyChart, setMonthlyChart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);

  const stats = {
    savingsGoal: 10000,
    currentSavings: 3500,
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check authentication status first
  useEffect(() => {
    async function checkAuthAndGetUser() {
      try {
        // Check if user is authenticated and get user info
        const authResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/middleware/authenticate`, {
          credentials: 'include',
        });

        if (!authResponse.ok) {
          // Not authenticated, redirect to login
          navigate('/login');
          return;
        }

        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
          // Not authenticated, redirect to login
          navigate('/login');
          return;
        }

        // Set user ID from the auth response
        setUserId(authData.user.id);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        toast({
          title: 'Authentication Error',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndGetUser();
  }, [navigate]);

  useEffect(() => {
    if (userId === null || loading) return;

    async function fetchDashboardData() {
      try {
        console.log('Fetching dashboard data for user ID:', userId);
        
        const [incomeRes, summaryRes, chartRes, categoriesRes, allExpensesRes, dailyTrendRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/income/total/${userId}`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/summary/${userId}`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/monthly/${userId}`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/categories/${userId}`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/total/${userId}`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/daily-trend/${userId}`, {
            credentials: 'include',
          }),
        ]);

        // Check if any request failed due to authentication
        const responses = [incomeRes, summaryRes, chartRes, categoriesRes, allExpensesRes, dailyTrendRes];
        const failedAuth = responses.find(res => res.status === 401);
        
        if (failedAuth) {
          toast({
            title: 'Session Expired',
            description: 'Please log in again.',
            variant: 'destructive',
          });
          navigate('/login');
          return;
        }

        // Check if any request failed
        const failedRequest = responses.find(res => !res.ok);
        if (failedRequest) {
          throw new Error(`Request failed with status: ${failedRequest.status}`);
        }

        const incomeData = await incomeRes.json();
        const summary = await summaryRes.json();
        const chartData = await chartRes.json();
        const catData = await categoriesRes.json();
        const allExpensesData = await allExpensesRes.json();
        const dailyTrendData = await dailyTrendRes.json();

        setTotalIncome(parseFloat(incomeData.totalIncome) || 0);
        setTotalExpenses(parseFloat(summary.month) || 0);
        setAllTimeExpenses(parseFloat(allExpensesData.totalExpenses) || 0);
        setExpenses(summary);
        setMonthlyChart(chartData);
        console.log('Raw Monthly Chart Data from API:', chartData);
        
        // Process daily trend data to ensure proper formatting
        console.log('Raw Daily Trend Data from API:', dailyTrendData);
        
        setDailyTrend(dailyTrendData);

        setCategories(
          catData.map((c: any, idx: number) => ({
            name: c.category,
            value: parseFloat(c.value),
            color: ['#1c2b34', '#3e6573', '#6aaed8', '#94bbc7', '#b2ccd7'][idx % 5],
          }))
        );
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      }
    }

    fetchDashboardData();
  }, [userId, loading, navigate]);

  const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "#3e6573",
    },
    income: {
      label: "Income",
      color: "#6aaed8",
    },
  };

  const currentMoney = Number(totalIncome) - Number(allTimeExpenses);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="mx-4 sm:mx-6 mb-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Insights forceShow={true}/>
      <div className="mx-4 sm:mx-6 mb-6 space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overview of your financial status</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Current Money</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-2xl font-bold">₹{currentMoney.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-2xl font-bold">₹{allTimeExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Today's Expenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-2xl font-bold text-primary">₹{expenses.today}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Weekly Expenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-2xl font-bold text-primary">₹{expenses.week}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-2xl font-bold text-primary">₹{expenses.month}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[150px] sm:h-[200px]">
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[180px] sm:h-[230px]">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={isMobile ? 55 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      isMobile 
                        ? `${(percent * 100).toFixed(0)}%` 
                        : `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[150px] sm:h-[200px]">
                <LineChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="var(--color-expenses)" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Daily Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[150px] sm:h-[200px]">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: isMobile ? 8 : 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={isMobile ? 50 : 60}
                    interval={isMobile ? 3 : 2}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => `Day: ${value}`}
                    formatter={(value, name) => [`${String(value)}`, 'Expenses']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="var(--color-expenses)" 
                    strokeWidth={2}
                    dot={{ r: isMobile ? 2 : 4 }}
                    activeDot={{ r: isMobile ? 4 : 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}