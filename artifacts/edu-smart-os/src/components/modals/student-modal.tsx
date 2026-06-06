import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTeachers, useCircles, addStudent, updateStudent, type Student } from "@/lib/store";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "@/lib/backup";
import { RotateCcw } from "lucide-react";

const GRADES = [
  "أولى ابتدائي", "ثانية ابتدائي", "ثالثة ابتدائي",
  "رابعة ابتدائي", "خامسة ابتدائي", "سادسة ابتدائي",
  "أولى إعدادي", "ثانية إعدادي", "ثالثة إعدادي",
  "أولى ثانوي", "ثانية ثانوي", "ثالثة ثانوي",
  "طالب جامعي",
];
const LEVELS = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"];

const DRAFT_KEY = "add_student";

const defaultForm = {
  full_name: "", age: "", birth_date: "", grade: "", address: "",
  guardian_phone: "", secondary_phone: "", email: "",
  teacher_id: "", circle_id: "",
  is_exempt: false,
  current_memorization: "", current_revision: "",
  last_memorization_position: "", last_revision_position: "",
  level: "", rating: "", notes: "",
  enrollment_date: new Date().toISOString().split("T")[0],
};

interface StudentModalProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
}

export function StudentModal({ open, onClose, student }: StudentModalProps) {
  const { toast } = useToast();
  const { teachers } = useTeachers();
  const { circles } = useCircles();
  const [isPending, setIsPending] = useState(false);
  const isEdit = !!student;
  const skipDraftRef = useRef(false);

  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (!open) return;
    if (student) {
      skipDraftRef.current = true;
      setForm({
        full_name: student.full_name ?? "",
        age: student.age?.toString() ?? "",
        birth_date: student.birth_date ?? "",
        grade: student.grade ?? "",
        address: student.address ?? "",
        guardian_phone: student.guardian_phone ?? "",
        secondary_phone: student.secondary_phone ?? "",
        email: student.email ?? "",
        teacher_id: student.teacher_id ?? "",
        circle_id: student.circle_id ?? "",
        is_exempt: student.is_exempt ?? false,
        current_memorization: student.current_memorization ?? "",
        current_revision: student.current_revision ?? "",
        last_memorization_position: student.last_memorization_position ?? "",
        last_revision_position: student.last_revision_position ?? "",
        level: student.level ?? "",
        rating: student.rating?.toString() ?? "",
        notes: student.notes ?? "",
        enrollment_date: student.enrollment_date ?? new Date().toISOString().split("T")[0],
      });
    } else {
      skipDraftRef.current = false;
      const draft = loadDraft<typeof defaultForm>(DRAFT_KEY);
      setForm(draft ?? { ...defaultForm, enrollment_date: new Date().toISOString().split("T")[0] });
    }
  }, [student, open]);

  useEffect(() => {
    if (isEdit || skipDraftRef.current || !open) return;
    saveDraft(DRAFT_KEY, form);
  }, [form, isEdit, open]);

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    if (!form.grade) { toast({ title: "الصف الدراسي مطلوب", variant: "destructive" }); return; }
    if (!form.guardian_phone.trim()) { toast({ title: "رقم ولي الأمر مطلوب", variant: "destructive" }); return; }

    const payload = {
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : undefined,
      birth_date: form.birth_date || undefined,
      grade: form.grade,
      address: form.address || undefined,
      guardian_phone: form.guardian_phone,
      secondary_phone: form.secondary_phone || undefined,
      email: form.email || undefined,
      teacher_id: form.teacher_id && form.teacher_id !== "none" ? form.teacher_id : undefined,
      circle_id: form.circle_id && form.circle_id !== "none" ? form.circle_id : undefined,
      payment_status: student?.payment_status ?? "غير مدفوع",
      payment_amount: student?.payment_amount,
      is_exempt: form.is_exempt,
      current_memorization: form.current_memorization || undefined,
      current_revision: form.current_revision || undefined,
      last_memorization_position: form.last_memorization_position || undefined,
      last_revision_position: form.last_revision_position || undefined,
      level: form.level || undefined,
      rating: form.rating ? parseInt(form.rating) : undefined,
      notes: form.notes || undefined,
      enrollment_date: form.enrollment_date,
    };

    setIsPending(true);
    try {
      if (isEdit && student) {
        await updateStudent(student.id, payload);
        toast({ title: "تم تعديل بيانات الطالب بنجاح" });
      } else {
        await addStudent(payload as any);
        clearDraft(DRAFT_KEY);
        toast({ title: "تم إضافة الطالب بنجاح" });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-secondary">
              {isEdit ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
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
          {/* ─── البيانات الأساسية ─── */}
          <div className="col-span-full">
            <p className="text-sm font-semibold text-secondary mb-3 pb-1 border-b">البيانات الأساسية</p>
          </div>
          <div className="space-y-2">
            <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
            <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="أدخل الاسم الكامل" />
          </div>
          <div className="space-y-2">
            <Label>الصف الدراسي <span className="text-destructive">*</span></Label>
            <Select value={form.grade} onValueChange={v => set("grade", v)}>
              <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
              <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>العمر</Label>
            <Input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="العمر بالسنوات" min={5} max={30} />
          </div>
          <div className="space-y-2">
            <Label>تاريخ الميلاد</Label>
            <Input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>رقم ولي الأمر <span className="text-destructive">*</span></Label>
            <Input value={form.guardian_phone} onChange={e => set("guardian_phone", e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>رقم إضافي (اختياري)</Label>
            <Input value={form.secondary_phone} onChange={e => set("secondary_phone", e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="example@email.com" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>تاريخ التسجيل</Label>
            <Input type="date" value={form.enrollment_date} onChange={e => set("enrollment_date", e.target.value)} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>العنوان</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="العنوان التفصيلي" />
          </div>

          {/* ─── التعيين ─── */}
          <div className="col-span-full border-t pt-4">
            <p className="text-sm font-semibold text-secondary mb-3">الحلقة والمعلم</p>
          </div>
          <div className="space-y-2">
            <Label>الحلقة</Label>
            <Select value={form.circle_id || "none"} onValueChange={v => set("circle_id", v)}>
              <SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون حلقة</SelectItem>
                {circles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>المعلم</Label>
            <Select value={form.teacher_id || "none"} onValueChange={v => set("teacher_id", v)}>
              <SelectTrigger><SelectValue placeholder="اختر المعلم" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون معلم</SelectItem>
                {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ─── بيانات الحفظ ─── */}
          <div className="col-span-full border-t pt-4">
            <p className="text-sm font-semibold text-secondary mb-3">بيانات الحفظ والمراجعة</p>
          </div>
          <div className="space-y-2">
            <Label>الحفظ الحالي</Label>
            <Input value={form.current_memorization} onChange={e => set("current_memorization", e.target.value)} placeholder="مثال: سورة البقرة - الآية 50" />
          </div>
          <div className="space-y-2">
            <Label>المراجعة الحالية</Label>
            <Input value={form.current_revision} onChange={e => set("current_revision", e.target.value)} placeholder="مثال: الجزء الأول" />
          </div>
          <div className="space-y-2">
            <Label>آخر موضع حفظ</Label>
            <Input value={form.last_memorization_position} onChange={e => set("last_memorization_position", e.target.value)} placeholder="مثال: سورة آل عمران - الآية 10" />
          </div>
          <div className="space-y-2">
            <Label>آخر موضع مراجعة</Label>
            <Input value={form.last_revision_position} onChange={e => set("last_revision_position", e.target.value)} placeholder="مثال: الجزء الثاني - الربع الأول" />
          </div>

          {/* ─── المستوى والتقييم ─── */}
          <div className="col-span-full border-t pt-4">
            <p className="text-sm font-semibold text-secondary mb-3">المستوى والتقييم</p>
          </div>
          <div className="space-y-2">
            <Label>مستوى الطالب</Label>
            <Select value={form.level || "none"} onValueChange={v => set("level", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">غير محدد</SelectItem>
                {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>التقييم (1-10)</Label>
            <Input type="number" value={form.rating} onChange={e => set("rating", e.target.value)} placeholder="0" min={1} max={10} />
          </div>

          {/* ─── الإعفاء ─── */}
          <div className="col-span-full border-t pt-4">
            <p className="text-sm font-semibold text-secondary mb-3">الإعفاء من الرسوم</p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={form.is_exempt} onCheckedChange={v => set("is_exempt", v)} id="is_exempt" />
            <Label htmlFor="is_exempt">الطالب معفي من رسوم الاشتراك</Label>
          </div>

          {/* ─── ملاحظات ─── */}
          <div className="col-span-full border-t pt-4">
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="أي ملاحظات إضافية..." rows={3} />
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-2 border-t">
          <div>
            {!isEdit && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { clearDraft(DRAFT_KEY); setForm({ ...defaultForm, enrollment_date: new Date().toISOString().split("T")[0] }); }}>
                مسح المسودة
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
              {isPending ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الطالب"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
