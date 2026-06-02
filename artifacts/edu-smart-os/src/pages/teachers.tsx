import { useState } from "react";
import { useTeachers, deleteTeacher, type Teacher } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, GraduationCap, Phone, Users, CircleDot, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeacherModal } from "@/components/modals/teacher-modal";
import { SafeDeleteDialog } from "@/components/safe-delete-dialog";

export default function Teachers() {
  const { teachers, loading } = useTeachers();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; circleCount: number; studentCount: number } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeacher(deleteTarget.id);
      toast({ title: `تم نقل المعلم "${deleteTarget.name}" إلى سلة المحذوفات` });
    } catch {
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary">المعلمون</h1>
          <p className="text-muted-foreground mt-1">إدارة الكادر التعليمي</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="ml-2 h-4 w-4" />
          إضافة معلم
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : !teachers.length ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
          <GraduationCap className="h-14 w-14 mx-auto mb-4 opacity-30" />
          <p className="text-lg">لا يوجد معلمون</p>
          <p className="text-sm mt-2">اضغط على "إضافة معلم" للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(teacher => (
            <Card key={teacher.id} className="border-gold-500/20 overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="bg-gradient-to-l from-primary/10 to-transparent p-5 border-b border-muted/50">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-secondary truncate">{teacher.full_name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span dir="ltr">{teacher.phone}</span>
                    </div>
                    {teacher.experience && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{teacher.experience}</p>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col items-center bg-muted/30 rounded-lg p-3">
                    <CircleDot className="h-4 w-4 text-accent mb-1" />
                    <div className="text-xl font-bold text-accent">{teacher.circle_count ?? 0}</div>
                    <div className="text-xs text-muted-foreground">حلقات</div>
                  </div>
                  <div className="flex flex-col items-center bg-muted/30 rounded-lg p-3">
                    <Users className="h-4 w-4 text-primary mb-1" />
                    <div className="text-xl font-bold text-primary">{teacher.student_count ?? 0}</div>
                    <div className="text-xs text-muted-foreground">طلاب</div>
                  </div>
                </div>
                {teacher.salary && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Banknote className="h-4 w-4" />
                    <span>المرتب: <span className="font-semibold text-secondary">{teacher.salary} ج.م</span></span>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-3 border-t border-muted/50">
                  <Button variant="outline" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => setEditTeacher(teacher)}>
                    <Edit className="h-4 w-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget({ id: teacher.id, name: teacher.full_name, circleCount: teacher.circle_count ?? 0, studentCount: teacher.student_count ?? 0 })}
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeacherModal open={addOpen} onClose={() => setAddOpen(false)} />
      <TeacherModal open={!!editTeacher} onClose={() => setEditTeacher(null)} teacher={editTeacher} />

      <SafeDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name ?? ""}
        itemType="معلم"
        requireTyping
        relatedItems={deleteTarget ? [
          ...(deleteTarget.circleCount > 0 ? [{ label: "حلقات مرتبطة", count: deleteTarget.circleCount }] : []),
          ...(deleteTarget.studentCount > 0 ? [{ label: "طلاب مرتبطون", count: deleteTarget.studentCount }] : []),
        ] : []}
        impact="سيتم نقل المعلم إلى سلة المحذوفات. تبقى الحلقات والطلاب المرتبطون به كما هم."
      />
    </div>
  );
}
