import { useState, type ReactNode } from "react";
import {
  useCreateTransaction,
  useUpdateTransaction,
  getListTransactionsQueryKey,
  getGetSummaryQueryKey,
  getListBudgetsQueryKey,
  type Transaction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TxType = keyof typeof CATEGORIES;

const TYPES: TxType[] = ["Income", "Expense", "Investment", "Saving"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Errors = Partial<
  Record<"description" | "category" | "date" | "amount", string>
>;

export function AddTransactionDialog({
  transaction,
  trigger,
}: {
  transaction?: Transaction;
  trigger?: ReactNode;
}) {
  const isEdit = Boolean(transaction);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>(
    (transaction?.type as TxType) ?? "Expense",
  );
  const [date, setDate] = useState(transaction?.date ?? todayISO());
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : "",
  );
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const queryClient = useQueryClient();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const { toast } = useToast();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetToTransaction = () => {
    setType((transaction?.type as TxType) ?? "Expense");
    setDate(transaction?.date ?? todayISO());
    setDescription(transaction?.description ?? "");
    setCategory(transaction?.category ?? "");
    setAmount(transaction ? String(transaction.amount) : "");
    setNotes(transaction?.notes ?? "");
    setErrors({});
  };

  const handleTypeChange = (value: string) => {
    setType(value as TxType);
    setCategory("");
    setErrors((e) => ({ ...e, category: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!description.trim()) next.description = "Description is required.";
    if (!category) next.category = "Select a category.";
    if (!date) next.date = "Date is required.";
    const numericAmount = Number(amount);
    if (amount === "" || !(numericAmount > 0))
      next.amount = "Enter an amount greater than 0.";
    return next;
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      date,
      description: description.trim(),
      category,
      type,
      amount: Number(amount),
      notes: notes.trim() ? notes.trim() : null,
    };

    const onSuccess = () => {
      invalidate();
      toast({ title: isEdit ? "Transaction updated" : "Transaction added" });
      setOpen(false);
    };
    const onError = () =>
      toast({
        title: isEdit ? "Could not update transaction" : "Could not add transaction",
        description: "Please try again.",
        variant: "destructive",
      });

    if (isEdit && transaction) {
      updateMutation.mutate(
        { id: transaction.id, data: payload },
        { onSuccess, onError },
      );
    } else {
      createMutation.mutate({ data: payload }, { onSuccess, onError });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetToTransaction();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrors((er) => ({ ...er, date: undefined }));
                }}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              placeholder="e.g. Monthly groceries"
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((er) => ({ ...er, description: undefined }));
              }}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  setErrors((er) => ({ ...er, category: undefined }));
                }}
              >
                <SelectTrigger id="category" aria-invalid={Boolean(errors.category)}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[type].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={amount}
                placeholder="0"
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((er) => ({ ...er, amount: undefined }));
                }}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes ?? ""}
              placeholder="Add a note..."
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEdit
                ? "Saving..."
                : "Adding..."
              : isEdit
                ? "Save Changes"
                : "Add Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
