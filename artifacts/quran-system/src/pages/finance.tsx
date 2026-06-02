import { useState } from "react";
import {
  useGetFinanceSummary,
  useListInvoices,
  useListExpenses,
  useCreateInvoice,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUpdateInvoice,
  useListIncome,
  useCreateIncome,
  useDeleteIncome,
  useListPayroll,
  useCreatePayroll,
  useUpdatePayroll,
  useDeletePayroll,
  useCalculatePayroll,
  useListTransactions,
  useGetFinanceAnalytics,
  getListInvoicesQueryKey,
  getListExpensesQueryKey,
  getListIncomeQueryKey,
  getListPayrollQueryKey,
  getListTransactionsQueryKey,
  getGetFinanceAnalyticsQueryKey,
  getGetFinanceSummaryQueryKey,
} from "@workspace/api-client-react";
import { useListTeachers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  FileText,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const MONTH_NAMES: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

function formatMonth(m: string) {
  const parts = m.split("-");
  if (parts.length === 2) return `${MONTH_NAMES[parts[1]] ?? parts[1]} ${parts[0]}`;
  return m;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
const EXPENSE_CATEGORIES = ["رواتب", "صيانة", "قرطاسية", "كهرباء", "إيجار", "مياه", "مواصلات", "أخرى"];
const INCOME_TYPES = ["تبرع", "دخل إضافي", "منحة", "هدية", "أخرى"];
const PAYMENT_METHODS = ["نقداً", "تحويل بنكي", "بطاقة ائتمانية", "شيك"];
const CALC_METHODS = ["ثابت", "بالحصة", "نسبة من الإيرادات", "مختلط"];

// ─── Modals ──────────────────────────────────────────────────────────────────

function InvoiceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [month, setMonth] = useState("");
  const [amountOverride, setAmountOverride] = useState("");
  const createInvoice = useCreateInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { month };
    if (amountOverride) data.amount_override = Number(amountOverride);
    createInvoice.mutate({ data }, {
      onSuccess: (result) => {
        toast({ title: "تم إنشاء الفواتير بنجاح", description: `تم إنشاء ${(result as any[]).length} فاتورة` });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
        setMonth(""); setAmountOverride("");
        onOpenChange(false);
      },
      onError: () => toast({ title: "خطأ في إنشاء الفواتير", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" dir="rtl">
        <DialogHeader><DialogTitle>إنشاء فواتير شهرية</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">سيتم إنشاء فاتورة لكل الطلاب للشهر المحدد.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">الشهر</label>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">المبلغ الموحد (اختياري)</label>
            <Input type="number" value={amountOverride} onChange={e => setAmountOverride(e.target.value)} placeholder="سيُستخدم مبلغ كل طالب إذا تُركت فارغة" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={createInvoice.isPending}>{createInvoice.isPending ? "جارٍ..." : "إنشاء الفواتير"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseModal({ open, onOpenChange, editing, onClear }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: any; onClear?: () => void }) {
  const [category, setCategory] = useState(editing?.category ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing?.amount?.toString() ?? "");
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState(editing?.payment_method ?? "نقداً");
  const [linkedToType, setLinkedToType] = useState(editing?.linked_to_type ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = !!editing;
  const isPending = createExpense.isPending || updateExpense.isPending;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceAnalyticsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { category, description, amount: Number(amount), date, payment_method: paymentMethod, notes };
    if (linkedToType) data.linked_to_type = linkedToType;

    if (isEditing) {
      updateExpense.mutate({ id: editing.id, data }, {
        onSuccess: () => { toast({ title: "تم تحديث المصروف" }); invalidate(); onOpenChange(false); onClear?.(); },
        onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
      });
    } else {
      createExpense.mutate({ data }, {
        onSuccess: () => { toast({ title: "تم إضافة المصروف بنجاح" }); invalidate(); onOpenChange(false); },
        onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) onClear?.(); }}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader><DialogTitle>{isEditing ? "تعديل المصروف" : "إضافة مصروف جديد"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">الفئة</label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">الوصف</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف المصروف" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">المبلغ (ج.م)</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">التاريخ</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">مرتبط بـ (اختياري)</label>
            <Select onValueChange={setLinkedToType} value={linkedToType}>
              <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">عام</SelectItem>
                <SelectItem value="teacher">معلم</SelectItem>
                <SelectItem value="circle">حلقة</SelectItem>
                <SelectItem value="admin">إداري</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">ملاحظات</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onClear?.(); }}>إلغاء</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "جارٍ..." : isEditing ? "حفظ التعديلات" : "إضافة المصروف"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IncomeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [type, setType] = useState("تبرع");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("نقداً");
  const [donorName, setDonorName] = useState("");
  const [notes, setNotes] = useState("");

  const createIncome = useCreateIncome();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceAnalyticsQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIncome.mutate({ data: { type, description, amount: Number(amount), date, payment_method: paymentMethod, donor_name: donorName || undefined, notes: notes || undefined } }, {
      onSuccess: () => { toast({ title: "تم إضافة الوارد بنجاح" }); invalidate(); setDescription(""); setAmount(""); setDonorName(""); setNotes(""); onOpenChange(false); },
      onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader><DialogTitle>إضافة وارد مالي</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">النوع</label>
              <Select onValueChange={setType} value={type}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INCOME_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">الوصف</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف الوارد" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">المبلغ (ج.م)</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">التاريخ</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">اسم المتبرع (اختياري)</label>
            <Input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="اسم المتبرع أو الجهة" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">ملاحظات</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={createIncome.isPending}>{createIncome.isPending ? "جارٍ..." : "إضافة الوارد"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayrollModal({ open, onOpenChange, editing, onClear }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: any; onClear?: () => void }) {
  const { data: teachers } = useListTeachers();
  const [teacherId, setTeacherId] = useState(editing?.teacher_id ?? "");
  const [month, setMonth] = useState(editing?.month ?? "");
  const [calcMethod, setCalcMethod] = useState(editing?.calculation_method ?? "ثابت");
  const [baseSalary, setBaseSalary] = useState(editing?.base_salary?.toString() ?? "");
  const [sessionCount, setSessionCount] = useState(editing?.session_count?.toString() ?? "");
  const [sessionRate, setSessionRate] = useState(editing?.session_rate?.toString() ?? "");
  const [bonuses, setBonuses] = useState(editing?.bonuses?.toString() ?? "0");
  const [deductions, setDeductions] = useState(editing?.deductions?.toString() ?? "0");
  const [paymentMethod, setPaymentMethod] = useState(editing?.payment_method ?? "نقداً");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const computedTotal = () => {
    let base = 0;
    if (calcMethod === "ثابت") base = Number(baseSalary) || 0;
    else if (calcMethod === "بالحصة") base = (Number(sessionCount) || 0) * (Number(sessionRate) || 0);
    else base = Number(baseSalary) || 0;
    return base + (Number(bonuses) || 0) - (Number(deductions) || 0);
  };

  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!editing;
  const isPending = createPayroll.isPending || updatePayroll.isPending;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListPayrollQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceAnalyticsQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = computedTotal();
    const data: any = {
      teacher_id: teacherId, month, calculation_method: calcMethod,
      base_salary: Number(baseSalary) || 0, session_count: Number(sessionCount) || 0,
      session_rate: Number(sessionRate) || 0, bonuses: Number(bonuses) || 0,
      deductions: Number(deductions) || 0, total_amount: total,
      payment_method: paymentMethod, notes: notes || undefined,
    };
    if (isEditing) {
      updatePayroll.mutate({ id: editing.id, data: { total_amount: total, bonuses: Number(bonuses), deductions: Number(deductions), payment_method: paymentMethod, notes } }, {
        onSuccess: () => { toast({ title: "تم تحديث الراتب" }); invalidate(); onOpenChange(false); onClear?.(); },
        onError: () => toast({ title: "خطأ", variant: "destructive" }),
      });
    } else {
      createPayroll.mutate({ data }, {
        onSuccess: () => { toast({ title: "تم إضافة الراتب بنجاح" }); invalidate(); onOpenChange(false); onClear?.(); },
        onError: () => toast({ title: "خطأ", variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) onClear?.(); }}>
      <DialogContent className="sm:max-w-[520px]" dir="rtl">
        <DialogHeader><DialogTitle>{isEditing ? "تعديل راتب المعلم" : "إضافة راتب معلم"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">المعلم</label>
              <Select onValueChange={setTeacherId} value={teacherId} disabled={isEditing}>
                <SelectTrigger><SelectValue placeholder="اختر المعلم" /></SelectTrigger>
                <SelectContent>{(teachers ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">الشهر</label>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} required disabled={isEditing} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">طريقة الحساب</label>
            <Select onValueChange={setCalcMethod} value={calcMethod} disabled={isEditing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CALC_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {(calcMethod === "ثابت" || calcMethod === "نسبة من الإيرادات" || calcMethod === "مختلط") && (
            <div className="space-y-1">
              <label className="text-sm font-medium">الراتب الأساسي (ج.م)</label>
              <Input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="0" />
            </div>
          )}
          {(calcMethod === "بالحصة" || calcMethod === "مختلط") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">عدد الحصص</label>
                <Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">سعر الحصة (ج.م)</label>
                <Input type="number" value={sessionRate} onChange={e => setSessionRate(e.target.value)} placeholder="0" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">مكافآت (ج.م)</label>
              <Input type="number" value={bonuses} onChange={e => setBonuses(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">خصومات (ج.م)</label>
              <Input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">الإجمالي</div>
                <div className="text-xl font-bold text-primary">{computedTotal().toLocaleString()} ج.م</div>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">ملاحظات</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onClear?.(); }}>إلغاء</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "جارٍ..." : isEditing ? "حفظ التعديلات" : "إضافة الراتب"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    "مدفوع": { label: "مدفوع", className: "bg-green-100 text-green-800" },
    "paid": { label: "مدفوع", className: "bg-green-100 text-green-800" },
    "غير مدفوع": { label: "غير مدفوع", className: "bg-red-100 text-red-800" },
    "unpaid": { label: "غير مدفوع", className: "bg-red-100 text-red-800" },
    "جزئي": { label: "جزئي", className: "bg-yellow-100 text-yellow-800" },
    "معفى": { label: "معفى", className: "bg-blue-100 text-blue-800" },
    "معفي": { label: "معفى", className: "bg-blue-100 text-blue-800" },
    "exempt": { label: "معفى", className: "bg-blue-100 text-blue-800" },
    "معلق": { label: "معلق", className: "bg-gray-100 text-gray-700" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Tabs Content ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data: summary, isLoading: sl } = useGetFinanceSummary();
  const { data: analytics, isLoading: al } = useGetFinanceAnalytics({ months: 6 });

  const isLoading = sl || al;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="إجمالي الإيرادات" value={`${Number(summary?.revenue ?? 0).toLocaleString()} ج.م`} sub={`${summary?.paid_invoices ?? 0} فاتورة مدفوعة`} icon={TrendingUp} color="text-green-600" />
          <KpiCard title="إجمالي المصروفات" value={`${Number(summary?.expenses ?? 0).toLocaleString()} ج.م`} sub={`${summary?.unpaid_invoices ?? 0} فاتورة معلقة`} icon={TrendingDown} color="text-red-600" />
          <KpiCard title="صافي الربح" value={`${Number(summary?.profit ?? 0).toLocaleString()} ج.م`} icon={DollarSign} color={Number(summary?.profit ?? 0) >= 0 ? "text-primary" : "text-red-600"} />
          <KpiCard title="نسبة التحصيل" value={`${analytics?.collection_rate ?? 0}%`} sub={`متأخر: ${Number(analytics?.total_outstanding ?? 0).toLocaleString()} ج.م`} icon={BarChart3} color="text-violet-600" />
        </div>
      )}

      {isLoading ? <Skeleton className="h-72 rounded-xl" /> : (
        <Card>
          <CardHeader><CardTitle>الأداء المالي الشهري</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics?.monthly_trends ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartTooltip formatter={(v: any, n: string) => [`${Number(v).toLocaleString()} ج.م`, n === "revenue" ? "الإيرادات" : n === "expenses" ? "المصروفات" : "الربح"]} labelFormatter={formatMonth} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#colorRev)" strokeWidth={2} name="revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={2} name="expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {isLoading ? <Skeleton className="h-60 rounded-xl" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>المصروفات حسب الفئة</CardTitle></CardHeader>
            <CardContent>
              {(analytics?.expense_by_category?.length ?? 0) === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">لا توجد مصروفات مسجّلة</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics?.expense_by_category ?? []} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category }) => category}>
                      {(analytics?.expense_by_category ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartTooltip formatter={(v: any) => `${Number(v).toLocaleString()} ج.م`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>الملخص المالي الحالي</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "فواتير مدفوعة", value: summary?.paid_invoices ?? 0, color: "text-green-600" },
                { label: "فواتير غير مدفوعة", value: summary?.unpaid_invoices ?? 0, color: "text-red-600" },
                { label: "فواتير معفاة", value: summary?.exempt_invoices ?? 0, color: "text-blue-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
              <div className="bg-primary/5 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">إجمالي المتأخرات</span>
                  <span className="font-bold text-red-600">{Number(analytics?.total_outstanding ?? 0).toLocaleString()} ج.م</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function InvoicesTab() {
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const { data: invoices, isLoading } = useListInvoices({
    month: filterMonth || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const updateInvoice = useUpdateInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markPaid = (id: string) => {
    updateInvoice.mutate({ id, data: { status: "مدفوع" } }, {
      onSuccess: () => {
        toast({ title: "تم تسجيل الدفع" });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      },
    });
  };

  const totalPaid = (invoices ?? []).filter(i => i.status === "مدفوع").reduce((s, i) => s + Number(i.amount), 0);
  const totalUnpaid = (invoices ?? []).filter(i => i.status === "غير مدفوع").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-44" />
          <Select onValueChange={setFilterStatus} value={filterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="مدفوع">مدفوع</SelectItem>
              <SelectItem value="غير مدفوع">غير مدفوع</SelectItem>
              <SelectItem value="معفي">معفى</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setInvoiceModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />فواتير شهرية</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div><div className="text-xs text-muted-foreground">إجمالي المحصّل</div><div className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()} ج.م</div></div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div><div className="text-xs text-muted-foreground">إجمالي المتأخر</div><div className="text-xl font-bold text-red-700">{totalUnpaid.toLocaleString()} ج.م</div></div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-60" /></div> : (
            <div className="divide-y">
              {(invoices ?? []).length === 0 && <p className="text-center text-muted-foreground text-sm py-10">لا توجد فواتير</p>}
              {(invoices ?? []).map(inv => (
                <div key={inv.id} className="flex justify-between items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="font-medium text-sm">{inv.student_name}</div>
                    <div className="text-xs text-muted-foreground">{formatMonth(inv.month)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.status} />
                    <span className="font-bold text-sm">{Number(inv.amount).toLocaleString()} ج.م</span>
                    {inv.status === "غير مدفوع" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50" onClick={() => markPaid(inv.id)}>
                        <CheckCircle className="h-3 w-3" />دفع
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceModal open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} />
    </div>
  );
}

function ExpensesTab() {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const { data: expenses, isLoading } = useListExpenses();
  const deleteExpense = useDeleteExpense();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceAnalyticsQueryKey() });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل تريد حذف هذا المصروف؟")) return;
    deleteExpense.mutate({ id }, {
      onSuccess: () => { toast({ title: "تم الحذف" }); invalidate(); },
      onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
    });
  };

  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">الإجمالي: <span className="font-bold text-red-600">{total.toLocaleString()} ج.م</span></div>
        <Button onClick={() => setExpenseModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />إضافة مصروف</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-60" /></div> : (
            <div className="divide-y">
              {(expenses ?? []).length === 0 && <p className="text-center text-muted-foreground text-sm py-10">لا توجد مصروفات</p>}
              {(expenses ?? []).map(exp => (
                <div key={exp.id} className="flex justify-between items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="font-medium text-sm">{exp.category}</div>
                    <div className="text-xs text-muted-foreground">{exp.description} — {exp.date}</div>
                    {(exp as any).payment_method && <div className="text-xs text-muted-foreground">{(exp as any).payment_method}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-red-600">{Number(exp.amount).toLocaleString()} ج.م</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingExpense(exp); setExpenseModalOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(exp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} editing={editingExpense} onClear={() => setEditingExpense(null)} />
    </div>
  );
}

function IncomeTab() {
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const { data: income, isLoading } = useListIncome();
  const deleteIncome = useDeleteIncome();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (!confirm("هل تريد حذف هذا الوارد؟")) return;
    deleteIncome.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تم الحذف" });
        queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
      },
      onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
    });
  };

  const total = (income ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">إجمالي الواردات الإضافية: <span className="font-bold text-green-600">{total.toLocaleString()} ج.م</span></div>
        <Button onClick={() => setIncomeModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />إضافة وارد</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-60" /></div> : (
            <div className="divide-y">
              {(income ?? []).length === 0 && <p className="text-center text-muted-foreground text-sm py-10">لا توجد واردات إضافية</p>}
              {(income ?? []).map(inc => (
                <div key={inc.id} className="flex justify-between items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{inc.description}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">{inc.type}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{inc.date}{inc.donor_name ? ` — ${inc.donor_name}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-green-600">{Number(inc.amount).toLocaleString()} ج.م</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(inc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <IncomeModal open={incomeModalOpen} onOpenChange={setIncomeModalOpen} />
    </div>
  );
}

function PayrollTab() {
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [calcMonth, setCalcMonth] = useState("");

  const { data: payroll, isLoading } = useListPayroll({ month: filterMonth || undefined });
  const deletePayroll = useDeletePayroll();
  const updatePayroll = useUpdatePayroll();
  const calculatePayroll = useCalculatePayroll();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListPayrollQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFinanceAnalyticsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل تريد حذف هذا الراتب؟")) return;
    deletePayroll.mutate({ id }, {
      onSuccess: () => { toast({ title: "تم الحذف" }); invalidate(); },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  const markPaid = (id: string) => {
    updatePayroll.mutate({ id, data: { status: "مدفوع" } }, {
      onSuccess: () => { toast({ title: "تم تسجيل صرف الراتب" }); invalidate(); },
    });
  };

  const handleAutoCalc = () => {
    if (!calcMonth) { toast({ title: "اختر الشهر أولاً", variant: "destructive" }); return; }
    calculatePayroll.mutate({ data: { month: calcMonth } }, {
      onSuccess: (res: any) => {
        toast({ title: `تم حساب ${res.length} راتب تلقائياً` });
        invalidate();
        setCalcModalOpen(false);
      },
      onError: () => toast({ title: "خطأ في الحساب", variant: "destructive" }),
    });
  };

  const totalPaid = (payroll ?? []).filter(p => p.status === "مدفوع").reduce((s, p) => s + Number(p.total_amount), 0);
  const totalPending = (payroll ?? []).filter(p => p.status !== "مدفوع").reduce((s, p) => s + Number(p.total_amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-44" placeholder="تصفية بالشهر" />
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setCalcModalOpen(true)}><Calculator className="h-4 w-4" />حساب تلقائي</Button>
          <Button onClick={() => setPayrollModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />إضافة راتب</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div><div className="text-xs text-muted-foreground">رواتب مصروفة</div><div className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()} ج.م</div></div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-yellow-500" />
          <div><div className="text-xs text-muted-foreground">رواتب معلقة</div><div className="text-xl font-bold text-yellow-700">{totalPending.toLocaleString()} ج.م</div></div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-60" /></div> : (
            <div className="divide-y">
              {(payroll ?? []).length === 0 && <p className="text-center text-muted-foreground text-sm py-10">لا توجد سجلات رواتب</p>}
              {(payroll ?? []).map(p => (
                <div key={p.id} className="flex justify-between items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="font-medium text-sm">{p.teacher_name}</div>
                    <div className="text-xs text-muted-foreground">{formatMonth(p.month)} — {p.calculation_method}</div>
                    {Number(p.bonuses) > 0 && <span className="text-xs text-green-600">+{Number(p.bonuses).toLocaleString()} مكافأة</span>}
                    {Number(p.deductions) > 0 && <span className="text-xs text-red-500 ml-2">-{Number(p.deductions).toLocaleString()} خصم</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="font-bold text-sm">{Number(p.total_amount).toLocaleString()} ج.م</span>
                    {p.status !== "مدفوع" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50" onClick={() => markPaid(p.id)}>
                        <CheckCircle className="h-3 w-3" />صرف
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPayroll(p); setPayrollModalOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={calcModalOpen} onOpenChange={setCalcModalOpen}>
        <DialogContent className="sm:max-w-[380px]" dir="rtl">
          <DialogHeader><DialogTitle>حساب الرواتب تلقائياً</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">سيتم حساب راتب كل معلم بناءً على راتبه الأساسي المسجّل في ملفه.</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">الشهر</label>
              <Input type="month" value={calcMonth} onChange={e => setCalcMonth(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCalcModalOpen(false)}>إلغاء</Button>
              <Button onClick={handleAutoCalc} disabled={calculatePayroll.isPending}>{calculatePayroll.isPending ? "جارٍ..." : "احسب الآن"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PayrollModal open={payrollModalOpen} onOpenChange={setPayrollModalOpen} editing={editingPayroll} onClear={() => setEditingPayroll(null)} />
    </div>
  );
}

function TransactionsTab() {
  const [filterType, setFilterType] = useState("all");
  const { data: transactions, isLoading } = useListTransactions({ type: filterType !== "all" ? filterType : undefined });

  const totalIn = (transactions ?? []).filter(t => t.type === "وارد").reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = (transactions ?? []).filter(t => t.type === "مصروف").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select onValueChange={setFilterType} value={filterType}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="وارد">واردات</SelectItem>
            <SelectItem value="مصروف">مصروفات</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">↑ {totalIn.toLocaleString()} ج.م</span>
          <span className="text-red-600 font-medium">↓ {totalOut.toLocaleString()} ج.م</span>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-60" /></div> : (
            <div className="divide-y">
              {(transactions ?? []).length === 0 && <p className="text-center text-muted-foreground text-sm py-10">لا توجد معاملات مسجّلة</p>}
              {(transactions ?? []).map(t => (
                <div key={t.id} className="flex justify-between items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {t.type === "وارد" ? <ArrowUpCircle className="h-5 w-5 text-green-500" /> : <ArrowDownCircle className="h-5 w-5 text-red-500" />}
                    <div>
                      <div className="font-medium text-sm">{t.description}</div>
                      <div className="text-xs text-muted-foreground">{t.date}{t.category ? ` — ${t.category}` : ""}{t.linked_name ? ` — ${t.linked_name}` : ""}</div>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.type === "وارد" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "وارد" ? "+" : "-"}{Number(t.amount).toLocaleString()} ج.م
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics, isLoading } = useGetFinanceAnalytics({ months: 12 });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <>
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>الأداء المالي — آخر 12 شهراً</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics?.monthly_trends ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartTooltip formatter={(v: any, n: string) => [`${Number(v).toLocaleString()} ج.م`, n === "revenue" ? "الإيرادات" : n === "expenses" ? "المصروفات" : "الربح الصافي"]} labelFormatter={formatMonth} />
                  <Legend formatter={n => n === "revenue" ? "الإيرادات" : n === "expenses" ? "المصروفات" : "الربح"} />
                  <Bar dataKey="revenue" fill="#22c55e" name="revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="expenses" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#6366f1" name="profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>أداء المعلمين المالي</CardTitle></CardHeader>
              <CardContent>
                {(analytics?.teacher_performance?.length ?? 0) === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {analytics?.teacher_performance?.map(t => (
                      <div key={t.teacher_id} className="flex justify-between items-center border-b pb-2 last:border-0">
                        <div>
                          <div className="font-medium text-sm">{t.teacher_name}</div>
                        </div>
                        <span className="font-bold text-sm text-red-600">{Number(t.salary_cost).toLocaleString()} ج.م</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>الواردات حسب النوع</CardTitle></CardHeader>
              <CardContent>
                {(analytics?.income_by_type?.length ?? 0) === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">لا توجد واردات إضافية</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={analytics?.income_by_type ?? []} dataKey="total" nameKey="type" cx="50%" cy="50%" outerRadius={75} label={({ type }) => type}>
                        {(analytics?.income_by_type ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RechartTooltip formatter={(v: any) => `${Number(v).toLocaleString()} ج.م`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>نسبة التحصيل والمتأخرات</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{analytics?.collection_rate ?? 0}%</div>
                  <div className="text-sm text-muted-foreground mt-1">نسبة التحصيل الإجمالية</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">{Number(analytics?.total_outstanding ?? 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-1">إجمالي المتأخرات (ج.م)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Main Finance Page ────────────────────────────────────────────────────────

export default function Finance() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">النظام المالي</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة مالية شاملة — فواتير · مصروفات · رواتب · تحليلات</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary gap-1"><DollarSign className="h-3 w-3" />ERP مالي</Badge>
      </div>

      <Tabs defaultValue="dashboard" dir="rtl">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />لوحة المالية</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />الفواتير</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5 text-xs"><ArrowDownCircle className="h-3.5 w-3.5" />المصروفات</TabsTrigger>
          <TabsTrigger value="income" className="gap-1.5 text-xs"><ArrowUpCircle className="h-3.5 w-3.5" />الواردات</TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />الرواتب</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs"><Wallet className="h-3.5 w-3.5" />المعاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
        <TabsContent value="invoices" className="mt-6"><InvoicesTab /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesTab /></TabsContent>
        <TabsContent value="income" className="mt-6"><IncomeTab /></TabsContent>
        <TabsContent value="payroll" className="mt-6"><PayrollTab /></TabsContent>
        <TabsContent value="transactions" className="mt-6"><TransactionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
