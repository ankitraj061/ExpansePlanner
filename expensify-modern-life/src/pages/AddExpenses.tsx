import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';


type ExpenseType = {
  id: number;
  user_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
};

type DecodedToken = {
  id: number;
  // Add any other properties if needed
};

const categories = [
  { value: 'food', label: 'Food' },
  { value: 'clothes', label: 'Clothes' },
  { value: 'travel', label: 'Travel' },
  { value: 'education', label: 'Education' },
  { value: 'party', label: 'Party' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' }
];

export default function AddExpenses() {
  // Form state
  const [date, setDate] = useState<Date>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Expense history state
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [editingExpense, setEditingExpense] = useState<number | null>(null);
  const [editedExpenseData, setEditedExpenseData] = useState<{
    description: string;
    amount: string;
    category: string;
  }>({
    description: '',
    amount: '',
    category: ''
  });

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

  // Fetch expenses when userId is available
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!userId) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({ title: 'Error', description: 'No auth token found' });
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpenses(res.data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to load expenses'
        });
      }
    };

    fetchExpenses();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !amount || !description || !category) {
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_UR}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          amount: parseFloat(amount),
          category,
          description,
          date: format(date, "yyyy-MM-dd")
        })
      });

      if (!res.ok) throw new Error("Failed to add expense");

      const newExpense = await res.json();

      toast({
        title: "Success!",
        description: "Expense added successfully",
      });

      // Reset form
      setDate(undefined);
      setAmount('');
      setDescription('');
      setCategory('');

      // Refresh expenses list
      const token = localStorage.getItem('token');
      if (token) {
        const updatedRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpenses(updatedRes.data);
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExpense = (expense: ExpenseType) => {
    setEditingExpense(expense.id);
    setEditedExpenseData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category
    });
  };

  const handleSaveExpense = async (expenseId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Error', description: 'No auth token found' });
        return;
      }

      // Validate input data
      if (!editedExpenseData.description.trim()) {
        toast({ title: 'Error', description: 'Description cannot be empty' });
        return;
      }

      const amountValue = parseFloat(editedExpenseData.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        toast({ title: 'Error', description: 'Please enter a valid amount greater than 0' });
        return;
      }

      if (!editedExpenseData.category) {
        toast({ title: 'Error', description: 'Please select a category' });
        return;
      }

      setIsLoading(true);

      // Update expense in backend
      const updateData = {
        description: editedExpenseData.description.trim(),
        amount: amountValue,
        category: editedExpenseData.category
      };

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/expenses/${expenseId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state with the updated expense
      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === expenseId
            ? { ...expense, ...updateData }
            : expense
        )
      );

      toast({
        title: 'Success!',
        description: 'Expense updated successfully'
      });
      
      setEditingExpense(null);
      setEditedExpenseData({ description: '', amount: '', category: '' });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update expense'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditedExpenseData({ description: '', amount: '', category: '' });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-green-100 text-green-800',
      clothes: 'bg-purple-100 text-purple-800',
      travel: 'bg-blue-100 text-blue-800',
      education: 'bg-yellow-100 text-yellow-800',
      party: 'bg-pink-100 text-pink-800',
      furniture: 'bg-gray-100 text-gray-800',
      other: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-expense-navy dark:text-expense-light">
            Add Expense
          </h1>
          <p className="text-expense-blue-dark dark:text-expense-gray">
            Record your expenses and manage your spending history
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add Expense Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-expense-navy dark:text-expense-light">
                New Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What did you spend on?"
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
                  {isLoading ? "Adding Expense..." : "Add Expense"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Expense History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-expense-navy dark:text-expense-light">
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No expenses found.</p>
                ) : (
                  expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          {editingExpense === expense.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`desc-${expense.id}`} className="text-sm">Description</Label>
                                <Input
                                  id={`desc-${expense.id}`}
                                  value={editedExpenseData.description}
                                  onChange={(e) => setEditedExpenseData({
                                    ...editedExpenseData,
                                    description: e.target.value
                                  })}
                                  className="text-sm"
                                  placeholder="Enter expense description"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`amount-${expense.id}`} className="text-sm">Amount (₹)</Label>
                                <Input
                                  id={`amount-${expense.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editedExpenseData.amount}
                                  onChange={(e) => setEditedExpenseData({
                                    ...editedExpenseData,
                                    amount: e.target.value
                                  })}
                                  className="text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`category-${expense.id}`} className="text-sm">Category</Label>
                                <Select
                                  value={editedExpenseData.category}
                                  onValueChange={(value) => setEditedExpenseData({
                                    ...editedExpenseData,
                                    category: value
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category.value} value={category.value}>
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-medium">{expense.description}</h4>
                              <p className="text-sm text-muted-foreground">{expense.date}</p>
                            </>
                          )}
                        </div>
                        <div className="text-right space-y-2 ml-4">
                          {editingExpense !== expense.id && (
                            <p className="text-lg font-bold text-red-600">
                              -₹{expense.amount.toLocaleString()}
                            </p>
                          )}
                          <Badge className={getCategoryColor(expense.category)}>
                            {expense.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {editingExpense === expense.id ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveExpense(expense.id)} 
                              className="bg-expense-blue hover:bg-expense-blue-dark"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancelEdit}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditExpense(expense)}
                            disabled={editingExpense !== null}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}