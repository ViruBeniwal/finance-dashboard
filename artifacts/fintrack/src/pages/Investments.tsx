import { useGetSummary, useListTransactions } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = ["#2C5F2E", "#8B2635", "#1A4A6B", "#8B6914", "#4A4A8A"];

export default function Investments() {
  const { data: summary, isLoading: summaryLoading } = useGetSummary();
  const { data: investments, isLoading: txLoading } = useListTransactions({
    type: "Investment",
  });

  if (summaryLoading || txLoading)
    return <div className="p-8 text-muted-foreground">Loading...</div>;

  const byCategory = new Map<string, number>();
  for (const t of investments ?? []) {
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
  }
  const breakdown = Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Investments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Total Invested"
          amount={summary?.totalInvested ?? 0}
        />
        <MetricCard
          title="Invested This Month"
          amount={summary?.investedThisMonth ?? 0}
        />
        <MetricCard title="Holdings" amount={breakdown.length} isCount />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No investments yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="category"
                        isAnimationActive={false}
                      >
                        {breakdown.map((entry, index) => (
                          <Cell
                            key={entry.category}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E2E2DC",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                <div className="mt-4 space-y-1.5">
                  {breakdown.map((entry, index) => (
                    <div
                      key={entry.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground truncate">
                          {entry.category}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {formatCurrency(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Investment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments && investments.length > 0 ? (
                  investments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {format(new Date(t.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.description}
                      </TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[220px] truncate">
                        {t.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No investments recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  amount,
  isCount,
}: {
  title: string;
  amount: number;
  isCount?: boolean;
}) {
  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {isCount ? amount : formatCurrency(amount)}
        </p>
      </CardContent>
    </Card>
  );
}
