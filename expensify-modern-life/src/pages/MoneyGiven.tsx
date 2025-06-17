import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  id: number;
};

type Entry = {
  id: number;
  person: string;
  amount: number;
  description: string;
  date: string;
};

type NewEntry = {
  person: string;
  amount: string; // Keep as string for form input
  description: string;
  date: string;
};

export default function MoneyGiven() {
  const [givenMoney, setGivenMoney] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newEntry, setNewEntry] = useState<NewEntry>({
    person: '',
    amount: '',
    description: '',
    date: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; entry: Entry | null }>({
    show: false,
    entry: null,
  });

  const [userId, setUserId] = useState<number | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.id);
        fetchEntries(decoded.id);
      } catch (err) {
        console.error('Invalid token:', err);
      }
    }
  }, [token]);

  const fetchEntries = async (uid: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/money-given`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Fetched entries:', data);
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setGivenMoney(data);
      } else {
        console.error('Expected array but got:', data);
        setGivenMoney([]);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
      setGivenMoney([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newEntry.person || !newEntry.amount || !userId) return;

    const entry = {
      person: newEntry.person,
      amount: parseFloat(newEntry.amount),
      description: newEntry.description,
      date: newEntry.date || new Date().toISOString().split('T')[0],
    };
    console.log('Adding entry:', entry);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/money-given`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Added entry:', data);
      
      // Refresh the entire list to ensure consistency
      fetchEntries(userId);
      setNewEntry({ person: '', amount: '', description: '', date: '' });
    } catch (err) {
      console.error('Error adding entry:', err);
    }
  };

  const showDeleteConfirm = (entry: Entry) => {
    setDeleteConfirm({ show: true, entry });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, entry: null });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.entry) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/money-given/${deleteConfirm.entry.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Remove the entry from local state
      setGivenMoney(givenMoney.filter((entry) => entry.id !== deleteConfirm.entry!.id));
      hideDeleteConfirm();
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  // Safe calculation with fallback
  const totalGiven = Array.isArray(givenMoney) 
    ? givenMoney.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    : 0;

  return (
    <Layout>
      <div className="space-y-6 mx-6 mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-primary">Money Given</h1>
          <p className="text-muted-foreground">Track money you've given to others</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Money Given
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="person">Person Name</Label>
                <Input
                  id="person"
                  value={newEntry.person}
                  onChange={(e) => setNewEntry({ ...newEntry, person: e.target.value })}
                  placeholder="Enter person's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <Button 
                onClick={handleAdd} 
                className="w-full"
                disabled={!newEntry.person || !newEntry.amount}
              >
                Add Entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Given: ₹{totalGiven.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {givenMoney.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No entries yet. Add your first entry above.
                    </div>
                  ) : (
                    givenMoney.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{entry.person}</div>
                          <div className="text-sm text-muted-foreground">{entry.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600">
                            ₹{Number(entry.amount).toFixed(2)}
                          </span>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => showDeleteConfirm(entry)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Delete Entry
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Are you sure you want to delete the entry for{" "}
                    <span className="font-semibold text-foreground">
                      {deleteConfirm.entry?.person}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-red-600">
                      ₹{Number(deleteConfirm.entry?.amount || 0).toFixed(2)}
                    </span>
                    ? This action cannot be backed.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={hideDeleteConfirm}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={hideDeleteConfirm}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}