import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBanking, Transaction } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingDown, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { EXPENSE_CATEGORIES, getCategoryLabel, getCategoryColor, categorizeTransaction } from '@/lib/bankData';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function Expenses() {
  const { transactions, loading } = useBanking();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Filter transactions by date range and only expenses (negative amounts)
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      const isInRange = txDate >= daysAgo;
      const isExpense = tx.amount < 0;
      const category = tx.category || categorizeTransaction(tx.description || '');
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      
      return isInRange && isExpense && matchesCategory;
    });
  }, [transactions, dateRange, selectedCategory]);

  // Calculate totals by category
  const categoryTotals = useMemo(() => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    const totals: Record<string, number> = {};
    
    transactions.forEach((tx) => {
      const txDate = new Date(tx.created_at);
      if (txDate >= daysAgo && tx.amount < 0) {
        const category = tx.category || categorizeTransaction(tx.description || '');
        totals[category] = (totals[category] || 0) + Math.abs(tx.amount);
      }
    });
    
    return totals;
  }, [transactions, dateRange]);

  const pieChartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: getCategoryLabel(category),
        value: value,
        fill: getCategoryColor(category),
      }));
  }, [categoryTotals]);

  const totalExpenses = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  }, [categoryTotals]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      config[cat.id] = { label: cat.label, color: getCategoryColor(cat.id) };
    });
    return config;
  }, []);

  // Insights
  const topCategory = useMemo(() => {
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return null;
    return entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
  }, [categoryTotals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Expense Tracking</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Summary Card */}
        <Card variant="elevated" className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent ({dateRange} days)</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Insights */}
        {topCategory && totalExpenses > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <p className="text-sm">
                <span className="font-medium">{getCategoryLabel(topCategory[0])}</span> is your top expense category at{' '}
                <span className="font-semibold">{formatCurrency(topCategory[1])}</span>{' '}
                ({Math.round((topCategory[1] / totalExpenses) * 100)}% of total)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        {pieChartData.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pieChartData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card variant="elevated">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No expense data for the selected period.</p>
            </CardContent>
          </Card>
        )}

        {/* Transaction List */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No expenses found.</p>
            ) : (
              filteredTransactions.slice(0, 10).map((tx) => {
                const category = tx.category || categorizeTransaction(tx.description || '');
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <Badge variant="secondary" className="text-xs mt-1">{getCategoryLabel(category)}</Badge>
                      </div>
                    </div>
                    <span className="font-semibold text-destructive">{formatCurrency(tx.amount)}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
