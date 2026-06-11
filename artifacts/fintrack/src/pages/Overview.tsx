import { useGetSummary } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const CHART_COLORS = ['#2C5F2E', '#8B2635', '#1A4A6B', '#8B6914', '#4A4A8A'];

export default function Overview() {
  const { data: summary, isLoading } = useGetSummary();

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading dashboard...</div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Income" amount={summary.currentMonth.income} />
        <MetricCard title="Total Expenses" amount={summary.currentMonth.expenses} />
        <MetricCard title="Net Savings" amount={summary.currentMonth.savings} />
        <MetricCard title="Total Investments" amount={summary.currentMonth.investments} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E2DC" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip cursor={{ fill: '#FAFAF7' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E2DC' }} />
                <Legend iconType="circle" />
                <Bar dataKey="income" name="Income" fill="#2C5F2E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#8B2635" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings" name="Savings" fill="#1A4A6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.expenseByCategory.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                No expenses this month
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={summary.expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="category"
                        isAnimationActive={false}
                      >
                        {summary.expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E2DC' }} formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-1 gap-1.5">
                  {summary.expenseByCategory.map((entry, index) => (
                    <div key={entry.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground truncate">{entry.category}</span>
                      </div>
                      <span className="font-medium text-foreground">{formatCurrency(entry.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Savings Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.savingsTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E2DC" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E2DC' }} formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="savings" name="Savings" stroke="#1A4A6B" strokeWidth={3} dot={{ r: 4, fill: '#1A4A6B' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, amount }: { title: string; amount: number }) {
  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">{formatCurrency(amount)}</p>
      </CardContent>
    </Card>
  );
}
