import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';
import { ArrowUpCircle, ArrowDownCircle, Calendar, DollarSign,IndianRupee } from 'lucide-react';

type DecodedToken = {
  id: number;
  // Add any other properties if needed
};

type Transaction = {
  id: number;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  description: string;
  category?: string; // For expenses
  income_type?: string; // For income
  created_at: string;
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com'
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Store edited transaction data temporarily
  const [editedTransactionData, setEditedTransactionData] = useState<{
    description: string;
    amount: string;
    category?: string;
    income_type?: string;
  }>({
    description: '',
    amount: '',
    category: '',
    income_type: ''
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

  // State to store transactions fetched from backend
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    // Fetch user info and transactions when component mounts
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({ title: 'Error', description: 'No auth token found' });
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserInfo(response.data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to load user info'
        });
      }
    };

    // Fetch combined transactions from backend
    const fetchTransactions = async () => {
      if (!userId) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({ title: 'Error', description: 'No auth token found' });
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(res.data);
        setTransactions(res.data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to load transactions'
        });
      }
    };

    fetchUserInfo();
    fetchTransactions();
  }, [userId]);

  // Filter transactions based on selected filter
  useEffect(() => {
    if (filter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === filter));
    }
  }, [transactions, filter]);

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Error', description: 'No auth token found' });
        return;
      }
      
      setIsLoading(true);
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`, userInfo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Success!',
        description: 'Profile updated successfully'
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction.id);
    setEditedTransactionData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category || '',
      income_type: transaction.income_type || ''
    });
  };

  const handleSaveTransaction = async (transactionId: number, transactionType: 'income' | 'expense') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Error', description: 'No auth token found' });
        return;
      }

      // Validate input data
      if (!editedTransactionData.description.trim()) {
        toast({ title: 'Error', description: 'Description cannot be empty' });
        return;
      }

      const amount = parseFloat(editedTransactionData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({ title: 'Error', description: 'Please enter a valid amount greater than 0' });
        return;
      }

      if (transactionType === 'expense' && !editedTransactionData.category) {
        toast({ title: 'Error', description: 'Please select a category for expense' });
        return;
      }

      if (transactionType === 'income' && !editedTransactionData.income_type) {
        toast({ title: 'Error', description: 'Please select an income type' });
        return;
      }

      setIsLoading(true);

      // Update transaction in backend
      const updateData: any = {
        description: editedTransactionData.description.trim(),
        amount: amount,
      };

      if (transactionType === 'expense') {
        updateData.category = editedTransactionData.category;
      } else {
        updateData.income_type = editedTransactionData.income_type;
      }

      const endpoint = transactionType === 'expense' ? 'expenses' : 'income';
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/${endpoint}/${transactionId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state with the updated transaction
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId
            ? { ...transaction, ...updateData }
            : transaction
        )
      );

      toast({
        title: 'Success!',
        description: 'Transaction updated successfully'
      });
      
      setEditingTransaction(null);
      setEditedTransactionData({ description: '', amount: '', category: '', income_type: '' });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update transaction'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditedTransactionData({ description: '', amount: '', category: '', income_type: '' });
  };

  const getCategoryColor = (category?: string, income_type?: string) => {
    if (category) {
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
    }
    
    if (income_type) {
      const colors: Record<string, string> = {
        salary: 'bg-emerald-100 text-emerald-800',
        freelance: 'bg-teal-100 text-teal-800',
        business: 'bg-cyan-100 text-cyan-800',
        investment: 'bg-indigo-100 text-indigo-800',
        gift: 'bg-rose-100 text-rose-800',
        other: 'bg-slate-100 text-slate-800'
      };
      return colors[income_type] || 'bg-slate-100 text-slate-800';
    }
    
    return 'bg-gray-100 text-gray-800';
  };

  const categories = ['food', 'clothes', 'travel', 'education', 'party', 'furniture', 'other'];
  const incomeTypes = ['salary', 'freelance', 'business', 'investment', 'gift', 'other'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-expense-navy dark:text-expense-light">
            Profile
          </h1>
          <p className="text-expense-blue-dark dark:text-expense-gray">
            Manage your account and view transaction history
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-expense-navy dark:text-expense-light">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSaveProfile} 
                      className="bg-expense-blue hover:bg-expense-blue-dark"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-expense-navy dark:text-expense-light">
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <ArrowUpCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">₹{getTotalIncome().toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <ArrowDownCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">₹{getTotalExpenses().toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <IndianRupee className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                  <p className={`text-2xl font-bold ${getTotalBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{getTotalBalance().toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-expense-navy dark:text-expense-light">
                Transaction History
              </CardTitle>
              <Select value={filter} onValueChange={(value: 'all' | 'income' | 'expense') => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No transactions found.</p>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 space-y-2">
                          {editingTransaction === transaction.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`desc-${transaction.id}`} className="text-sm">Description</Label>
                                <Input
                                  id={`desc-${transaction.id}`}
                                  value={editedTransactionData.description}
                                  onChange={(e) => setEditedTransactionData({
                                    ...editedTransactionData,
                                    description: e.target.value
                                  })}
                                  className="text-sm"
                                  placeholder="Enter transaction description"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`amount-${transaction.id}`} className="text-sm">Amount (₹)</Label>
                                <Input
                                  id={`amount-${transaction.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editedTransactionData.amount}
                                  onChange={(e) => setEditedTransactionData({
                                    ...editedTransactionData,
                                    amount: e.target.value
                                  })}
                                  className="text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                              {transaction.type === 'expense' ? (
                                <div>
                                  <Label htmlFor={`category-${transaction.id}`} className="text-sm">Category</Label>
                                  <Select
                                    value={editedTransactionData.category}
                                    onValueChange={(value) => setEditedTransactionData({
                                      ...editedTransactionData,
                                      category: value
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <div>
                                  <Label htmlFor={`income-type-${transaction.id}`} className="text-sm">Income Type</Label>
                                  <Select
                                    value={editedTransactionData.income_type}
                                    onValueChange={(value) => setEditedTransactionData({
                                      ...editedTransactionData,
                                      income_type: value
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select income type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {incomeTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <h4 className="font-medium">{transaction.description}</h4>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(transaction.date)}</span>
                                <span>•</span>
                                <span>{formatTime(transaction.created_at)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2 ml-4">
                        {editingTransaction !== transaction.id && (
                          <p className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                        )}
                        <Badge className={getCategoryColor(transaction.category, transaction.income_type)}>
                          {transaction.category || transaction.income_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {editingTransaction === transaction.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveTransaction(transaction.id, transaction.type)} 
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
                          onClick={() => handleEditTransaction(transaction)}
                          disabled={editingTransaction !== null}
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
    </Layout>
  );
}