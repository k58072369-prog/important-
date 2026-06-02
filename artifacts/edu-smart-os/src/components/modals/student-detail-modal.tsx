import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, MapPin, BookOpen } from "lucide-react";
import type { Student } from "@/lib/store";

interface StudentDetailModalProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
  onEdit?: () => void;
}

export function StudentDetailModal({ open, onClose, student, onEdit }: StudentDetailModalProps) {
  if (!student) return null;

  const paymentColor =
    student.payment_status === "مدفوع" ? "text-green-600 border-green-600" :
    student.payment_status === "غير مدفوع" ? "text-destructive border-destructive" :
    "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">ملف الطالب</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{student.full_name}</h2>
              <p className="text-muted-foreground mt-1">{student.grade}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={paymentColor}>{student.payment_status}</Badge>
              {student.level && <Badge className="bg-accent/20 text-accent border-accent">{student.level}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span dir="ltr">{student.guardian_phone}</span>
            </div>
            {student.secondary_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{student.secondary_phone}</span>
              </div>
            )}
            {student.email && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Mail className="h-4 w-4 text-primary" />
                <span dir="ltr">{student.email}</span>
              </div>
            )}
            {(student.address || student.governorate) && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{[student.address, student.governorate].filter(Boolean).join(" - ")}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">الحلقة</div>
              <div className="font-semibold text-sm">{student.circle_name || "غير محدد"}</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">المعلم</div>
              <div className="font-semibold text-sm">{student.teacher_name || "غير محدد"}</div>
            </div>
            <div className="bg-accent/5 rounded-lg p-3 text-center border border-accent/10">
              <div className="text-xs text-muted-foreground mb-1">النقاط</div>
              <div className="font-bold text-lg text-accent">{student.points ?? 0}</div>
            </div>
            <div className="bg-accent/5 rounded-lg p-3 text-center border border-accent/10">
              <div className="text-xs text-muted-foreground mb-1">التقييم</div>
              <div className="font-bold text-lg text-accent">{student.rating ? `${student.rating}/10` : "—"}</div>
            </div>
          </div>

          {(student.current_memorization || student.current_revision) && (
            <div className="space-y-2">
              <h3 className="font-semibold text-secondary flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                الحفظ والمراجعة
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                {student.current_memorization && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحفظ الحالي</span>
                    <span className="font-medium">{student.current_memorization}</span>
                  </div>
                )}
                {student.current_revision && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المراجعة الحالية</span>
                    <span className="font-medium">{student.current_revision}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/20 rounded-lg p-3">
            <div>
              <span className="text-muted-foreground">قيمة الرسوم: </span>
              <span className="font-semibold">{student.payment_amount ? `${student.payment_amount} ج.م` : "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">معفي: </span>
              <span className={student.is_exempt ? "text-green-600 font-semibold" : ""}>{student.is_exempt ? "نعم" : "لا"}</span>
            </div>
            {student.age && <div><span className="text-muted-foreground">العمر: </span><span>{student.age} سنة</span></div>}
            {student.birth_date && <div><span className="text-muted-foreground">الميلاد: </span><span dir="ltr">{student.birth_date}</span></div>}
          </div>

          {student.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <span className="font-semibold">ملاحظات: </span>{student.notes}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          {onEdit && (
            <Button onClick={onEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Edit className="h-4 w-4 ml-2" />
              تعديل البيانات
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
