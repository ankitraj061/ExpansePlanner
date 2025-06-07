import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  id: number;
  // Add any other properties if needed
};

type SavingsGoal = {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export default function AddSavings() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

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

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: ''
  });

  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [addAmount, setAddAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch savings goals from backend
  const fetchSavingsGoals = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/savings/goals/${userId}`);
      const result: ApiResponse<SavingsGoal[]> = await response.json();

      if (result.success && result.data) {
        setSavingsGoals(result.data);
      } else {
        setError(result.message || 'Failed to fetch savings goals');
      }
    } catch (err) {
      setError('Failed to connect to server. Please check if the backend is running on port 8000.');
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load goals when user ID is available
  useEffect(() => {
    if (userId) {
      fetchSavingsGoals();
    }
  }, [userId]);

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      showMessage("Please enter both goal name and target amount", true);
      return;
    }

    if (!userId) {
      showMessage("User not authenticated", true);
      return;
    }

    const targetAmount = parseFloat(newGoal.targetAmount);
    if (targetAmount <= 0) {
      showMessage("Target amount must be greater than 0", true);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/savings/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: newGoal.name,
          targetAmount: targetAmount
        }),
      });

      const result: ApiResponse<SavingsGoal> = await response.json();

      if (result.success && result.data) {
        setSavingsGoals(prev => [result.data!, ...prev]);
        setNewGoal({ name: '', targetAmount: '' });
        showMessage(`Savings goal "${result.data.name}" created successfully`);
      } else {
        showMessage(result.message || 'Failed to create savings goal', true);
      }
    } catch (err) {
      showMessage('Failed to connect to server', true);
      console.error('Error creating goal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSavings = async () => {
    if (!selectedGoalId || !addAmount) {
      showMessage("Please select a goal and enter an amount", true);
      return;
    }

    const amount = parseFloat(addAmount);
    if (amount <= 0) {
      showMessage("Amount must be greater than 0", true);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/savings/goals/${selectedGoalId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: `Added ₹${amount} to savings`
        }),
      });

      const result: ApiResponse<SavingsGoal> = await response.json();

      if (result.success && result.data) {
        setSavingsGoals(goals => 
          goals.map(goal => 
            goal.id === parseInt(selectedGoalId) ? result.data! : goal
          )
        );
        
        const selectedGoal = savingsGoals.find(g => g.id === parseInt(selectedGoalId));
        setAddAmount('');
        showMessage(`₹${amount} added to "${selectedGoal?.name}"!`);
      } else {
        showMessage(result.message || 'Failed to add to savings', true);
      }
    } catch (err) {
      showMessage('Failed to connect to server', true);
      console.error('Error adding to savings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show delete confirmation modal
  const handleDeleteClick = (goal: SavingsGoal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  // Cancel delete operation
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };

  // Confirm and execute delete
  const handleDeleteConfirm = async () => {
    if (!goalToDelete) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/savings/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        setSavingsGoals(goals => goals.filter(goal => goal.id !== goalToDelete.id));
        
        // Reset selected goal if it was deleted
        if (selectedGoalId === goalToDelete.id.toString()) {
          setSelectedGoalId('');
        }
        
        showMessage(result.message || `Savings goal "${goalToDelete.name}" deleted successfully`);
      } else {
        showMessage(result.message || 'Failed to delete savings goal', true);
      }
    } catch (err) {
      showMessage('Failed to connect to server', true);
      console.error('Error deleting goal:', err);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setGoalToDelete(null);
    }
  };

  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading savings goals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Savings Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and track your savings goals
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-expense-navy dark:text-expense-light">
              <Target className="w-5 h-5" />
              Create New Savings Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  type="text"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  required
                />
              </div>
              <Button 
                onClick={handleCreateGoal} 
                className="w-full bg-expense-blue hover:bg-expense-blue-dark"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-expense-navy dark:text-expense-light">
              <Plus className="w-5 h-5" />
              Add to Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectGoal">Select Savings Goal</Label>
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a savings goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {savingsGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.name} (₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Add (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  required
                />
              </div>
              <Button 
                onClick={handleAddSavings} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading || !selectedGoalId}
              >
                {isLoading ? "Adding..." : "Add to Savings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-expense-navy dark:text-expense-light">
            Savings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2 mb-6">
            <div className="text-4xl font-bold text-expense-blue-dark dark:text-expense-blue">
              ₹{totalSavings.toLocaleString()}
            </div>
            <p className="text-muted-foreground">Total Savings Across All Goals</p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Goals */}
      <div className="grid gap-6 md:grid-cols-2">
        {savingsGoals.map((goal) => {
          const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;
          
          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-expense-navy dark:text-expense-light">
                    {goal.name}
                  </CardTitle>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(goal)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-expense-blue-dark dark:text-expense-blue">
                    ₹{goal.currentAmount.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground">
                    of ₹{goal.targetAmount.toLocaleString()} goal
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={Math.min(progressPercentage, 100)} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      ₹{Math.max(remaining, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(progressPercentage)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>

                {progressPercentage >= 100 && (
                  <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <h4 className="text-sm font-bold text-green-800 dark:text-green-400">
                      🎉 Goal Achieved!
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      You've reached this savings goal!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {savingsGoals.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No savings goals yet</h3>
            <p className="text-muted-foreground">
              Create your first savings goal to start tracking your progress!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the savings goal "{goalToDelete?.name}"? 
              This action cannot be undone and you will lose all progress data for this goal.
              {goalToDelete && goalToDelete.currentAmount > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <strong>Warning:</strong> This goal has ₹{goalToDelete.currentAmount.toLocaleString()} in savings that will be permanently deleted.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete Goal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </Layout>
  );
}