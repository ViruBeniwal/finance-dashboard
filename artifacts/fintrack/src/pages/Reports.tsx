import { useGetSummary, useListTransactions } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function csvEscape(value: string | number | null): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function Reports() {
  const { data: summary, isLoading } = useGetSummary();
  const { data: transactions } = useListTransactions();

  const handleExportCsv = () => {
    const rows = transactions ?? [];
    const header = ["Date", "Description", "Category", "Type", "Amount", "Notes"];
    const lines = [
      header.join(","),
      ...rows.map((t) =>
        [t.date, t.description, t.category, t.type, t.amount, t.notes ?? ""]
          .map(csvEscape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!summary) return null;

  const { currentMonth, monthlyTrend, expenseByCategory } = summary;
  const totalExpenses = expenseByCategory.reduce((s, c) => s + c.amount, 0);
  const savingsRate =
    currentMonth.income > 0
      ? (currentMonth.savings / currentMonth.income) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={!transactions || transactions.length === 0}
        >
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          color={savingsRate >= 0 ? "#2C5F2E" : "#8B2635"}
        />
        <MetricCard
          title="This Month Income"
          value={formatCurrency(currentMonth.income)}
        />
        <MetricCard
          title="This Month Expenses"
          value={formatCurrency(currentMonth.expenses)}
        />
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Income vs Expenses (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyTrend}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E2DC" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B6B6B" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B6B6B" }}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "#FAFAF7" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E2E2DC" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend iconType="circle" />
              <Bar dataKey="income" name="Income" fill="#2C5F2E" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#8B2635"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="investments"
                name="Investments"
                fill="#1A4A6B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Expense Breakdown — This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseByCategory.length > 0 ? (
                expenseByCategory.map((c) => (
                  <TableRow key={c.category}>
                    <TableCell className="font-medium">{c.category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalExpenses > 0
                        ? ((c.amount / totalExpenses) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No expenses this month.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Month-over-Month Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Investments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyTrend.length > 0 ? (
                monthlyTrend.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{m.month}</TableCell>
                    <TableCell className="text-right" style={{ color: "#2C5F2E" }}>
                      {formatCurrency(m.income)}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: "#8B2635" }}>
                      {formatCurrency(m.expenses)}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: m.savings >= 0 ? "#2C5F2E" : "#8B2635" }}
                    >
                      {formatCurrency(m.savings)}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: "#1A4A6B" }}>
                      {formatCurrency(m.investments)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No data to compare.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p
          className="text-3xl font-semibold tracking-tight text-foreground"
          style={color ? { color } : undefined}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
