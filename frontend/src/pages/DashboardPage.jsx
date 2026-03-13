import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  X,
  CheckCircle2,
  Check,
  Tag,
  Tags,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  amount: "",
  type: "EXPENSE",
  category: "",
  merchant: "",
  date: null, // now a Date object or null
};

function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------
function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  // Inline edit — only category
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // pendingEdit = { id, merchant, newCategory, oldCategory }
  const [pendingEdit, setPendingEdit] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const res = await fetch(`${API_BASE_URL}/transactions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : data.transactions ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const gmailStatus = searchParams.get("gmail");
    if (gmailStatus === "connected") {
      setGmailConnected(true);
      setSearchParams({});
      setTimeout(() => fetchEmails(), 2000);
      setTimeout(() => setGmailConnected(false), 4000);
    }
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // Gmail sync
  // ---------------------------------------------------------------------------
  const fetchEmails = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/gmail/fetch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      setLoading(false);
      setSyncing(true);
      setTimeout(() => fetchTransactions(), 5000);
      setTimeout(() => fetchTransactions(), 15000);
      setTimeout(() => fetchTransactions(), 30000);
      setTimeout(() => setSyncing(false), 30000);
    } catch (err) {
      console.error("Fetch failed:", err);
      setLoading(false);
      setSyncing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Add Transaction
  // ---------------------------------------------------------------------------
  const handleFormChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  // Date picker sets a Date object
  const handleDateChange = (date) => setFormData((prev) => ({ ...prev, date }));

  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      setFormSaving(true);

      // Convert Date → ISO string for the API
      const payload = {
        ...formData,
        date: formData.date ? format(formData.date, "yyyy-MM-dd") : "",
      };

      await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      setShowAddDialog(false);
      setFormData(EMPTY_FORM);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to add transaction:", err);
    } finally {
      setFormSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Inline Category Edit
  // ---------------------------------------------------------------------------
  const startEdit = (tx) => {
    setEditingId(tx.id);
    setEditCategory(tx.category ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory("");
  };

  const requestSave = (tx) => {
    const trimmed = editCategory.trim();
    if (!trimmed || trimmed === tx.category) {
      cancelEdit();
      return;
    }
    setEditingId(null);
    setPendingEdit({
      id: tx.id,
      merchant: tx.merchant,
      newCategory: trimmed,
      oldCategory: tx.category,
    });
  };

  const handleEditKeyDown = (e, tx) => {
    if (e.key === "Enter") requestSave(tx);
    if (e.key === "Escape") cancelEdit();
  };

  // ---------------------------------------------------------------------------
  // Apply category scope
  // ---------------------------------------------------------------------------
  const applyCategory = async (applyToAll) => {
    if (!pendingEdit) return;
    const { id, merchant, newCategory } = pendingEdit;
    try {
      setEditSaving(true);
      if (applyToAll && merchant) {
        await fetch(`${API_BASE_URL}/transactions/bulk-categorize`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ merchant, category: newCategory }),
        });
      } else {
        await fetch(`${API_BASE_URL}/transactions/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category: newCategory }),
        });
      }
      setPendingEdit(null);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to update category:", err);
    } finally {
      setEditSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  const deleteTransaction = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDeletingId(null);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <Navbar onFetchEmails={fetchEmails} loading={loading} syncing={syncing} />
      <div className="px-8 py-6 max-w-7xl mx-auto space-y-5">
        {/* ── Banners ── */}
        {gmailConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Gmail connected successfully.
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Contacting Gmail…
          </div>
        )}
        {syncing && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400 text-sm">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Syncing emails in background — transactions will appear shortly…
            </span>
            <button
              onClick={() => {
                setSyncing(false);
                fetchTransactions();
              }}
              className="ml-4 hover:opacity-60 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Transactions
          </h1>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-6 w-[130px] text-muted-foreground font-medium">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Merchant
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Category
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Type
                </TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">
                  Amount
                </TableHead>
                <TableHead className="pr-6 w-[100px] text-center text-muted-foreground font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-36 text-center text-muted-foreground text-sm">
                    No transactions yet. Add one or sync Gmail.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const isEditing = editingId === tx.id;
                  const isIncome = tx.type === "INCOME";
                  return (
                    <TableRow
                      key={tx.id}
                      className="border-border hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-6 py-3.5 text-sm text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm font-medium text-foreground">
                        {tx.merchant || "—"}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, tx)}
                              autoFocus
                              className="h-7 w-36 text-xs"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => requestSave(tx)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm uppercase tracking-wide text-muted-foreground">
                            {tx.category || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          className={
                            isIncome
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15 font-medium"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15 font-medium"
                          }>
                          {isIncome ? "Income" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            isIncome
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-700 dark:text-rose-400"
                          }`}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => startEdit(tx)}
                            disabled={isEditing}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog
                            open={deletingId === tx.id}
                            onOpenChange={(open) =>
                              !open && setDeletingId(null)
                            }>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10"
                                onClick={() => setDeletingId(tx.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">
                                  Delete transaction?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This will permanently remove{" "}
                                  <span className="text-foreground font-medium">
                                    {tx.merchant || "this transaction"}
                                  </span>
                                  {tx.amount
                                    ? ` (${formatCurrency(tx.amount)})`
                                    : ""}
                                  . This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:bg-muted">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-700"
                                  onClick={() => deleteTransaction(tx.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Category Scope Confirmation Dialog ── */}
        <Dialog
          open={!!pendingEdit}
          onOpenChange={(open) => {
            if (!open && !editSaving) setPendingEdit(null);
          }}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <DialogHeader>
                <DialogTitle className="text-base text-foreground">
                  Apply category change
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm pt-1">
                  You're changing the category to{" "}
                  <span className="text-foreground font-semibold">
                    {pendingEdit?.newCategory}
                  </span>
                  {pendingEdit?.merchant && (
                    <>
                      {" "}
                      for{" "}
                      <span className="text-foreground font-semibold">
                        {pendingEdit.merchant}
                      </span>
                    </>
                  )}
                  . How would you like to apply this?
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 pb-6 pt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => applyCategory(false)}
                disabled={editSaving}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-border/80 p-4 text-left transition-all disabled:opacity-50 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background group-hover:bg-muted transition-colors border border-border">
                  <Tag className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  This transaction only
                </p>
              </button>
              <button
                onClick={() => applyCategory(true)}
                disabled={editSaving}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-border/80 p-4 text-left transition-all disabled:opacity-50 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background group-hover:bg-muted transition-colors border border-border">
                  <Tags className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  All from{" "}
                  <span className="font-semibold">
                    {pendingEdit?.merchant || "this merchant"}
                  </span>
                </p>
              </button>
            </div>
            {editSaving && (
              <div className="border-t border-border px-6 py-3 flex items-center gap-2 text-muted-foreground text-xs bg-muted/30">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Applying changes…
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Add Transaction Dialog ── */}
        <Dialog
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) setFormData(EMPTY_FORM);
          }}>
          <DialogContent className="sm:max-w-[440px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Add Transaction
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={addTransaction} className="space-y-4 pt-2">
              {/* Amount + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => handleSelectChange("type", val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="INCOME">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g. Food, Transport"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                />
              </div>

              {/* Merchant */}
              <div className="space-y-1.5">
                <Label htmlFor="merchant">
                  Merchant{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="merchant"
                  name="merchant"
                  placeholder="e.g. Swiggy, Amazon"
                  value={formData.merchant}
                  onChange={handleFormChange}
                />
              </div>

              {/* Date — ShadCN Date Picker */}
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {formData.date
                        ? format(formData.date, "dd MMM yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-card border-border"
                    align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setFormData(EMPTY_FORM);
                  }}
                  disabled={formSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formSaving}>
                  {formSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Transaction
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default DashboardPage;
