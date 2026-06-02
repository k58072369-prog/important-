import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateInvoice, type Invoice } from "@/lib/store";

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
}

export function InvoiceModal({ open, onClose, invoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState({
    status: "غير مدفوع",
    paid_amount: "",
    payment_method: "نقداً",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (invoice) {
      setForm({
        status: invoice.status ?? "غير مدفوع",
        paid_amount: invoice.paid_amount?.toString() ?? invoice.amount?.toString() ?? "",
        payment_method: invoice.payment_method ?? "نقداً",
        payment_date: invoice.payment_date ?? new Date().toISOString().split("T")[0],
        notes: invoice.notes ?? "",
      });
    }
  }, [invoice]);

  const handleSave = async () => {
    if (!invoice) return;
    setIsPending(true);
    try {
      const updates: Partial<Invoice> = {
        status: form.status,
        payment_method: form.payment_method || undefined,
        payment_date: form.status === "مدفوع" || form.status === "مدفوع جزئياً" ? form.payment_date : undefined,
        notes: form.notes || undefined,
      };
      if (form.paid_amount) {
        const paidAmt = parseFloat(form.paid_amount);
        updates.paid_amount = paidAmt;
        if (paidAmt < invoice.amount && form.status === "مدفوع") {
          updates.status = "مدفوع جزئياً";
        }
      }
      await updateInvoice(invoice.id, updates);
      toast({ title: "تم تحديث الفاتورة بنجاح" });
      onClose();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  if (!invoice) return null;

  const statusColor = (s: string) =>
    s === "مدفوع" ? "text-green-600 border-green-600" :
    s === "غير مدفوع" ? "text-destructive border-destructive" :
    s === "مدفوع جزئياً" ? "text-amber-600 border-amber-400" :
    s === "معفي" ? "text-blue-600 border-blue-400" :
    "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">تفاصيل الفاتورة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">الطالب</span>
              <span className="font-semibold">{invoice.student_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">الشهر</span>
              <span className="font-semibold">{invoice.month}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">المبلغ الكامل</span>
              <span className="font-bold text-primary text-lg">{invoice.amount} ج.م</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">الحالة الحالية</span>
              <Badge variant="outline" className={statusColor(invoice.status ?? "")}>{invoice.status}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>تغيير الحالة</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="مدفوع">مدفوع بالكامل</SelectItem>
                <SelectItem value="مدفوع جزئياً">مدفوع جزئياً</SelectItem>
                <SelectItem value="غير مدفوع">غير مدفوع</SelectItem>
                <SelectItem value="معفي">معفي</SelectItem>
                <SelectItem value="متأخر">متأخر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(form.status === "مدفوع" || form.status === "مدفوع جزئياً") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>المبلغ المدفوع (ج.م)</Label>
                  <Input
                    type="number"
                    value={form.paid_amount}
                    onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))}
                    placeholder={invoice.amount?.toString()}
                    max={invoice.amount}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الدفع</Label>
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="نقداً">نقداً</SelectItem>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                    <SelectItem value="بطاقة ائتمانية">بطاقة ائتمانية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="ملاحظات إضافية..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
