import { useState } from "react";
import {
  useFinanceSummary, useInvoices, useExpenses, useSalaryRecords,
  updateInvoice, deleteExpense, updateSalaryRecord, deleteSalaryRecord,
  addExpense, addSalaryRecord, generateMonthlyInvoices, generateMonthSalaries,
  useTeachers, type Invoice, type SalaryRecord,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet, TrendingUp, TrendingDown, FileText, Receipt, Search, Trash2, GraduationCap, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { InvoiceModal } from "@/components/modals/invoice-modal";
import { cn } from "@/lib/utils";

const EXPENSE_CATEGORIES = ["شراء كراسي", "شراء مكاتب", "كهرباء", "مياه", "إنترنت", "صيانة أجهزة", "أدوات مكتبية", "رواتب المعلمين", "رواتب المحفظين", "متنوعات", "أخرى"];

export default function Finance() {
  const [activeTab, setActiveTab] = useState("summary");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" }));
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [expenseDetailOpen, setExpenseDetailOpen] = useState(false);
  const [salaryModal, setSalaryModal] = useState(false);
  const { toast } = useToast();

  const { summary, loading: isLoadingSummary } = useFinanceSummary();
  const { invoices, loading: isLoadingInvoices } = useInvoices(invoiceSearch);
  const { expenses, loading: isLoadingExpenses } = useExpenses();
  const { salaryRecords, loading: isLoadingSalaries } = useSalaryRecords();
  const { teachers } = useTeachers();

  const filteredInvoices = invoiceMonthFilter
    ? invoices.filter(i => i.month === invoiceMonthFilter)
    : invoices;

  const invoiceMonths = [...new Set(invoices.map(i => i.month))].sort();

  const invoiceStatusColor = (status: string) =>
    status === "مدفوع" ? "text-green-600 border-green-600 bg-green-50" :
    status === "غير مدفوع" ? "text-destructive border-destructive bg-destructive/5" :
    status === "معفي" ? "text-blue-600 border-blue-400 bg-blue-50" :
    status === "مدفوع جزئياً" ? "text-amber-600 border-amber-400 bg-amber-50" :
    "text-gray-500 border-gray-300";

  const salaryStatusColor = (status: string) =>
    status === "مدفوع" ? "text-green-600 border-green-400 bg-green-50" :
    status === "معلق" ? "text-amber-600 border-amber-400 bg-amber-50" :
    "text-muted-foreground";

  const markPaid = async (invoice: Invoice) => {
    try {
      await updateInvoice(invoice.id, { status: "مدفوع", payment_date: new Date().toISOString().split("T")[0] });
      toast({ title: "تم تحديث حالة الدفع" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      try {
        await deleteExpense(id);
        toast({ title: "تم حذف المصروف" });
      } catch {
        toast({ title: "حدث خطأ", variant: "destructive" });
      }
    }
  };

  const handleGenerateInvoices = async () => {
    await generateMonthlyInvoices();
    toast({ title: "تم إنشاء الفواتير الشهرية بنجاح" });
    setActiveTab("invoices");
  };

  const handleGenerateSalaries = async () => {
    const m = new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
    await generateMonthSalaries(m);
    toast({ title: `تم إنشاء رواتب شهر ${m}` });
  };

  const handleSalaryPaid = async (record: SalaryRecord) => {
    try {
      await updateSalaryRecord(record.id, { status: "مدفوع", paid_at: new Date().toISOString() });
      toast({ title: "تم تسجيل صرف الراتب وإضافته للمصروفات" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-secondary">الشؤون المالية</h1>
          <p className="text-muted-foreground mt-1">الإيرادات والمصروفات والاشتراكات والرواتب</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" onClick={handleGenerateInvoices}>
            <FileText className="ml-2 h-4 w-4" />
            فواتير الشهر
          </Button>
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setExpenseOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            مصروف جديد
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-xl bg-muted/50 p-1">
          <TabsTrigger value="summary">الملخص</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="payroll">الرواتب</TabsTrigger>
        </TabsList>

        {/* ── SUMMARY ── */}
        <TabsContent value="summary" className="mt-6 space-y-6">
          {isLoadingSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-primary">إجمالي الإيرادات</CardTitle>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary">{(summary.revenue ?? 0).toLocaleString()} ج.م</div>
                    <p className="text-xs text-muted-foreground mt-1">{summary.paid_invoices ?? 0} فاتورة مدفوعة</p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">إجمالي المصروفات</CardTitle>
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary">{(summary.expenses ?? 0).toLocaleString()} ج.م</div>
                    <p className="text-xs text-muted-foreground mt-1">شامل الرواتب</p>
                  </CardContent>
                </Card>
                <Card className={cn("border-primary/20", (summary.profit ?? 0) >= 0 ? "bg-accent/10" : "bg-destructive/5")}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={cn("text-sm font-medium", (summary.profit ?? 0) >= 0 ? "text-accent" : "text-destructive")}>صافي الربح</CardTitle>
                    <Wallet className={cn("h-5 w-5", (summary.profit ?? 0) >= 0 ? "text-accent" : "text-destructive")} />
                  </CardHeader>
                  <CardContent>
                    <div className={cn("text-3xl font-bold", (summary.profit ?? 0) >= 0 ? "text-accent" : "text-destructive")}>
                      {(summary.profit ?? 0) >= 0 ? "+" : ""}{(summary.profit ?? 0).toLocaleString()} ج.م
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{summary.exempt_invoices ?? 0} طالب معفي</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "فواتير مدفوعة", value: summary.paid_invoices ?? 0, color: "text-green-600 bg-green-50 border-green-200" },
                  { label: "فواتير غير مدفوعة", value: summary.unpaid_invoices ?? 0, color: "text-destructive bg-destructive/5 border-destructive/20" },
                  { label: "مدفوع جزئياً", value: summary.partial_invoices ?? 0, color: "text-amber-600 bg-amber-50 border-amber-200" },
                  { label: "معفيون", value: summary.exempt_invoices ?? 0, color: "text-blue-600 bg-blue-50 border-blue-200" },
                ].map((s, i) => (
                  <Card key={i} className={cn("border", s.color)}>
                    <CardContent className="pt-4 pb-3">
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs mt-1">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(summary.unpaid_invoices ?? 0) > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    يوجد <strong>{summary.unpaid_invoices}</strong> فاتورة غير مدفوعة. تأكد من متابعة الاشتراكات مع أولياء الأمور.
                  </div>
                  <Button size="sm" variant="outline" className="mr-auto text-amber-700 border-amber-400 hover:bg-amber-100 text-xs" onClick={() => setActiveTab("invoices")}>
                    عرض الفواتير
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* ── INVOICES ── */}
        <TabsContent value="invoices" className="mt-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2 text-lg text-secondary">
                  <FileText className="h-5 w-5 text-primary" />
                  سجل الفواتير
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث باسم الطالب..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="max-w-44" />
                  </div>
                  <Select value={invoiceMonthFilter || "all"} onValueChange={v => setInvoiceMonthFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="كل الشهور" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الشهور</SelectItem>
                      {invoiceMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10" onClick={handleGenerateInvoices}>
                    <Plus className="h-3.5 w-3.5 ml-1" /> إنشاء فواتير
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !filteredInvoices.length ? (
                <div className="text-center py-12 text-muted-foreground">لا توجد فواتير مسجلة</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-lg">#</th>
                        <th className="px-4 py-3">الطالب</th>
                        <th className="px-4 py-3">الشهر</th>
                        <th className="px-4 py-3">المبلغ</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3">تاريخ الدفع</th>
                        <th className="px-4 py-3 rounded-tl-lg text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv, idx) => (
                        <tr key={inv.id} className="border-b border-muted/60 hover:bg-muted/20">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold">{inv.student_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{inv.month}</td>
                          <td className="px-4 py-3 font-bold text-primary">
                            {inv.amount} ج.م
                            {inv.paid_amount && inv.paid_amount < inv.amount && (
                              <span className="text-xs text-muted-foreground mr-1">(مدفوع: {inv.paid_amount})</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-xs", invoiceStatusColor(inv.status ?? ""))}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {inv.payment_date ? new Date(inv.payment_date).toLocaleDateString("ar-EG") : "—"}
                          </td>
                          <td className="px-4 py-3 text-left">
                            <div className="flex gap-1 justify-end">
                              {inv.status !== "مدفوع" && inv.status !== "معفي" && (
                                <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50 h-7 text-xs" onClick={() => markPaid(inv)}>
                                  <CheckCircle className="h-3 w-3 ml-0.5" />تحصيل
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-7 text-xs" onClick={() => { setSelectedInvoice(inv); }}>
                                تعديل
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground px-4">
                    <span>إجمالي: {filteredInvoices.length} فاتورة</span>
                    <span className="font-medium text-primary">
                      المحصّل: {filteredInvoices.filter(i => i.status === "مدفوع").reduce((s, i) => s + i.amount, 0).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXPENSES ── */}
        <TabsContent value="expenses" className="mt-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-secondary">
                  <Receipt className="h-5 w-5 text-destructive" />
                  سجل المصروفات
                </CardTitle>
                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setExpenseOpen(true)}>
                  <Plus className="h-4 w-4 ml-1" />مصروف جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !expenses.length ? (
                <div className="text-center py-12 text-muted-foreground">لا توجد مصروفات مسجلة</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-lg">التاريخ</th>
                        <th className="px-4 py-3">الاسم</th>
                        <th className="px-4 py-3">التصنيف</th>
                        <th className="px-4 py-3">الوصف</th>
                        <th className="px-4 py-3">المسؤول</th>
                        <th className="px-4 py-3">المبلغ</th>
                        <th className="px-4 py-3 rounded-tl-lg text-left">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id} className="border-b border-muted/60 hover:bg-muted/20">
                          <td className="px-4 py-3 text-muted-foreground text-xs" dir="ltr">{new Date(exp.date).toLocaleDateString("ar-EG")}</td>
                          <td className="px-4 py-3 font-medium">{exp.name ?? "—"}</td>
                          <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{exp.category}</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground">{exp.description || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{exp.responsible || "—"}</td>
                          <td className="px-4 py-3 font-bold text-destructive">{exp.amount} ج.م</td>
                          <td className="px-4 py-3 text-left">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExpense(exp.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 px-4 text-sm text-muted-foreground flex justify-between">
                    <span>إجمالي: {expenses.length} مصروف</span>
                    <span className="font-medium text-destructive">
                      الإجمالي: {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PAYROLL ── */}
        <TabsContent value="payroll" className="mt-6 space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-secondary">رواتب المعلمين</h2>
              <p className="text-muted-foreground text-sm">متابعة وصرف الرواتب الشهرية</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" onClick={handleGenerateSalaries}>
                <GraduationCap className="ml-2 h-4 w-4" />
                إنشاء رواتب الشهر
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setSalaryModal(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة راتب
              </Button>
            </div>
          </div>

          {isLoadingSalaries ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : salaryRecords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
              <GraduationCap className="h-14 w-14 mx-auto mb-3 opacity-20" />
              <p className="text-lg">لا توجد سجلات رواتب</p>
              <p className="text-sm mt-1">أنشئ رواتب الشهر الحالي أو أضف راتباً يدوياً</p>
            </div>
          ) : (
            <Card className="border-border/60">
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-lg">المعلم</th>
                        <th className="px-4 py-3">الشهر</th>
                        <th className="px-4 py-3">الراتب الأساسي</th>
                        <th className="px-4 py-3">المكافآت</th>
                        <th className="px-4 py-3">الخصومات</th>
                        <th className="px-4 py-3">الإجمالي</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3 rounded-tl-lg text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryRecords.map(rec => (
                        <tr key={rec.id} className="border-b border-muted/60 hover:bg-muted/20">
                          <td className="px-4 py-3 font-semibold">{rec.teacher_name ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{rec.month}</td>
                          <td className="px-4 py-3">{(rec.base_salary ?? 0).toLocaleString()} ج.م</td>
                          <td className="px-4 py-3 text-green-600">+{(rec.bonuses ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-destructive">-{(rec.deductions ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-primary">{rec.total_amount.toLocaleString()} ج.م</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-xs", salaryStatusColor(rec.status))}>{rec.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <div className="flex gap-1 justify-end">
                              {rec.status !== "مدفوع" && (
                                <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50 h-7 text-xs" onClick={() => handleSalaryPaid(rec)}>
                                  <CheckCircle className="h-3 w-3 ml-0.5" />صرف
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="text-destructive h-7 px-2 hover:bg-destructive/10" onClick={async () => {
                                if (confirm("حذف هذا السجل؟")) { await deleteSalaryRecord(rec.id); toast({ title: "تم الحذف" }); }
                              }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 px-4 text-sm text-muted-foreground flex justify-between">
                    <span>{salaryRecords.filter(r => r.status === "مدفوع").length} راتب مصروف / {salaryRecords.filter(r => r.status === "معلق").length} معلق</span>
                    <span className="font-medium text-primary">
                      إجمالي الرواتب: {salaryRecords.reduce((s, r) => s + r.total_amount, 0).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <InvoiceModal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} invoice={selectedInvoice} />
      <SalaryModal open={salaryModal} onClose={() => setSalaryModal(false)} teachers={teachers} toast={toast} />
    </div>
  );
}

function SalaryModal({ open, onClose, teachers, toast }: any) {
  const [form, setForm] = useState({ teacher_id: "", month: new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" }), base_salary: "", bonuses: "0", deductions: "0", total_amount: "", payment_method: "نقداً", status: "معلق", notes: "" });

  const calcTotal = () => {
    const base = Number(form.base_salary) || 0;
    const bon = Number(form.bonuses) || 0;
    const ded = Number(form.deductions) || 0;
    return base + bon - ded;
  };

  const handleSubmit = async () => {
    if (!form.teacher_id) { toast({ title: "اختر المعلم", variant: "destructive" }); return; }
    if (!form.base_salary) { toast({ title: "الراتب الأساسي مطلوب", variant: "destructive" }); return; }
    const total = calcTotal();
    await addSalaryRecord({ teacher_id: form.teacher_id, month: form.month, base_salary: Number(form.base_salary), bonuses: Number(form.bonuses), deductions: Number(form.deductions), total_amount: total, payment_method: form.payment_method, status: form.status, notes: form.notes || undefined });
    toast({ title: "تم إضافة الراتب" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>إضافة راتب</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>المعلم *</Label>
            <Select value={form.teacher_id || "none"} onValueChange={v => setForm(p => ({...p, teacher_id: v === "none" ? "" : v}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="اختر معلماً" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">اختر معلماً</SelectItem>
                {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الشهر</Label>
            <Input value={form.month} onChange={e => setForm(p => ({...p, month: e.target.value}))} placeholder="مثال: يناير 2026" className="mt-1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">الراتب الأساسي *</Label>
              <Input type="number" value={form.base_salary} onChange={e => setForm(p => ({...p, base_salary: e.target.value}))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">مكافآت</Label>
              <Input type="number" value={form.bonuses} onChange={e => setForm(p => ({...p, bonuses: e.target.value}))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">خصومات</Label>
              <Input type="number" value={form.deductions} onChange={e => setForm(p => ({...p, deductions: e.target.value}))} placeholder="0" className="mt-1" />
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            <span className="text-muted-foreground">الإجمالي: </span>
            <span className="font-bold text-primary">{calcTotal().toLocaleString()} ج.م</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">طريقة الدفع</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(p => ({...p, payment_method: v}))}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقداً">نقداً</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="معلق">معلق</SelectItem>
                  <SelectItem value="مدفوع">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>إضافة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
