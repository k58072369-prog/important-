import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { addTeacher, updateTeacher, type Teacher } from "@/lib/store";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "@/lib/backup";
import { RotateCcw } from "lucide-react";

const DRAFT_KEY = "add_teacher";

const defaultForm = {
  full_name: "", age: "", phone: "", secondary_phone: "", email: "",
  address: "", salary: "", hire_date: "", experience: "", notes: "",
};

interface TeacherModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
}

export function TeacherModal({ open, onClose, teacher }: TeacherModalProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const isEdit = !!teacher;
  const skipDraftRef = useRef(false);

  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (!open) return;
    if (teacher) {
      skipDraftRef.current = true;
      setForm({
        full_name: teacher.full_name ?? "",
        age: teacher.age?.toString() ?? "",
        phone: teacher.phone ?? "",
        secondary_phone: teacher.secondary_phone ?? "",
        email: teacher.email ?? "",
        address: teacher.address ?? "",
        salary: teacher.salary?.toString() ?? "",
        hire_date: teacher.hire_date ?? "",
        experience: teacher.experience ?? "",
        notes: teacher.notes ?? "",
      });
    } else {
      skipDraftRef.current = false;
      const draft = loadDraft<typeof defaultForm>(DRAFT_KEY);
      setForm(draft ?? { ...defaultForm });
    }
  }, [teacher, open]);

  useEffect(() => {
    if (isEdit || skipDraftRef.current || !open) return;
    saveDraft(DRAFT_KEY, form);
  }, [form, isEdit, open]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    if (!form.phone.trim()) { toast({ title: "رقم الهاتف مطلوب", variant: "destructive" }); return; }

    const payload = {
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : undefined,
      phone: form.phone,
      secondary_phone: form.secondary_phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      salary: form.salary ? parseFloat(form.salary) : undefined,
      hire_date: form.hire_date || undefined,
      experience: form.experience || undefined,
      notes: form.notes || undefined,
    };

    setIsPending(true);
    try {
      if (isEdit && teacher) {
        await updateTeacher(teacher.id, payload);
        toast({ title: "تم تعديل بيانات المعلم بنجاح" });
      } else {
        await addTeacher(payload as any);
        clearDraft(DRAFT_KEY);
        toast({ title: "تم إضافة المعلم بنجاح" });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-secondary">
              {isEdit ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
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
          <div className="space-y-2">
            <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
            <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="أدخل الاسم الكامل" />
          </div>
          <div className="space-y-2">
            <Label>العمر</Label>
            <Input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="العمر بالسنوات" min={18} max={80} />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف <span className="text-destructive">*</span></Label>
            <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>رقم احتياطي</Label>
            <Input value={form.secondary_phone} onChange={e => set("secondary_phone", e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="example@email.com" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>المرتب الشهري (ج.م)</Label>
            <Input type="number" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="0" min={0} />
          </div>
          <div className="space-y-2">
            <Label>تاريخ التعيين</Label>
            <Input type="date" value={form.hire_date} onChange={e => set("hire_date", e.target.value)} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>العنوان</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="العنوان التفصيلي" />
          </div>
          <div className="col-span-full space-y-2">
            <Label>الخبرات والمؤهلات</Label>
            <Textarea value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="مثال: حاصل على إجازة بالقراءات العشر، خبرة 10 سنوات..." rows={3} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="أي ملاحظات إضافية..." rows={2} />
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
              {isPending ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة المعلم"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
