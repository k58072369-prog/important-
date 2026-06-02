import { useState } from "react";
import { useStudents, deleteStudent, type Student } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentModal } from "@/components/modals/student-modal";
import { StudentDetailModal } from "@/components/modals/student-detail-modal";
import { SafeDeleteDialog } from "@/components/safe-delete-dialog";

export default function Students() {
  const [search, setSearch] = useState("");
  const { students, loading } = useStudents(search);
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; relatedCount: number } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudent(deleteTarget.id);
      toast({ title: `تم نقل الطالب "${deleteTarget.name}" إلى سلة المحذوفات` });
    } catch {
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  const paymentColor = (status: string) =>
    status === "مدفوع" ? "text-green-600 border-green-600 bg-green-50" :
    status === "غير مدفوع" ? "text-destructive border-destructive bg-destructive/5" :
    status === "معفي" ? "text-blue-600 border-blue-400 bg-blue-50" :
    "text-amber-600 border-amber-400 bg-amber-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">الطلاب</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات طلاب الحلقات القرءانية</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="ml-2 h-4 w-4" />
          إضافة طالب
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: students.length, color: "text-primary" },
          { label: "مدفوعون", value: students.filter(s => s.payment_status === "مدفوع").length, color: "text-green-600" },
          { label: "غير مدفوعين", value: students.filter(s => s.payment_status === "غير مدفوع").length, color: "text-destructive" },
          { label: "معفيون", value: students.filter(s => s.is_exempt).length, color: "text-blue-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-gold-500/20">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gold-500/20">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !students.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">{search ? "لا توجد نتائج" : "لا يوجد طلاب"}</p>
              <p className="text-sm mt-1">{search ? "جرب تغيير كلمة البحث" : "اضغط على \"إضافة طالب\" للبدء"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-muted-foreground bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tr-lg">الاسم</th>
                    <th className="px-4 py-3">الصف</th>
                    <th className="px-4 py-3">الحلقة</th>
                    <th className="px-4 py-3">المعلم</th>
                    <th className="px-4 py-3">رقم الهاتف</th>
                    <th className="px-4 py-3">حالة الدفع</th>
                    <th className="px-4 py-3 rounded-tl-lg text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-muted/60 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-secondary">{student.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.grade || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.circle_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.teacher_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">{student.guardian_phone || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${paymentColor(student.payment_status)}`}>
                          {student.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="عرض" onClick={() => setDetailStudent(student)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="تعديل" onClick={() => setEditStudent(student)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="حذف"
                            onClick={() => setDeleteTarget({ id: student.id, name: student.full_name, relatedCount: 0 })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <StudentModal open={!!editStudent} onClose={() => setEditStudent(null)} student={editStudent} />
      <StudentDetailModal open={!!detailStudent} onClose={() => setDetailStudent(null)} student={detailStudent} />

      <SafeDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name ?? ""}
        itemType="طالب"
        requireTyping
        impact="سيتم نقل الطالب إلى سلة المحذوفات مع الاحتفاظ بجميع بياناته وفواتيره. يمكن استعادته لاحقاً."
      />
    </div>
  );
}
