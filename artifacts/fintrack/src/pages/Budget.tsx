import { useState } from "react";
import {
  useListBudgets,
  useGetSummary,
  useSetBudget,
  getListBudgetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

const FOREST = "#2C5F2E";
const RED = "#8B2635";
const AMBER = "#8B6914";

function barColorForPct(pct: number): string {
  if (pct > 90) return RED;
  if (pct >= 70) return AMBER;
  return FOREST;
}

export default function Budget() {
  const { data: budgets, isLoading: budgetsLoading } = useListBudgets();
  const { data: summary, isLoading: summaryLoading } = useGetSummary();
  const setBudget = useSetBudget();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });

  if (budgetsLoading || summaryLoading)
    return <div className="p-8 text-muted-foreground">Loading...</div>;

  const limitByCategory = new Map(
    (budgets ?? []).map((b) => [b.category, b.limit]),
  );
  const spentByCategory = new Map(
    (summary?.expenseByCategory ?? []).map((c) => [c.category, c.amount]),
  );

  const totalLimit = (budgets ?? []).reduce((s, b) => s + b.limit, 0);
  const totalSpent = CATEGORIES.Expense.reduce(
    (s, c) => s + (spentByCategory.get(c) ?? 0),
    0,
  );

  const handleSave = (category: string) => {
    const raw = drafts[category];
    const numericLimit = Number(raw);
    if (raw === undefined || raw === "" || !(numericLimit >= 0)) {
      toast({
        title: "Enter a valid limit",
        description: "Limit must be 0 or more.",
        variant: "destructive",
      });
      return;
    }
    setBudget.mutate(
      { data: { category, limit: numericLimit } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: `${category} budget saved` });
          setDrafts((d) => {
            const next = { ...d };
            delete next[category];
            return next;
          });
        },
        onError: () =>
          toast({ title: "Could not save budget", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Budget</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <SummaryCard title="Total Budget" amount={totalLimit} />
        <SummaryCard title="Total Spent" amount={totalSpent} />
        <SummaryCard
          title="Remaining"
          amount={totalLimit - totalSpent}
          color={totalLimit - totalSpent < 0 ? RED : FOREST}
        />
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Monthly Budget Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {CATEGORIES.Expense.map((category) => {
            const limit = limitByCategory.get(category) ?? 0;
            const spent = spentByCategory.get(category) ?? 0;
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const barColor = barColorForPct(pct);
            const draft = drafts[category];
            const inputValue = draft !== undefined ? draft : limit ? String(limit) : "";
            const dirty = draft !== undefined && draft !== String(limit);

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatCurrency(spent)} spent
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 w-28"
                        placeholder="Set limit"
                        value={inputValue}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [category]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(category);
                        }}
                      />
                      <Button
                        size="icon"
                        variant={dirty ? "default" : "outline"}
                        className="h-8 w-8"
                        disabled={!dirty || setBudget.isPending}
                        onClick={() => handleSave(category)}
                        aria-label={`Save ${category} budget`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {limit > 0 ? (
                  <>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: barColor }}>{pct.toFixed(0)}% used</span>
                      <span className="text-muted-foreground">
                        of {formatCurrency(limit)}
                        {spent > limit
                          ? ` · over by ${formatCurrency(spent - limit)}`
                          : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No budget set yet.</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  color,
}: {
  title: string;
  amount: number;
  color?: string;
}) {
  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p
          className="text-3xl font-semibold tracking-tight"
          style={color ? { color } : undefined}
        >
          {formatCurrency(amount)}
        </p>
      </CardContent>
    </Card>
  );
}
