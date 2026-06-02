import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTeachers, addCircle, updateCircle, type Circle } from "@/lib/store";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "@/lib/backup";
import { RotateCcw } from "lucide-react";

const DAYS_OPTIONS = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
  "الأحد - الثلاثاء", "الأحد - الثلاثاء - الخميس",
  "الاثنين - الأربعاء", "الاثنين - الأربعاء - الجمعة",
  "يومياً",
];

const DRAFT_KEY = "add_circle";

const defaultForm = {
  name: "", description: "", teacher_id: "", days: "",
  start_time: "", end_time: "", status: "نشطة",
};

interface CircleModalProps {
  open: boolean;
  onClose: () => void;
  circle?: Circle | null;
}

export function CircleModal({ open, onClose, circle }: CircleModalProps) {
  const { toast } = useToast();
  const { teachers } = useTeachers();
  const [isPending, setIsPending] = useState(false);
  const isEdit = !!circle;
  const skipDraftRef = useRef(false);

  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (!open) return;
    if (circle) {
      skipDraftRef.current = true;
      const timeParts = circle.time?.split(" - ") ?? ["", ""];
      setForm({
        name: circle.name ?? "",
        description: circle.description ?? "",
        teacher_id: circle.teacher_id ?? "",
        days: circle.days ?? "",
        start_time: timeParts[0] ?? "",
        end_time: timeParts[1] ?? "",
        status: circle.status ?? "نشطة",
      });
    } else {
      skipDraftRef.current = false;
      const draft = loadDraft<typeof defaultForm>(DRAFT_KEY);
      setForm(draft ?? { ...defaultForm });
    }
  }, [circle, open]);

  useEffect(() => {
    if (isEdit || skipDraftRef.current || !open) return;
    saveDraft(DRAFT_KEY, form);
  }, [form, isEdit, open]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: "اسم الحلقة مطلوب", variant: "destructive" }); return; }

    const time = form.start_time && form.end_time ? `${form.start_time} - ${form.end_time}` : form.start_time || undefined;
    const payload = {
      name: form.name,
      description: form.description || undefined,
      teacher_id: form.teacher_id && form.teacher_id !== "none" ? form.teacher_id : undefined,
      days: form.days || undefined,
      time,
      status: form.status,
    };

    setIsPending(true);
    try {
      if (isEdit && circle) {
        await updateCircle(circle.id, payload);
        toast({ title: "تم تعديل الحلقة بنجاح" });
      } else {
        await addCircle(payload as any);
        clearDraft(DRAFT_KEY);
        toast({ title: "تم إضافة الحلقة بنجاح" });
      }
      onClose();
    } catch {
      toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const draftExists = !isEdit && hasDraft(DRAFT_KEY);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-secondary">
              {isEdit ? "تعديل بيانات الحلقة" : "إضافة حلقة جديدة"}
            </DialogTitle>
            {draftExists && !isEdit && (
              <Badge variant="outline" className="text-green-700 border-green-400 bg-green-50 text-xs flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                تم استعادة مسودة محفوظة
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="col-span-full space-y-2">
            <Label>اسم الحلقة <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: حلقة الفجر" />
          </div>
          <div className="col-span-full space-y-2">
            <Label>وصف الحلقة</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="وصف مختصر للحلقة..." rows={2} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>المعلم المسؤول</Label>
            <Select value={form.teacher_id || "none"} onValueChange={v => set("teacher_id", v)}>
              <SelectTrigger><SelectValue placeholder="اختر المعلم" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون معلم</SelectItem>
                {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-full space-y-2">
            <Label>أيام الحلقة</Label>
            <Select value={form.days || "none"} onValueChange={v => set("days", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="اختر الأيام" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">غير محدد</SelectItem>
                {DAYS_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>وقت البداية</Label>
            <Input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>وقت النهاية</Label>
            <Input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>حالة الحلقة</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="نشطة">نشطة</SelectItem>
                <SelectItem value="متوقفة">متوقفة</SelectItem>
                <SelectItem value="مغلقة">مغلقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-2 border-t">
          <div>
            {!isEdit && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { clearDraft(DRAFT_KEY); setForm({ ...defaultForm }); }}>
                مسح المسودة
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
              {isPending ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الحلقة"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
