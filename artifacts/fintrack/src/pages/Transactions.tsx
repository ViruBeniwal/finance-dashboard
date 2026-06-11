import { useMemo, useState } from "react";
import {
  useListTransactions,
  useDeleteTransaction,
  useBulkDeleteTransactions,
  getListTransactionsQueryKey,
  getGetSummaryQueryKey,
  getListBudgetsQueryKey,
  type Transaction,
} from "@workspace/api-client-react";
import { formatCurrency, CATEGORIES } from "@/lib/constants";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Trash2, Pencil, ArrowUpDown } from "lucide-react";

const TYPE_OPTIONS = ["Income", "Expense", "Investment", "Saving"] as const;
const QUICK_RANGES = [
  "This Week",
  "This Month",
  "This Quarter",
  "This Year",
  "All Time",
] as const;
type QuickRange = (typeof QUICK_RANGES)[number];

const ALL_CATEGORIES = Array.from(
  new Set([
    ...CATEGORIES.Income,
    ...CATEGORIES.Expense,
    ...CATEGORIES.Investment,
    ...CATEGORIES.Saving,
  ]),
);

type SortKey = "date" | "description" | "category" | "type" | "amount";

function isoFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function rangeStart(range: QuickRange, now = new Date()): string | "" {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case "This Week": {
      const day = now.getDay();
      const diff = (day + 6) % 7; // Monday as start
      const start = new Date(y, m, now.getDate() - diff);
      return isoFromDate(start);
    }
    case "This Month":
      return isoFromDate(new Date(y, m, 1));
    case "This Quarter":
      return isoFromDate(new Date(y, Math.floor(m / 3) * 3, 1));
    case "This Year":
      return isoFromDate(new Date(y, 0, 1));
    case "All Time":
      return "";
  }
}

export default function Transactions() {
  const { data: transactions, isLoading } = useListTransactions();
  const deleteMutation = useDeleteTransaction();
  const bulkDeleteMutation = useBulkDeleteTransactions();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeRange, setActiveRange] = useState<QuickRange>("All Time");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
  };

  const applyQuickRange = (range: QuickRange) => {
    setActiveRange(range);
    setStartDate(rangeStart(range));
    setEndDate(range === "All Time" ? "" : isoFromDate(new Date()));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "amount" || key === "date" ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    let rows = (transactions ?? []).filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !t.description.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "amount") cmp = a.amount - b.amount;
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [transactions, typeFilter, categoryFilter, startDate, endDate, search, sortKey, sortDir]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (filtered.every((t) => prev.has(t.id))) {
        const next = new Set(prev);
        filtered.forEach((t) => next.delete(t.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
    );
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(
      { data: { ids: Array.from(selected) } },
      {
        onSuccess: () => {
          invalidate();
          setSelected(new Set());
        },
      },
    );
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setActiveRange("All Time");
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <AddTransactionDialog />
      </div>

      {/* Quick ranges */}
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={activeRange === r ? "default" : "outline"}
            onClick={() => applyQuickRange(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          placeholder="Search description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setActiveRange("All Time");
          }}
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setActiveRange("All Time");
          }}
        />
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
          {selected.size > 0 ? ` · ${selected.size} selected` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
          {selected.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} transactions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <SortHeader label="Date" col="date" sortKey={sortKey} onSort={handleSort} />
              <SortHeader
                label="Description"
                col="description"
                sortKey={sortKey}
                onSort={handleSort}
              />
              <SortHeader
                label="Category"
                col="category"
                sortKey={sortKey}
                onSort={handleSort}
              />
              <SortHeader label="Type" col="type" sortKey={sortKey} onSort={handleSort} />
              <SortHeader
                label="Amount"
                col="amount"
                sortKey={sortKey}
                onSort={handleSort}
                align="right"
              />
              <TableHead className="w-[96px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} data-state={selected.has(t.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(t.id)}
                    onCheckedChange={() => toggleOne(t.id)}
                    aria-label={`Select ${t.description}`}
                  />
                </TableCell>
                <TableCell>{format(new Date(t.date), "MMM dd, yyyy")}</TableCell>
                <TableCell className="font-medium">{t.description}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  <TypeBadge type={t.type} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <AddTransactionDialog
                      transaction={t as Transaction}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Edit">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <DeleteRowButton onConfirm={() => handleDelete(t.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  col,
  sortKey,
  onSort,
  align,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
  align?: "right";
}) {
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        } ${sortKey === col ? "text-foreground font-medium" : ""}`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cls =
    type === "Income"
      ? "bg-[#2C5F2E]/10 text-[#2C5F2E]"
      : type === "Expense"
        ? "bg-[#8B2635]/10 text-[#8B2635]"
        : "bg-secondary text-secondary-foreground";
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}
    >
      {type}
    </span>
  );
}

function DeleteRowButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
