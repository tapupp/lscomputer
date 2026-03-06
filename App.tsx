import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  SmartphoneNfc, 
  Copy, 
  History, 
  PlusCircle, 
  TrendingUp, 
  Wallet,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Package,
  Printer,
  Download,
  X,
  CheckCircle2,
  Users,
  Edit,
  Trash2,
  Database as DatabaseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { AIAssistant } from './components/AIAssistant';

// --- Types ---
interface User {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  name: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  timestamp: string;
}

interface Analytics {
  mfs: { total: number; profit: number };
  recharge: { total: number; profit: number };
  services: { total: number; pages: number };
  expenses: { total: number };
  inventory: number;
  mfsBalances: { [key: string]: number };
  rechargeBalances: { [key: string]: number };
  cashInHand: number;
  totalProfit: number;
  totalCustomerDue: number;
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  details: string;
  balance: number;
}

interface VendorTransaction {
  id: number;
  vendor_id: number;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface CustomerTransaction {
  id: number;
  customer_id: number;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

interface Transaction {
  id: number;
  operator: string;
  type?: string;
  amount: number;
  commission?: number;
  profit?: number;
  customer_phone: string;
  trx_id?: string;
  timestamp: string;
  service_type?: string;
  variant?: string;
  pages?: number;
  price?: number;
  shop_number_id?: number;
}

// --- Components ---

const Card = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
  <Card className="flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </Card>
);

const UserManagementSection = ({ token }: { token: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, name, role })
      });
      
      if (res.ok) {
        setUsername('');
        setPassword('');
        setName('');
        setRole('staff');
        fetchUsers();
        alert('User added successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Staff/User</h3>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Existing Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Username</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Role</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Created At</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{user.username}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">{new Date(user.created_at!).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mfs' | 'recharge' | 'services' | 'other' | 'expenses' | 'vendors' | 'customers' | 'history' | 'settings'>('dashboard');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<'home' | 'login' | 'app'>('home');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setView('app');
    }
  }, [token]);

  const handleLogin = (newToken: string, user: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
    setView('app');
    fetchAnalytics();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setView('home');
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from server");
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const [mfsInitialType, setMfsInitialType] = useState<string>('Cash-in');

  const handleTabChange = (tab: any, initialType?: string) => {
    setActiveTab(tab);
    if (initialType) setMfsInitialType(initialType);
    if (tab === 'history') fetchTransactions();
  };

  const fetchTransactions = async (query = '') => {
    try {
      const res = await fetch(`/api/history?search=${query}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error("Received non-JSON response");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleAddStock = async () => {
    const rims = prompt("How many rims to add? (1 rim = 500 pages)");
    if (!rims || isNaN(parseInt(rims))) return;
    
    const pages = parseInt(rims) * 500;
    try {
      await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: pages })
      });
      fetchAnalytics();
      alert(`Added ${rims} rims (${pages} pages) to stock.`);
    } catch (err) {
      console.error(err);
    }
  };

  if (view === 'home') {
    return <Home onLoginClick={() => setView('login')} />;
  }

  if (view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-0 md:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">এল এস কম্পিউটার</h1>
        </div>

        <nav className="space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activeTab === 'mfs'} onClick={() => handleTabChange('mfs')} icon={Wallet} label="MFS Ledger" />
          <NavItem active={activeTab === 'recharge'} onClick={() => handleTabChange('recharge')} icon={Smartphone} label="Mobile Load" />
          <NavItem active={activeTab === 'services'} onClick={() => handleTabChange('services')} icon={Copy} label="Print & Copy" />
          <NavItem active={activeTab === 'other'} onClick={() => handleTabChange('other')} icon={PlusCircle} label="সেবা/অন্যান্য" />
          <NavItem active={activeTab === 'expenses'} onClick={() => handleTabChange('expenses')} icon={ArrowDownLeft} label="খরচ/ভেন্ডর" />
          <NavItem active={activeTab === 'vendors'} onClick={() => handleTabChange('vendors')} icon={Users} label="Vendor Ledger" />
          <NavItem active={activeTab === 'customers'} onClick={() => handleTabChange('customers')} icon={Users} label="Customer Dues" />
          <NavItem active={activeTab === 'history'} onClick={() => handleTabChange('history')} icon={History} label="History" />
          <NavItem active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} icon={PlusCircle} label="Settings" />
        </nav>
      </aside>

      <AIAssistant />

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
            <p className="text-slate-500">Welcome back, Shop Admin</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <RefreshCcw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardModule 
              analytics={analytics} 
              onTabChange={handleTabChange} 
              onAddStock={handleAddStock} 
            />
          )}

          {activeTab === 'mfs' && <MFSModule initialType={mfsInitialType} onComplete={(tx) => { fetchAnalytics(); setSelectedInvoice(tx); }} />}
          {activeTab === 'recharge' && <RechargeModule onComplete={(tx) => { fetchAnalytics(); setSelectedInvoice(tx); }} />}
          {activeTab === 'services' && <ServicesModule onComplete={(tx) => { fetchAnalytics(); setSelectedInvoice(tx); }} />}
          {activeTab === 'other' && <OtherSalesModule onComplete={(tx) => { fetchAnalytics(); setSelectedInvoice(tx); }} />}
          {activeTab === 'expenses' && <ExpenseModule onComplete={(tx) => { fetchAnalytics(); setSelectedInvoice(tx); }} />}
          {activeTab === 'vendors' && <VendorsModule />}
          {activeTab === 'customers' && <CustomersModule />}
          {activeTab === 'settings' && currentUser?.role === 'admin' && (
            <div className="space-y-8">
              <SettingsModule onComplete={fetchAnalytics} />
              <BackupModule />
            </div>
          )}
          {activeTab === 'users' && currentUser?.role === 'admin' && <UserManagementSection token={token!} />}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by Phone or TrxID..." 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchTransactions(e.target.value);
                  }}
                />
              </div>
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-bottom border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Time</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Operator/Service</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Amount</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Phone</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                              tx.operator === 'bKash' ? 'bg-pink-100 text-pink-700' :
                              tx.operator === 'Nagad' ? 'bg-orange-100 text-orange-700' :
                              tx.operator === 'Rocket' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.operator || tx.service_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">{tx.type || tx.variant}</td>
                          <td className="px-6 py-4 text-sm font-bold">৳{tx.amount || tx.price}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{tx.customer_phone || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedInvoice(tx)}
                                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                title="Print Invoice"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={async () => {
                                  // Temporary set selected to trigger a hidden render or just use the modal
                                  setSelectedInvoice(tx);
                                  // We'll add a small delay to ensure modal is rendered if we want to trigger from here
                                  // But it's better to just let the user click download inside the modal for better UX
                                  // Or we can implement a standalone download function that renders a hidden div
                                }}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50 overflow-x-auto">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} />
        <MobileNavItem active={activeTab === 'mfs'} onClick={() => setActiveTab('mfs')} icon={Wallet} />
        <MobileNavItem active={activeTab === 'recharge'} onClick={() => setActiveTab('recharge')} icon={Smartphone} />
        <MobileNavItem active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={Copy} />
        <MobileNavItem active={activeTab === 'other'} onClick={() => setActiveTab('other')} icon={PlusCircle} />
        <MobileNavItem active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={ArrowDownLeft} />
        <MobileNavItem active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} icon={Users} />
        <MobileNavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={Users} />
        <MobileNavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} />
        {currentUser?.role === 'admin' && (
          <MobileNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={DatabaseIcon} />
        )}
      </nav>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceModal 
            transaction={selectedInvoice} 
            onClose={() => setSelectedInvoice(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardModule({ 
  analytics, 
  onTabChange, 
  onAddStock 
}: { 
  analytics: Analytics | null; 
  onTabChange: (tab: string, type?: string) => void; 
  onAddStock: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ customer_name: '', customer_phone: '', description: '', amount: '' });

  const fetchData = async () => {
    try {
      const [ordersRes, chartRes] = await Promise.all([
        fetch('/api/orders?status=Pending'),
        fetch('/api/analytics/chart-data')
      ]);
      const ordersData = await ordersRes.json();
      const chartDataJson = await chartRes.json();
      
      setOrders(ordersData);
      
      // Transform chart data for Recharts
      const formattedChartData = chartDataJson.labels.map((label: string, i: number) => ({
        name: label,
        sales: chartDataJson.salesData[i],
        mfs: chartDataJson.mfsData[i],
        profit: chartDataJson.profitData[i]
      }));
      setChartData(formattedChartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrder,
          amount: parseFloat(newOrder.amount) || 0
        })
      });
      setNewOrder({ customer_name: '', customer_phone: '', description: '', amount: '' });
      setShowAddOrder(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteOrder = async (id: number) => {
    if (!confirm('Mark this order as completed?')) return;
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }) // Only updating status for now
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Delete this order?')) return;
    try {
      await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Cash in Hand" value={`৳${analytics?.cashInHand || 0}`} icon={Wallet} color="bg-emerald-500" />
        <StatCard title="Today's Profit" value={`৳${analytics?.totalProfit.toFixed(2) || 0}`} icon={TrendingUp} color="bg-blue-500" />
        <StatCard title="Today's Expense" value={`৳${analytics?.expenses?.total || 0}`} icon={ArrowDownLeft} color="bg-red-500" />
        <StatCard title="MFS Volume" value={`৳${analytics?.mfs.total || 0}`} icon={SmartphoneNfc} color="bg-purple-500" />
        <StatCard title="Customer Dues" value={`৳${analytics?.totalCustomerDue || 0}`} icon={Users} color="bg-orange-500" />
      </div>

      {/* Charts & Pending Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2 min-h-[400px]">
          <h3 className="text-lg font-bold mb-4">Weekly Performance</h3>
          {chartData ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMfs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="Sales (৳)" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="mfs" name="MFS Vol (৳)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMfs)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
          )}
        </Card>

        {/* Pending Orders Section */}
        <Card className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              Pending Orders
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{orders.length}</span>
            </h3>
            <button 
              onClick={() => setShowAddOrder(true)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[320px]">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No pending orders</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">{order.description}</h4>
                    <span className="font-mono text-xs font-bold text-slate-500">৳{order.amount}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-500">
                      <p>{order.customer_name}</p>
                      <p>{order.customer_phone}</p>
                      <p className="text-[10px] mt-1 text-slate-400">{new Date(order.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCompleteOrder(order.id)}
                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                        title="Complete"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* MFS Balances Row */}
      {analytics?.mfsBalances && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">MFS & Recharge Balances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {Object.entries(analytics.mfsBalances).map(([op, bal]) => (
                <div key={op} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      op === 'bKash' ? 'bg-pink-100 text-pink-600' : op === 'Nagad' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <SmartphoneNfc className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-700">{op}</span>
                  </div>
                  <span className="font-black text-slate-900">৳{bal}</span>
                </div>
              ))}
            </div>
            
            {analytics?.rechargeBalances && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(analytics.rechargeBalances).map(([op, bal]) => (
                  <div key={op} className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{op}</span>
                    <span className="font-bold text-slate-900 text-sm">৳{bal}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onTabChange('mfs', 'Cash-in')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                <Wallet className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="text-xs font-medium">MFS Entry</span>
              </button>
              <button onClick={() => onTabChange('recharge')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                <Smartphone className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs font-medium">Recharge</span>
              </button>
              <button onClick={() => onTabChange('services')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                <Copy className="w-6 h-6 text-orange-600 mb-1" />
                <span className="text-xs font-medium">Print/Copy</span>
              </button>
              <button onClick={() => onTabChange('expenses')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                <ArrowDownLeft className="w-6 h-6 text-red-600 mb-1" />
                <span className="text-xs font-medium">Expense</span>
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
               <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm">Inventory</h4>
                  <button onClick={onAddStock} className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" /> Add
                  </button>
               </div>
               <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">Paper (A4)</span>
                  <span className="text-sm font-bold">{(analytics?.inventory || 0) / 500} Rims</span>
               </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">New Order</h3>
              <button onClick={() => setShowAddOrder(false)} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddOrder} className="space-y-3">
              <input 
                placeholder="Description (e.g. Passport Photo)" 
                required
                className="w-full p-2 border rounded-lg"
                value={newOrder.description}
                onChange={e => setNewOrder({ ...newOrder, description: e.target.value })}
              />
              <input 
                placeholder="Amount (Optional)" 
                type="number"
                className="w-full p-2 border rounded-lg"
                value={newOrder.amount}
                onChange={e => setNewOrder({ ...newOrder, amount: e.target.value })}
              />
              <input 
                placeholder="Customer Name" 
                className="w-full p-2 border rounded-lg"
                value={newOrder.customer_name}
                onChange={e => setNewOrder({ ...newOrder, customer_name: e.target.value })}
              />
              <input 
                placeholder="Customer Phone" 
                type="tel"
                className="w-full p-2 border rounded-lg"
                value={newOrder.customer_phone}
                onChange={e => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
              />
              <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">Save Order</button>
            </form>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

// --- Sub-Modules ---

function InvoiceModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const printInvoice = () => {
    window.print();
  };

  const downloadInvoice = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${transaction.trx_id || transaction.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:p-0"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl print:shadow-none print:rounded-none"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold">Transaction Invoice</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="invoice-content" className="p-8 space-y-6 text-center bg-white" style={{ color: '#0f172a' }}>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#059669]">DeshiShop</h2>
            <p className="text-xs text-[#94a3b8] uppercase tracking-widest">Digital Service Point</p>
          </div>

          <div className="py-4 border-y border-dashed border-[#e2e8f0] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Date & Time</span>
              <span className="font-medium">{new Date(transaction.timestamp || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Service</span>
              <span className="font-bold text-[#0f172a]">{transaction.operator || transaction.service_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Type</span>
              <span className="font-medium">{transaction.type || transaction.variant}</span>
            </div>
            {transaction.customer_phone && (
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Customer</span>
                <span className="font-medium">{transaction.customer_phone}</span>
              </div>
            )}
            {transaction.trx_id && (
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">TrxID</span>
                <span className="font-mono text-xs">{transaction.trx_id}</span>
              </div>
            )}
            {transaction.pages && (
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Pages</span>
                <span className="font-medium">{transaction.pages}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-[#64748b]">Total Amount</p>
            <h1 className="text-4xl font-black text-[#0f172a]">৳{transaction.amount || transaction.price}</h1>
          </div>

          <div className="pt-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-[#ecfdf5] rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="text-[#059669] w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#059669]">Payment Successful</p>
            <p className="text-[10px] text-[#94a3b8]">Thank you for choosing DeshiShop!</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3 print:hidden">
          <button 
            onClick={printInvoice}
            className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button 
            onClick={downloadInvoice}
            disabled={isDownloading}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
}

function MFSModule({ onComplete, initialType = 'Cash-in' }: { onComplete: (tx: Transaction) => void; initialType?: string }) {
  const [formData, setFormData] = useState({ operator: 'bKash', type: initialType, amount: '', customer_phone: '', trx_id: '', vendor_id: '', shop_number_id: '' });
  const [paymentData, setPaymentData] = useState({ status: 'Paid', paid: 0, due: 0, customerId: null as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [balances, setBalances] = useState<{ [key: string]: number }>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [shopNumbers, setShopNumbers] = useState<any[]>([]);

  const fetchBalances = async () => {
    try {
      const res = await fetch('/api/mfs/balances');
      const data = await res.json();
      setBalances(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShopNumbers = async () => {
    try {
      const res = await fetch('/api/shop-numbers');
      const data = await res.json();
      setShopNumbers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalances();
    fetchVendors();
    fetchShopNumbers();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, type: initialType }));
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/mfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
          shop_number_id: formData.shop_number_id ? parseInt(formData.shop_number_id) : null,
          payment_status: paymentData.status,
          paid_amount: paymentData.paid,
          due_amount: paymentData.due,
          customer_id: paymentData.customerId
        })
      });
      const tx = { ...formData, amount: parseFloat(formData.amount), timestamp: new Date().toISOString() } as any;
      setFormData({ ...formData, amount: '', customer_phone: '', trx_id: '', vendor_id: '', shop_number_id: '' });
      fetchBalances();
      onComplete(tx);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNumbers = shopNumbers.filter(n => n.operator === formData.operator);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['bKash', 'Nagad', 'Rocket'].map(op => (
          <Card key={op} className="p-4 flex items-center justify-between border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                op === 'bKash' ? 'bg-pink-100 text-pink-600' :
                op === 'Nagad' ? 'bg-orange-100 text-orange-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">{op} Balance</p>
                <h4 className="text-lg font-black">৳{balances[op] || 0}</h4>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="max-w-md mx-auto">
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setFormData({ ...formData, type: 'Cash-in', vendor_id: '' })}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              !['Receive', 'B2B-Buy', 'B2B-Pay'].includes(formData.type) ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Consumer
          </button>
          <button 
            onClick={() => setFormData({ ...formData, type: 'B2B-Buy', vendor_id: '' })}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              ['B2B-Buy', 'B2B-Pay'].includes(formData.type) ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            B2B (Vendor)
          </button>
          <button 
            onClick={() => setFormData({ ...formData, type: 'Receive', vendor_id: '' })}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              formData.type === 'Receive' ? 'bg-emerald-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Receive
          </button>
        </div>

        <h3 className="text-xl font-bold mb-6">
          {formData.type === 'Receive' ? 'Receive MFS Money' : 
           formData.type.startsWith('B2B') ? 'B2B Transaction' : 'MFS Transaction'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {['bKash', 'Nagad', 'Rocket'].map(op => (
              <button
                key={op}
                type="button"
                onClick={() => setFormData({ ...formData, operator: op })}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  formData.operator === op ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {!['Receive', 'B2B-Buy', 'B2B-Pay'].includes(formData.type) && (
            <div className="grid grid-cols-2 gap-2">
              {['Cash-in', 'Cash-out'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    formData.type === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {formData.type.startsWith('B2B') && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'B2B Buy (Balance In)', value: 'B2B-Buy' },
                { label: 'B2B Pay (Balance Out)', value: 'B2B-Pay' }
              ].map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.value })}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                    formData.type === t.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {formData.type.startsWith('B2B') && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Select Vendor</label>
              <select 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.vendor_id}
                onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
              >
                <option value="">Choose a vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} (Bal: ৳{v.balance})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Amount (৳)</label>
            <input 
              type="number" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              {formData.type === 'Receive' ? 'Customer Phone' : 
               formData.type.startsWith('B2B') ? 'Reference/Phone' : 'Phone Number'}
            </label>
            <input 
              type="tel" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.customer_phone}
              onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Select Agent/Personal Number</label>
            <select 
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.shop_number_id}
              onChange={e => setFormData({ ...formData, shop_number_id: e.target.value })}
            >
              <option value="">Choose your number...</option>
              {filteredNumbers.map(n => (
                <option key={n.id} value={n.id}>{n.number} ({n.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">TrxID (Optional)</label>
            <input 
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.trx_id}
              onChange={e => setFormData({ ...formData, trx_id: e.target.value })}
            />
          </div>

          <PaymentInput 
            totalAmount={parseFloat(formData.amount) || 0} 
            onPaymentChange={setPaymentData} 
          />

          <button 
            disabled={submitting}
            className={`w-full py-4 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 ${
              formData.type === 'Receive' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 
              formData.type.startsWith('B2B') ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' :
              'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {submitting ? 'Processing...' : 'Save Transaction'}
          </button>
        </form>
      </Card>
    </div>
  );
}

function RechargeModule({ onComplete }: { onComplete: (tx: Transaction) => void }) {
  const [formData, setFormData] = useState({ operator: 'GP', type: 'Recharge', amount: '', customer_phone: '', vendor_id: '', shop_number_id: '' });
  const [paymentData, setPaymentData] = useState({ status: 'Paid', paid: 0, due: 0, customerId: null as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [balances, setBalances] = useState<{ [key: string]: number }>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [shopNumbers, setShopNumbers] = useState<any[]>([]);

  const fetchBalances = async () => {
    try {
      const res = await fetch('/api/recharge/balances');
      const data = await res.json();
      setBalances(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShopNumbers = async () => {
    try {
      const res = await fetch('/api/shop-numbers');
      const data = await res.json();
      setShopNumbers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalances();
    fetchVendors();
    fetchShopNumbers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
          shop_number_id: formData.shop_number_id ? parseInt(formData.shop_number_id) : null,
          payment_status: paymentData.status,
          paid_amount: paymentData.paid,
          due_amount: paymentData.due,
          customer_id: paymentData.customerId
        })
      });
      const tx = { ...formData, amount: parseFloat(formData.amount), type: formData.type === 'Recharge' ? 'Recharge' : formData.type, timestamp: new Date().toISOString() } as any;
      setFormData({ ...formData, amount: '', customer_phone: '', vendor_id: '', shop_number_id: '' });
      fetchBalances();
      onComplete(tx);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNumbers = shopNumbers.filter(n => n.operator === formData.operator);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {['GP', 'Robi', 'BL', 'Airtel', 'Teletalk'].map(op => (
          <div key={op} className="bg-white p-2 rounded-xl border border-slate-100 flex flex-col items-center shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{op}</span>
            <span className="text-xs font-black text-slate-900">৳{balances[op] || 0}</span>
          </div>
        ))}
      </div>

      <Card className="max-w-md mx-auto">
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setFormData({ ...formData, type: 'Recharge', vendor_id: '' })}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              formData.type === 'Recharge' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Consumer
          </button>
          <button 
            onClick={() => setFormData({ ...formData, type: 'B2B-Buy', vendor_id: '' })}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              formData.type.startsWith('B2B') ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            B2B (Vendor)
          </button>
        </div>

        <h3 className="text-xl font-bold mb-6">
          {formData.type === 'Recharge' ? 'Mobile Recharge' : 'B2B Recharge Transaction'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-5 gap-1">
            {['GP', 'Robi', 'BL', 'Airtel', 'Teletalk'].map(op => (
              <button
                key={op}
                type="button"
                onClick={() => setFormData({ ...formData, operator: op })}
                className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                  formData.operator === op ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {formData.type.startsWith('B2B') && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'B2B Buy (Stock In)', value: 'B2B-Buy' },
                { label: 'B2B Pay (Stock Out)', value: 'B2B-Pay' }
              ].map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.value })}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                    formData.type === t.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {formData.type.startsWith('B2B') && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Select Vendor</label>
              <select 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.vendor_id}
                onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
              >
                <option value="">Choose a vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} (Bal: ৳{v.balance})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Amount (৳)</label>
            <input 
              type="number" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              {formData.type.startsWith('B2B') ? 'Reference/Phone' : 'Phone Number'}
            </label>
            <input 
              type="tel" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.customer_phone}
              onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Select Agent/Personal Number</label>
            <select 
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.shop_number_id}
              onChange={e => setFormData({ ...formData, shop_number_id: e.target.value })}
            >
              <option value="">Choose your number...</option>
              {filteredNumbers.map(n => (
                <option key={n.id} value={n.id}>{n.number} ({n.type})</option>
              ))}
            </select>
          </div>

          <PaymentInput 
            totalAmount={parseFloat(formData.amount) || 0} 
            onPaymentChange={setPaymentData} 
          />

          <button 
            disabled={submitting}
            className={`w-full py-4 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 ${
              formData.type.startsWith('B2B') ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {submitting ? 'Processing...' : formData.type === 'Recharge' ? 'Complete Recharge' : 'Save Transaction'}
          </button>
        </form>
      </Card>
    </div>
  );
}

function ServicesModule({ onComplete }: { onComplete: (tx: Transaction) => void }) {
  const [formData, setFormData] = useState({ service_type: 'Photocopy', variant: 'A4 BW', pages: '1', price: '5' });
  const [paymentData, setPaymentData] = useState({ status: 'Paid', paid: 0, due: 0, customerId: null as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [costs, setCosts] = useState({ bw: 2, color: 12 });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const bw = data.find((s: any) => s.key === 'cost_bw')?.value || 2;
        const color = data.find((s: any) => s.key === 'cost_color')?.value || 12;
        setCosts({ bw: parseFloat(bw), color: parseFloat(color) });
      });
  }, []);

  const presets = [
    { label: 'A4 BW', price: 5 },
    { label: 'A4 Color', price: 20 },
    { label: 'Legal BW', price: 10 },
    { label: 'Legal Color', price: 30 },
  ];

  const currentUnitCost = formData.variant.toLowerCase().includes('color') ? costs.color : costs.bw;
  const estimatedProfit = parseFloat(formData.price) - (parseInt(formData.pages) * currentUnitCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payment_status: paymentData.status,
          paid_amount: paymentData.paid,
          due_amount: paymentData.due,
          customer_id: paymentData.customerId
        })
      });
      const tx = { ...formData, price: parseFloat(formData.price), pages: parseInt(formData.pages), timestamp: new Date().toISOString() } as any;
      onComplete(tx);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-6">Print & Copy</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['Photocopy', 'Print'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, service_type: type })}
              className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                formData.service_type === type ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => setFormData({ ...formData, variant: p.label, price: (parseInt(formData.pages) * p.price).toString() })}
              className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                formData.variant === p.label ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex justify-between">
                <span>{p.label}</span>
                <span>৳{p.price}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Pages</label>
            <input 
              type="number" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.pages}
              onChange={e => {
                const pages = e.target.value;
                const unitPrice = presets.find(p => p.label === formData.variant)?.price || 5;
                setFormData({ ...formData, pages, price: (parseInt(pages || '0') * unitPrice).toString() });
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Total Price (৳)</label>
            <input 
              type="number" required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
        </div>

        <PaymentInput 
          totalAmount={parseFloat(formData.price) || 0} 
          onPaymentChange={setPaymentData} 
        />

        <button 
          disabled={submitting}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Record Sale'}
        </button>

        <div className="text-center">
          <p className="text-xs text-slate-400">
            Estimated Profit: <span className="text-emerald-600 font-bold">৳{estimatedProfit.toFixed(2)}</span>
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            (Based on unit cost: ৳{currentUnitCost}/page)
          </p>
        </div>
      </form>
    </Card>
  );
}

function OtherSalesModule({ onComplete }: { onComplete: (tx: Transaction) => void }) {
  const [formData, setFormData] = useState({ item_name: '', amount: '', profit: '' });
  const [paymentData, setPaymentData] = useState({ status: 'Paid', paid: 0, due: 0, customerId: null as string | null });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/other-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          profit: parseFloat(formData.profit || '0'),
          payment_status: paymentData.status,
          paid_amount: paymentData.paid,
          due_amount: paymentData.due,
          customer_id: paymentData.customerId
        })
      });
      const tx = { 
        operator: formData.item_name, 
        type: 'Sale', 
        amount: parseFloat(formData.amount), 
        timestamp: new Date().toISOString() 
      } as any;
      setFormData({ item_name: '', amount: '', profit: '' });
      onComplete(tx);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-6">অন্যান্য সেবা / সেলস</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">সেবার নাম (Item Name)</label>
          <input 
            type="text" required
            placeholder="e.g. Spiral Binding, Lamination"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
            value={formData.item_name}
            onChange={e => setFormData({ ...formData, item_name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">বিক্রয় মূল্য (Amount ৳)</label>
          <input 
            type="number" required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">লাভ (Profit ৳ - ঐচ্ছিক)</label>
          <input 
            type="number"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
            value={formData.profit}
            onChange={e => setFormData({ ...formData, profit: e.target.value })}
          />
        </div>

        <PaymentInput 
          totalAmount={parseFloat(formData.amount) || 0} 
          onPaymentChange={setPaymentData} 
        />

        <button 
          disabled={submitting}
          className="w-full py-4 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Save Sale'}
        </button>
      </form>
    </Card>
  );
}

function ExpenseModule({ onComplete }: { onComplete: (tx: Transaction) => void }) {
  const [formData, setFormData] = useState({ category: 'Others', description: '', amount: '', customCategory: '' });
  const [paymentData, setPaymentData] = useState({ status: 'Paid', paid: 0, due: 0, customerId: null as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  const categories = ['Shop Rent', 'Electricity', 'Vendor Payment', 'Utilities', 'Salaries', 'Stationery', 'Others'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const finalCategory = isCustom ? formData.customCategory : formData.category;
    
    if (isCustom && !formData.customCategory.trim()) {
      alert("Please enter a custom category name.");
      setSubmitting(false);
      return;
    }

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: finalCategory,
          description: formData.description,
          amount: parseFloat(formData.amount),
          payment_status: paymentData.status,
          paid_amount: paymentData.paid,
          due_amount: paymentData.due,
          vendor_id: paymentData.customerId
        })
      });
      const tx = { 
        operator: finalCategory, 
        type: 'Expense', 
        amount: parseFloat(formData.amount), 
        customer_phone: formData.description,
        timestamp: new Date().toISOString() 
      } as any;
      setFormData({ category: 'Others', description: '', amount: '', customCategory: '' });
      setIsCustom(false);
      onComplete(tx);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-6">খরচ ও ভেন্ডর পেমেন্ট</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setFormData({ ...formData, category: cat });
                setIsCustom(false);
              }}
              className={`py-2 px-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                formData.category === cat && !isCustom ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`py-2 px-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
              isCustom ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-400'
            }`}
          >
            + New Category
          </button>
        </div>

        {isCustom && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm font-medium text-slate-600 mb-1">Custom Category Name</label>
            <input 
              type="text" required
              placeholder="e.g. Internet Bill, Maintenance"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
              value={formData.customCategory}
              onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
            />
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">বিবরণ (Description)</label>
          <input 
            type="text" required
            placeholder="e.g. Paid to bKash Agent"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">টাকার পরিমাণ (Amount ৳)</label>
          <input 
            type="number" required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        <PaymentInput 
          totalAmount={parseFloat(formData.amount) || 0} 
          onPaymentChange={setPaymentData}
          isExpense={true}
        />

        <button 
          disabled={submitting}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Save Expense'}
        </button>
      </form>
    </Card>
  );
}

function VendorsModule() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error("Received non-JSON response");
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Vendors Ledger</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map(vendor => (
          <Card key={vendor.id} className="cursor-pointer hover:border-indigo-200 transition-all" onClick={() => setSelectedVendor(vendor)}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">Balance</p>
                <p className={`text-lg font-black ${vendor.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ৳{Math.abs(vendor.balance)}
                  <span className="text-[10px] ml-1">{vendor.balance > 0 ? 'Due' : 'Advance'}</span>
                </p>
              </div>
            </div>
            <h4 className="font-bold text-lg">{vendor.name}</h4>
            <p className="text-sm text-slate-500">{vendor.phone || 'No phone'}</p>
            <p className="text-xs text-slate-400 mt-2 line-clamp-1">{vendor.details || 'No details'}</p>
          </Card>
        ))}
      </div>

      {showAddModal && (
        <AddVendorModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { setShowAddModal(false); fetchVendors(); }} 
        />
      )}

      {selectedVendor && (
        <VendorLedgerModal 
          vendor={selectedVendor} 
          onClose={() => setSelectedVendor(null)} 
          onUpdate={fetchVendors}
        />
      )}
    </div>
  );
}

function AddVendorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', phone: '', details: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Add New Vendor</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Vendor Name</label>
            <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
            <input type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Details/Address</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
          </div>
          <button disabled={submitting} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Vendor'}
          </button>
        </form>
      </Card>
    </div>
  );
}

function CustomersModule() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error("Received non-JSON response");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Customer Dues (বাকি খাতা)</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => (
          <Card key={customer.id} className="cursor-pointer hover:border-indigo-200 transition-all" onClick={() => setSelectedCustomer(customer)}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Due</p>
                <p className={`text-lg font-black ${customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ৳{Math.abs(customer.balance)}
                  <span className="text-[10px] ml-1">{customer.balance > 0 ? 'Due' : 'Advance'}</span>
                </p>
              </div>
            </div>
            <h4 className="font-bold text-lg">{customer.name}</h4>
            <p className="text-sm text-slate-500">{customer.phone || 'No phone'}</p>
            <p className="text-xs text-slate-400 mt-2 line-clamp-1">{customer.address || 'No address'}</p>
          </Card>
        ))}
        {customers.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">
            No customers found. Add a customer to start tracking dues.
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCustomerModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { setShowAddModal(false); fetchCustomers(); }} 
        />
      )}

      {selectedCustomer && (
        <CustomerLedgerModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
          onUpdate={fetchCustomers}
        />
      )}
    </div>
  );
}

function AddCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Add New Customer</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Customer Name</label>
            <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
            <input type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Address/Details</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <button disabled={submitting} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Customer'}
          </button>
        </form>
      </Card>
    </div>
  );
}

function CustomerLedgerModal({ customer, onClose, onUpdate }: { customer: Customer; onClose: () => void; onUpdate: () => void }) {
  const [ledger, setLedger] = useState<CustomerTransaction[]>([]);
  const [showAddTx, setShowAddTx] = useState(false);
  const [txForm, setTxForm] = useState({ type: 'Due', amount: '', description: '' });

  const fetchLedger = async () => {
    try {
      const res = await fetch(`/api/customers/${customer.id}/ledger`);
      const data = await res.json();
      setLedger(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [customer.id]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/customer-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          ...txForm,
          amount: parseFloat(txForm.amount)
        })
      });
      setTxForm({ type: 'Due', amount: '', description: '' });
      setShowAddTx(false);
      fetchLedger();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTx = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await fetch(`/api/customer-transactions/${id}`, { method: 'DELETE' });
      fetchLedger();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">{customer.name} - Ledger</h3>
            <p className="text-sm text-slate-500">{customer.phone}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAddTx(!showAddTx)} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              {showAddTx ? 'Cancel' : 'Add Entry'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence>
            {showAddTx && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                <form onSubmit={handleAddTx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">New Transaction</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Type</label>
                      <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}>
                        <option value="Due">Due (Baki)</option>
                        <option value="Payment">Payment (Joma)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Amount (৳)</label>
                      <input type="number" required className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Description</label>
                    <input type="text" required placeholder="e.g. Printed 100 pages" className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
                  </div>
                  <button className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                    Save Entry
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {ledger.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className="flex-1">
                  <p className="text-sm font-bold">{tx.description}</p>
                  <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'Due' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {tx.type === 'Due' ? '+' : '-'} ৳{tx.amount}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{tx.type}</p>
                  </div>
                  <button onClick={() => handleDeleteTx(tx.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-600 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {ledger.length === 0 && <p className="text-center text-slate-400 py-10">No transactions found for this customer.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function VendorLedgerModal({ vendor, onClose, onUpdate }: { vendor: Vendor; onClose: () => void; onUpdate: () => void }) {
  const [ledger, setLedger] = useState<VendorTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTx, setShowAddTx] = useState(false);
  const [editingTx, setEditingTx] = useState<VendorTransaction | null>(null);
  const [txForm, setTxForm] = useState({ type: 'Purchase', amount: '', description: '' });

  const fetchLedger = async () => {
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/ledger`);
      const data = await res.json();
      setLedger(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [vendor.id]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTx) {
        await fetch(`/api/vendor-transactions/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...txForm,
            amount: parseFloat(txForm.amount)
          })
        });
        setEditingTx(null);
      } else {
        await fetch('/api/vendor-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor_id: vendor.id,
            ...txForm,
            amount: parseFloat(txForm.amount)
          })
        });
      }
      setTxForm({ type: 'Purchase', amount: '', description: '' });
      setShowAddTx(false);
      fetchLedger();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTx = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await fetch(`/api/vendor-transactions/${id}`, { method: 'DELETE' });
      fetchLedger();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (tx: VendorTransaction) => {
    setEditingTx(tx);
    setTxForm({ type: tx.type, amount: tx.amount.toString(), description: tx.description });
    setShowAddTx(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">{vendor.name} - Ledger</h3>
            <p className="text-sm text-slate-500">{vendor.phone}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (showAddTx) {
                  setEditingTx(null);
                  setTxForm({ type: 'Purchase', amount: '', description: '' });
                }
                setShowAddTx(!showAddTx);
              }} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              {showAddTx ? 'Cancel' : 'Add Entry'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence>
            {showAddTx && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                <form onSubmit={handleAddTx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">{editingTx ? 'Edit Transaction' : 'New Transaction'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Type</label>
                      <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}>
                        <option value="Purchase">Purchase (Due)</option>
                        <option value="Payment">Payment (Cash Out)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Amount (৳)</label>
                      <input type="number" required className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Description</label>
                    <input type="text" required placeholder="e.g. Bought 10 Paper Rims" className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
                  </div>
                  <button className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                    {editingTx ? 'Update Entry' : 'Save Entry'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {ledger.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className="flex-1">
                  <p className="text-sm font-bold">{tx.description}</p>
                  <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'Purchase' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {tx.type === 'Purchase' ? '+' : '-'} ৳{tx.amount}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{tx.type}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(tx)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTx(tx.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {ledger.length === 0 && <p className="text-center text-slate-400 py-10">No transactions found for this vendor.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function BackupModule() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      setBackups(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setLoading(true);
    try {
      await fetch('/api/backups/create', { method: 'POST' });
      fetchBackups();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const syncToCloud = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backups/cloud-sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) alert(data.error);
      else alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Cloud sync failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore from ${filename}? Current data will be replaced and the app will restart.`)) return;
    try {
      const res = await fetch(`/api/backups/restore/${filename}`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('backup', e.target.files[0]);
    try {
      await fetch('/api/backups/upload', {
        method: 'POST',
        body: formData
      });
      fetchBackups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Backup & Restore</h3>
          <p className="text-sm text-slate-500">Manage your shop's data backups</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            Upload Backup
            <input type="file" className="hidden" accept=".db" onChange={handleUpload} />
          </label>
          <button 
            onClick={syncToCloud}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Syncing...' : 'Cloud Sync'}
          </button>
          <button 
            onClick={createBackup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Backing up...' : 'Create Manual Backup'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <DatabaseIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-900">Daily Auto-Backup Enabled</p>
          <p className="text-xs text-blue-700">The system automatically backs up your data every day at midnight.</p>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">File Name</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Size</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Date</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {backups.map((b) => (
              <tr key={b.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{b.name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{(b.size / 1024 / 1024).toFixed(2)} MB</td>
                <td className="px-4 py-3 text-sm text-slate-500">{new Date(b.date).toLocaleString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <a 
                    href={`/api/backups/download/${b.name}`}
                    className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                  >
                    Download
                  </a>
                  <button 
                    onClick={() => restoreBackup(b.name)}
                    className="text-orange-600 hover:text-orange-700 text-xs font-bold"
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No backups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SettingsModule({ onComplete }: { onComplete: () => void }) {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    
    // Optimistic update
    setSettings(prev => {
      const existing = prev.find(s => s.key === key);
      if (existing) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      } else {
        return [...prev, { key, value }];
      }
    });
    
    setTimeout(() => setSaving(null), 500);
    onComplete();
  };

  if (loading) return <div className="text-center p-10">Loading settings...</div>;

  const categories = [
    { title: 'MFS Agent & Personal Numbers', component: <ShopNumbersModule /> },
    { 
      title: 'MFS Opening Balances', 
      items: [
        { key: 'bkash_opening_balance', label: 'bKash Opening Balance' },
        { key: 'nagad_opening_balance', label: 'Nagad Opening Balance' },
        { key: 'rocket_opening_balance', label: 'Rocket Opening Balance' }
      ]
    },
    { 
      title: 'Recharge Opening Balances', 
      items: [
        { key: 'gp_opening_balance', label: 'GP Opening Balance' },
        { key: 'robi_opening_balance', label: 'Robi Opening Balance' },
        { key: 'bl_opening_balance', label: 'Banglalink Opening Balance' },
        { key: 'airtel_opening_balance', label: 'Airtel Opening Balance' },
        { key: 'teletalk_opening_balance', label: 'Teletalk Opening Balance' }
      ]
    },
    { 
      title: 'MFS Commissions (per 1000)', 
      items: [
        { key: 'bkash_cashout_comm', label: 'bKash Cashout Commission' },
        { key: 'nagad_cashout_comm', label: 'Nagad Cashout Commission' },
        { key: 'rocket_cashout_comm', label: 'Rocket Cashout Commission' }
      ]
    },
    { 
      title: 'Print & Copy Costs (per page)', 
      items: [
        { key: 'cost_bw', label: 'Black & White Cost (৳)' },
        { key: 'cost_color', label: 'Color Cost (৳)' }
      ]
    },
    { 
      title: 'Cloud Backup (Google Drive)', 
      items: [
        { key: 'google_drive_credentials', label: 'Service Account JSON' }
      ]
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {categories.map((cat, idx) => (
        <Card key={idx}>
          <h3 className="text-lg font-bold mb-4">{cat.title}</h3>
          {cat.component ? cat.component : (
            <div className="space-y-4">
              {cat.items?.map(item => {
                const setting = settings.find(s => s.key === item.key);
                const isCloud = item.key === 'google_drive_credentials';
                
                return (
                  <div key={item.key} className={`${isCloud ? 'flex-col items-start' : 'flex-row items-center justify-between'} flex gap-4`}>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-600">
                        {item.label}
                      </label>
                      {isCloud && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Paste your Google Service Account JSON key here. Enable Drive API in Google Cloud Console.
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 ${isCloud ? 'w-full' : ''} relative`}>
                      {!isCloud && <span className="text-slate-400 text-sm">৳</span>}
                      {isCloud ? (
                        <textarea
                          rows={4}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder='{"type": "service_account", ...}'
                          value={setting?.value || ''}
                          onChange={(e) => updateSetting(item.key, e.target.value)}
                        />
                      ) : (
                        <input 
                          type="number"
                          step="0.1"
                          className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-lg text-right outline-none focus:ring-2 focus:ring-emerald-500"
                          value={setting?.value || ''}
                          onChange={(e) => updateSetting(item.key, e.target.value)}
                        />
                      )}
                      {saving === item.key && (
                        <div className="absolute right-[-24px] text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ShopNumbersModule() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [formData, setFormData] = useState({ operator: 'bKash', type: 'Agent', number: '', password: '' });
  const [loading, setLoading] = useState(true);

  const fetchNumbers = async () => {
    const res = await fetch('/api/shop-numbers');
    const data = await res.json();
    setNumbers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/shop-numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ ...formData, number: '', password: '' });
    fetchNumbers();
  };

  const deleteNumber = async (id: number) => {
    if (!confirm('Delete this number?')) return;
    await fetch(`/api/shop-numbers/${id}`, { method: 'DELETE' });
    fetchNumbers();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
        <h4 className="text-sm font-bold text-slate-700 mb-4">Add New Number</h4>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Operator</label>
            <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })}>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
              <option value="GP">GP</option>
              <option value="Robi">Robi</option>
              <option value="BL">BL</option>
              <option value="Airtel">Airtel</option>
              <option value="Teletalk">Teletalk</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Type</label>
            <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="Agent">Agent</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Phone Number</label>
            <input type="tel" required className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Password/PIN (Optional)</label>
            <input type="text" className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button className="sm:col-span-2 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm">
            Add Number
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {numbers.map(n => (
          <div key={n.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${n.type === 'Agent' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {n.type}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{n.operator}</span>
              </div>
              <p className="text-sm font-black mt-0.5">{n.number}</p>
              {n.password && <p className="text-[10px] text-slate-400">PIN: {n.password}</p>}
            </div>
            <button onClick={() => deleteNumber(n.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {numbers.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No shop numbers added yet.</p>}
      </div>
    </div>
  );
}

// --- Helper Components ---

function PaymentInput({ 
  totalAmount, 
  onPaymentChange,
  isExpense = false
}: { 
  totalAmount: number; 
  onPaymentChange: (data: { status: string; paid: number; due: number; customerId: string | null }) => void;
  isExpense?: boolean;
}) {
  const [status, setStatus] = useState('Paid');
  const [paid, setPaid] = useState(totalAmount.toString());
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    if (status === 'Paid') {
      setPaid(totalAmount.toString());
    } else if (status === 'Due') {
      setPaid('0');
    }
  }, [status, totalAmount]);

  useEffect(() => {
    const due = totalAmount - parseFloat(paid || '0');
    onPaymentChange({ 
      status, 
      paid: parseFloat(paid || '0'), 
      due: Math.max(0, due), 
      customerId: customerId || null 
    });
  }, [status, paid, customerId, totalAmount]);

  useEffect(() => {
    if (status !== 'Paid') {
      const fetchData = async () => {
        try {
          if (isExpense) {
            const res = await fetch('/api/vendors');
            if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
              setVendors(await res.json());
            }
          } else {
            const res = await fetch('/api/customers');
            if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
              setCustomers(await res.json());
            }
          }
        } catch (err) {
          console.error("Failed to fetch data for payment input:", err);
        }
      };
      fetchData();
    }
  }, [status, isExpense]);

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
      <div className="flex gap-2">
        {['Paid', 'Partial', 'Due'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
              status === s 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {s === 'Paid' ? 'নগদ পরিশোধ' : s === 'Partial' ? 'আংশিক' : 'সম্পুর্ণ বাকি'}
          </button>
        ))}
      </div>

      {status === 'Partial' && (
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Paid Amount</label>
          <input 
            type="number" 
            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
            value={paid}
            onChange={e => setPaid(e.target.value)}
          />
          <p className="text-xs text-red-500 mt-1 font-bold">Due: ৳{Math.max(0, totalAmount - parseFloat(paid || '0'))}</p>
        </div>
      )}

      {status !== 'Paid' && (
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
            {isExpense ? 'Select Vendor' : 'Select Customer'}
          </label>
          <select 
            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            required
          >
            <option value="">Choose...</option>
            {isExpense ? (
              vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
            ) : (
              customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
            )}
          </select>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-50 text-emerald-700 font-bold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all ${
        active ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'
      }`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
