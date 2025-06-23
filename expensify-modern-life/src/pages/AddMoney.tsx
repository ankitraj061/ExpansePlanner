import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext'; // Adjust path as needed

type IncomeType = {
  id: number;
  user_id: number;
  amount: number;
  income_type: string;
  description: string;
  date: string;
};

type DecodedToken = {
  id: number;
  // Add any other properties if needed
};

const incomeTypes = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'business', label: 'Business' },
  { value: 'investment', label: 'Investment' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' }
];

export default function AddMoney() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [recentIncomes, setRecentIncomes] = useState<IncomeType[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState(true);

  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  

  useEffect(() => {
    if (!userId) return;
    const fetchRecent = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/income/${userId}/recent`);
        const data = await res.json();
        setRecentIncomes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching recent incomes:", err);
        setRecentIncomes([]);
      } finally {
        setLoadingIncomes(false);
      }
    };
    fetchRecent();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !type) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          amount: parseFloat(amount),
          income_type: type,
          description,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!res.ok) throw new Error('Failed to add income');

      toast({
        title: "Success!",
        description: "Income added successfully",
      });

      // Reset form
      setAmount('');
      setDescription('');
      setType('');

      // Refresh recent incomes
      const updatedRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/income/${userId}/recent`);
      const updatedData = await updatedRes.json();
      setRecentIncomes(Array.isArray(updatedData) ? updatedData : []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add income",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className=" mx-6 mb-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="">
          <h1 className="text-3xl font-bold text-primary">
            Add Money
          </h1>
          <p className="text-expense-blue-dark dark:text-expense-gray mt-2">
            Record your income to track your total money
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-expense-navy dark:text-expense-light">
                Income Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Income Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeTypes.map((incomeType) => (
                          <SelectItem key={incomeType.value} value={incomeType.value}>
                            {incomeType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Description of income source"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-expense-blue hover:bg-expense-blue-dark"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding Income..." : "Add Income"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Income History */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-expense-navy dark:text-expense-light">
                Recent Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingIncomes ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-muted-foreground">Loading recent incomes...</p>
                </div>
              ) : recentIncomes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent income records found</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first income above!</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                  {recentIncomes.map((income) => (
                    <div
                      key={income.id}
                      className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {income.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {new Date(income.date).toLocaleDateString()}
                          </p>
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full capitalize">
                            {income.income_type}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          +₹{income.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}