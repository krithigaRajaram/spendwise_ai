import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, FilterX } from "lucide-react";
import Navbar from "../components/Navbar";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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

const EMPTY_FORM = {
  amount: "",
  type: "EXPENSE",
  category: "",
  merchant: "",
  date: null,
};

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEARS = Array.from({ length: 5 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

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

function DashboardPage({ onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailAlreadyConnected, setGmailAlreadyConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  // Category edit
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);

  // Merchant edit
  const [editingMerchantId, setEditingMerchantId] = useState(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [merchantEditSaving, setMerchantEditSaving] = useState(false);
  const [pendingMerchantEdit, setPendingMerchantEdit] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [filterMode, setFilterMode] = useState("month"); // "month" | "range"
  const [filterType, setFilterType] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterFrom, setFilterFrom] = useState(null);
  const [filterTo, setFilterTo] = useState(null);

  // Build query string from filters
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    if (filterType !== "ALL") params.set("type", filterType);

    if (filterMode === "month") {
      params.set("month", filterMonth);
      params.set("year", filterYear);
    } else if (filterMode === "range") {
      if (filterFrom) params.set("from", format(filterFrom, "yyyy-MM-dd"));
      if (filterTo) params.set("to", format(filterTo, "yyyy-MM-dd"));
    }

    return params.toString();
  }, [filterMode, filterType, filterMonth, filterYear, filterFrom, filterTo]);

  // Data fetching
  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const query = buildQuery();
      const res = await fetch(
        `${API_BASE_URL}/transactions${query ? `?${query}` : ""}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : data.transactions ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, [buildQuery]);

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
    if (gmailStatus === "already_connected") {
      setGmailAlreadyConnected(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const resetFilters = () => {
    setFilterMode("month");
    setFilterType("ALL");
    setFilterMonth(String(new Date().getMonth() + 1));
    setFilterYear(String(new Date().getFullYear()));
    setFilterFrom(null);
    setFilterTo(null);
  };

  const hasActiveFilters =
    filterType !== "ALL" ||
    filterMode === "range" ||
    filterMonth !== String(new Date().getMonth() + 1) ||
    filterYear !== String(new Date().getFullYear());

  // Gmail sync
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

  // Add Transaction
  const handleFormChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleDateChange = (date) => setFormData((prev) => ({ ...prev, date }));

  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      setFormSaving(true);
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

  // Category edit
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

  // Merchant edit
  const startMerchantEdit = (tx) => {
    setEditingMerchantId(tx.id);
    setEditMerchant(tx.merchantDisplay || tx.merchant || "");
  };

  const cancelMerchantEdit = () => {
    setEditingMerchantId(null);
    setEditMerchant("");
  };

  const requestMerchantSave = (tx) => {
    const trimmed = editMerchant.trim();
    if (!trimmed || trimmed === (tx.merchantDisplay || tx.merchant)) {
      cancelMerchantEdit();
      return;
    }
    setEditingMerchantId(null);
    setPendingMerchantEdit({
      id: tx.id,
      originalMerchant: tx.merchant,
      newMerchant: trimmed,
    });
  };

  const handleMerchantEditKeyDown = (e, tx) => {
    if (e.key === "Enter") requestMerchantSave(tx);
    if (e.key === "Escape") cancelMerchantEdit();
  };

  const applyMerchant = async (applyToAll) => {
    if (!pendingMerchantEdit) return;
    const { id, originalMerchant, newMerchant } = pendingMerchantEdit;
    try {
      setMerchantEditSaving(true);
      if (applyToAll && originalMerchant) {
        await fetch(`${API_BASE_URL}/transactions/merchant-mapping`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ merchant: originalMerchant, merchantOverride: newMerchant }),
        });
      } else {
        await fetch(`${API_BASE_URL}/transactions/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ merchant: newMerchant }),
        });
      }
      setPendingMerchantEdit(null);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to update merchant:", err);
    } finally {
      setMerchantEditSaving(false);
    }
  };

  // Delete
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

  // Render
  return (
    <>
      <Navbar onFetchEmails={fetchEmails} loading={loading} syncing={syncing} onLogout={onLogout} />
      <div className="px-8 py-6 max-w-7xl mx-auto space-y-5">

        {/* ── Banners ── */}
        {gmailConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Gmail connected successfully.
          </div>
        )}
        {gmailAlreadyConnected && (
          <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-rose-700 dark:text-rose-400 text-sm font-medium">
            <span>This Gmail account is already connected to another user.</span>
            <button
              onClick={() => setGmailAlreadyConnected(false)}
              className="ml-4 hover:opacity-60 transition-opacity">
              <X className="h-4 w-4" />
            </button>
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
              onClick={() => { setSyncing(false); fetchTransactions(); }}
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
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">

          {/* Filter Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 gap-0.5">
            <button
              onClick={() => setFilterMode("month")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              Month
            </button>
            <button
              onClick={() => setFilterMode("range")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "range"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              Date Range
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              All Time
            </button>
          </div>

          {/* Month/Year selectors */}
          {filterMode === "month" && (
            <div className="flex items-center gap-2">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range pickers */}
          {filterMode === "range" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs gap-1.5",
                      !filterFrom && "text-muted-foreground"
                    )}>
                    <CalendarIcon className="h-3 w-3" />
                    {filterFrom ? format(filterFrom, "dd MMM yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={filterFrom}
                    onSelect={setFilterFrom}
                    disabled={(date) => filterTo ? date > filterTo : date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground text-xs">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs gap-1.5",
                      !filterTo && "text-muted-foreground"
                    )}>
                    <CalendarIcon className="h-3 w-3" />
                    {filterTo ? format(filterTo, "dd MMM yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={filterTo}
                    onSelect={setFilterTo}
                    disabled={(date) => date > new Date() || (filterFrom ? date < filterFrom : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Type filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              <SelectItem value="EXPENSE" className="text-xs">Expense</SelectItem>
              <SelectItem value="INCOME" className="text-xs">Income</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={resetFilters}>
              <FilterX className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}

          {/* Transaction count */}
          <span className="ml-auto text-xs text-muted-foreground">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-6 w-[130px] text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Merchant</TableHead>
                <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Amount</TableHead>
                <TableHead className="pr-6 w-[100px] text-center text-muted-foreground font-medium">Actions</TableHead>
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
                  <TableCell colSpan={6} className="h-36 text-center text-muted-foreground text-sm">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const isEditingCategory = editingId === tx.id;
                  const isEditingMerchant = editingMerchantId === tx.id;
                  const isIncome = tx.type === "INCOME";
                  return (
                    <TableRow key={tx.id} className="border-border hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-6 py-3.5 text-sm text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>

                      {/* Merchant */}
                      <TableCell className="py-3.5 text-sm font-medium text-foreground">
                        {isEditingMerchant ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={editMerchant}
                              onChange={(e) => setEditMerchant(e.target.value)}
                              onKeyDown={(e) => handleMerchantEditKeyDown(e, tx)}
                              autoFocus
                              className="h-7 w-36 text-xs"
                            />
                            <Button size="icon" variant="ghost"
                              className="h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => requestMerchantSave(tx)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={cancelMerchantEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:text-muted-foreground transition-colors"
                            onClick={() => startMerchantEdit(tx)}>
                            {tx.merchantDisplay || tx.merchant || "—"}
                          </span>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-3.5">
                        {isEditingCategory ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, tx)}
                              autoFocus
                              className="h-7 w-36 text-xs"
                            />
                            <Button size="icon" variant="ghost"
                              className="h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => requestSave(tx)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost"
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
                        <Badge className={
                          isIncome
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15 font-medium"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15 font-medium"
                        }>
                          {isIncome ? "Income" : "Expense"}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${
                          isIncome
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}>
                          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                      </TableCell>

                      <TableCell className="pr-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => startEdit(tx)}
                            disabled={isEditingCategory}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog
                            open={deletingId === tx.id}
                            onOpenChange={(open) => !open && setDeletingId(null)}>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10"
                                onClick={() => setDeletingId(tx.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Delete transaction?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This will permanently remove{" "}
                                  <span className="text-foreground font-medium">
                                    {tx.merchantDisplay || tx.merchant || "this transaction"}
                                  </span>
                                  {tx.amount ? ` (${formatCurrency(tx.amount)})` : ""}. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
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

        {/* ── Category Scope Dialog ── */}
        <Dialog open={!!pendingEdit} onOpenChange={(open) => { if (!open && !editSaving) setPendingEdit(null); }}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <DialogHeader>
                <DialogTitle className="text-base text-foreground">Apply category change</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm pt-1">
                  You're changing the category to{" "}
                  <span className="text-foreground font-semibold">{pendingEdit?.newCategory}</span>
                  {pendingEdit?.merchant && (
                    <> for <span className="text-foreground font-semibold">{pendingEdit.merchant}</span></>
                  )}. How would you like to apply this?
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 pb-6 pt-3 grid grid-cols-2 gap-3">
              <button onClick={() => applyCategory(false)} disabled={editSaving}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-border/80 p-4 text-left transition-all disabled:opacity-50 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background group-hover:bg-muted transition-colors border border-border">
                  <Tag className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">This transaction only</p>
              </button>
              <button onClick={() => applyCategory(true)} disabled={editSaving}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-border/80 p-4 text-left transition-all disabled:opacity-50 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background group-hover:bg-muted transition-colors border border-border">
                  <Tags className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  All from <span className="font-semibold">{pendingEdit?.merchant || "this merchant"}</span>
                </p>
              </button>
            </div>
            {editSaving && (
              <div className="border-t border-border px-6 py-3 flex items-center gap-2 text-muted-foreground text-xs bg-muted/30">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />Applying changes…
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Merchant Scope Dialog ── */}
        <Dialog open={!!pendingMerchantEdit} onOpenChange={(open) => { if (!open && !merchantEditSaving) setPendingMerchantEdit(null); }}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <DialogHeader>
                <DialogTitle className="text-base text-foreground">Apply merchant name change</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm pt-1">
                  You're renaming{" "}
                  <span className="text-foreground font-semibold">{pendingMerchantEdit?.originalMerchant}</span>{" "}
                  to{" "}
                  <span className="text-foreground font-semibold">{pendingMerchantEdit?.newMerchant}</span>. How would you like to apply this?
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 pb-6 pt-3 grid grid-cols-2 gap-3">
              <button onClick={() => applyMerchant(false)} disabled={merchantEditSaving}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-border/80 p-4 text-left transition-all disabled:opacity-50 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background group-hover:bg-muted transition-colors border border-border">
                  <Tag className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">This transaction only</p>
              </button>
              <button onClick={() => applyMerchant(true)} disabled={merchantEditSaving}
                className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-border/80 p-4 text-left transition-all disabled:opacity-50 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background group-hover:bg-muted transition-colors border border-border">
                  <Tags className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  All from <span className="font-semibold">{pendingMerchantEdit?.originalMerchant || "this merchant"}</span>
                </p>
              </button>
            </div>
            {merchantEditSaving && (
              <div className="border-t border-border px-6 py-3 flex items-center gap-2 text-muted-foreground text-xs bg-muted/30">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />Applying changes…
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Add Transaction Dialog ── */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setFormData(EMPTY_FORM); }}>
          <DialogContent className="sm:max-w-[440px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={addTransaction} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" placeholder="0.00"
                    value={formData.amount} onChange={handleFormChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(val) => handleSelectChange("type", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="INCOME">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Food, Transport"
                  value={formData.category} onChange={handleFormChange} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="merchant">
                  Merchant <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="merchant" name="merchant" placeholder="e.g. Swiggy, Amazon"
                  value={formData.merchant} onChange={handleFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {formData.date ? format(formData.date, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar mode="single" selected={formData.date} onSelect={handleDateChange}
                      initialFocus disabled={(date) => date > new Date()} />
                  </PopoverContent>
                </Popover>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline"
                  onClick={() => { setShowAddDialog(false); setFormData(EMPTY_FORM); }}
                  disabled={formSaving}>Cancel</Button>
                <Button type="submit" disabled={formSaving}>
                  {formSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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