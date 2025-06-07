import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  id: number;
};

export default function Dashboard() {
  const [userId, setUserId] = useState<number | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [allTimeExpenses, setAllTimeExpenses] = useState(0);

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
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.id);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (userId === null) return;

    async function fetchDashboardData() {
      try {
        console.log('Fetching dashboard data for user ID:', userId);
        
        const [incomeRes, summaryRes, chartRes, categoriesRes, allExpensesRes, dailyTrendRes] = await Promise.all([
          fetch(`http://localhost:8000/api/income/total/${userId}`),
          fetch(`http://localhost:8000/api/expenses/summary/${userId}`),
          fetch(`http://localhost:8000/api/expenses/monthly/${userId}`),
          fetch(`http://localhost:8000/api/expenses/categories/${userId}`),
          fetch(`http://localhost:8000/api/expenses/total/${userId}`),
          fetch(`http://localhost:8000/api/expenses/daily-trend/${userId}`),
        ]);

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
      }
    }

    fetchDashboardData();
  }, [userId]);

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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial status</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Money</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{currentMoney.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{allTimeExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{expenses.today}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weekly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{expenses.week}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{expenses.month}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[230px]">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
              <CardTitle>Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <LineChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={2}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => `Day: ${value}`}
                    formatter={(value, name) => [`${parseFloat(value).toFixed(2)}`, 'Expenses']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="var(--color-expenses)" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
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