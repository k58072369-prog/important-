import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { addExpense } from "@/lib/store";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "@/lib/backup";
import { RotateCcw } from "lucide-react";

const CATEGORIES = [
  "شراء كراسي", "شراء مكاتب", "كهرباء", "مياه", "إنترنت",
  "صيانة أجهزة", "أدوات مكتبية", "رواتب المعلمين", "رواتب المحفظين",
  "مرتبات", "إيجار", "صيانة", "مستلزمات", "تسويق", "مواصلات",
  "متنوعات", "أخرى",
];

const DRAFT_KEY = "add_expense";

const defaultForm = {
  name: "",
  category: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  payment_method: "نقداً",
  responsible: "",
  notes: "",
};

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExpenseModal({ open, onClose }: ExpenseModalProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const skipDraftRef = useRef(false);

  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (!open) return;
    skipDraftRef.current = false;
    const draft = loadDraft<typeof defaultForm>(DRAFT_KEY);
    setForm(draft ?? { ...defaultForm, date: new Date().toISOString().split("T")[0] });
  }, [open]);

  useEffect(() => {
    if (skipDraftRef.current || !open) return;
    saveDraft(DRAFT_KEY, form);
  }, [form, open]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.category) { toast({ title: "التصنيف مطلوب", variant: "destructive" }); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast({ title: "المبلغ مطلوب ويجب أن يكون أكبر من صفر", variant: "destructive" }); return; }
    if (!form.date) { toast({ title: "التاريخ مطلوب", variant: "destructive" }); return; }

    setIsPending(true);
    try {
      await addExpense({
        name: form.name || undefined,
        category: form.category,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        date: form.date,
        payment_method: form.payment_method || undefined,
        responsible: form.responsible || undefined,
        notes: form.notes || undefined,
      });
      clearDraft(DRAFT_KEY);
      toast({ title: "تم إضافة المصروف بنجاح" });
      onClose();
    } catch {
      toast({ title: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const draftExists = hasDraft(DRAFT_KEY);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-secondary">إضافة مصروف جديد</DialogTitle>
            {draftExists && (
              <Badge variant="outline" className="text-green-700 border-green-400 bg-green-50 text-xs flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                تم استعادة مسودة
              </Badge>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>اسم المصروف</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: كراسي حصص الحفظ" />
            </div>
            <div className="space-y-2">
              <Label>التصنيف <span className="text-destructive">*</span></Label>
              <Select value={form.category || "none"} onValueChange={v => set("category", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">اختر</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المسؤول</Label>
              <Input value={form.responsible} onChange={e => set("responsible", e.target.value)} placeholder="اسم المسؤول" />
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ج.م) <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" min={0} step={0.01} />
            </div>
            <div className="space-y-2">
              <Label>التاريخ <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>طريقة الدفع</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقداً">نقداً</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                  <SelectItem value="بطاقة ائتمانية">بطاقة ائتمانية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="وصف المصروف..." rows={2} />
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-3 pt-2 border-t">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { clearDraft(DRAFT_KEY); setForm({ ...defaultForm, date: new Date().toISOString().split("T")[0] }); }}>
            مسح المسودة
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-white">
              {isPending ? "جاري الحفظ..." : "إضافة المصروف"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
