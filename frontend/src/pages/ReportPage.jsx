import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { fetchMonthlyReport } from "../services/reportService";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PieChartIcon,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Cohesive palette that works in both light and dark
const CHART_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // rose
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#84cc16", // lime
];

function getColor(i) {
  return CHART_COLORS[i % CHART_COLORS.length];
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      {label && <p className="font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p
          key={i}
          style={{ color: p.color || p.fill }}
          className="tabular-nums">
          {p.name}: ₹
          {Number(p.value).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="tabular-nums">
        ₹{Number(d.value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        <span className="text-muted-foreground ml-1">
          ({d.payload.percent}%)
        </span>
      </p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, trend, trendLabel }) {
  const isPositive = trend > 0;
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {trendLabel && (
          <div className="mt-3 flex items-center gap-1">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
            )}
            <span
              className={`text-xs font-medium ${
                isPositive
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}>
              {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="pt-5 pb-4 px-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setReport(null);
      try {
        const data = await fetchMonthlyReport(month, year);

        const categories = Object.entries(data.expenseByCategory || {})
          .map(([name, value]) => ({
            name,
            value: Number(Number(value).toFixed(2)),
          }))
          .sort((a, b) => b.value - a.value);

        const totalExpense = data.totalExpense || 0;
        const totalIncome = data.totalIncome || 0;

        const enriched = categories.map((cat) => ({
          ...cat,
          percent:
            totalExpense > 0
              ? Number(((cat.value / totalExpense) * 100).toFixed(1))
              : 0,
        }));

        // Build last-6-months trend from data if available, else use monthlyTrend
        const trend = data.monthlyTrend || [];

        setReport({
          totalExpense,
          totalIncome,
          net: totalIncome - totalExpense,
          topCategory: enriched[0] || null,
          categories: enriched,
          trend,
          transactionCount: data.transactionCount || 0,
        });
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month, year]);

  // Bar chart data — top 7 categories
  const barData = useMemo(
    () => (report?.categories || []).slice(0, 7),
    [report]
  );

  const fmt = (n) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const isEmpty = !loading && report?.categories.length === 0;

  return (
    <>
      <Navbar />

      <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Monthly Report
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Expense breakdown and trends for {MONTHS[month - 1]} {year}
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && <ReportSkeleton />}

        {/* ── Empty ── */}
        {isEmpty && (
          <Card className="border-border border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
              <PieChartIcon className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                No expense data for {MONTHS[month - 1]} {year}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Content ── */}
        {!loading && report && report.categories.length > 0 && (
          <div className="space-y-6">
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Expenses"
                value={fmt(report.totalExpense)}
                sub={`${report.transactionCount} transactions`}
                icon={TrendingDown}
              />
              <StatCard
                title="Total Income"
                value={fmt(report.totalIncome)}
                icon={TrendingUp}
              />
              <StatCard
                title="Net Savings"
                value={fmt(Math.abs(report.net))}
                sub={report.net >= 0 ? "Surplus" : "Deficit"}
                icon={Wallet}
                trend={report.net >= 0 ? -1 : 1}
                trendLabel={
                  report.net >= 0 ? "You saved money" : "Spent more than earned"
                }
              />
              <StatCard
                title="Top Category"
                value={report.topCategory?.name || "—"}
                sub={report.topCategory ? fmt(report.topCategory.value) : ""}
                icon={BarChart2}
              />
            </div>

            {/* ── Charts Row 1: Donut + Bar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut chart */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Expense by Category
                  </CardTitle>
                  <CardDescription>Share of total spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={report.categories.map((c, i) => ({
                            ...c,
                            fill: getColor(i),
                          }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="78%"
                          paddingAngle={2}>
                          {report.categories.map((_, i) => (
                            <Cell
                              key={i}
                              fill={getColor(i)}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {fmt(report.totalExpense)}
                      </p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    {report.categories.slice(0, 8).map((cat, i) => (
                      <div
                        key={cat.name}
                        className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: getColor(i) }}
                        />
                        <span className="text-xs text-muted-foreground truncate">
                          {cat.name}
                        </span>
                        <span className="ml-auto text-xs font-medium text-foreground tabular-nums shrink-0">
                          {cat.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Horizontal bar chart */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Top Categories
                  </CardTitle>
                  <CardDescription>
                    Spending amount per category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid
                        horizontal={false}
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        tick={{
                          fontSize: 11,
                          // fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{
                          fontSize: 11,
                          // fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      />
                      <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill={getColor(i)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Charts Row 2: Monthly trend (if available) + Category table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend line chart — spans 2 cols */}
              {report.trend && report.trend.length > 1 && (
                <Card className="border-border bg-card lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Income vs Expenses
                    </CardTitle>
                    <CardDescription>Monthly comparison trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart
                        data={report.trend}
                        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expense"
                          name="Expenses"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#ef4444" }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="income"
                          name="Income"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#10b981" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Category breakdown table */}
              <Card
                className={`border-border bg-card ${
                  report.trend?.length > 1 ? "lg:col-span-1" : "lg:col-span-3"
                }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Category Breakdown
                  </CardTitle>
                  <CardDescription>
                    All categories ranked by spend
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="space-y-3">
                    {report.categories.map((cat, i) => (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: getColor(i) }}
                            />
                            <span className="text-sm text-foreground truncate font-medium">
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm tabular-nums text-foreground font-semibold">
                              {fmt(cat.value)}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs tabular-nums h-5 px-1.5 font-normal">
                              {cat.percent}%
                            </Badge>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${cat.percent}%`,
                              background: getColor(i),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ReportPage;
