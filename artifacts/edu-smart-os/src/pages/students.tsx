import { useState } from "react";
import { useStudents, deleteStudent, type Student } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit, Eye, Users, BookOpen } from "lucide-react";
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

  const levelColor = (level?: string) => {
    if (level === "ممتاز") return "text-green-600 border-green-600 bg-green-50";
    if (level === "جيد جداً") return "text-emerald-600 border-emerald-600 bg-emerald-50";
    if (level === "جيد") return "text-blue-600 border-blue-400 bg-blue-50";
    if (level === "مقبول") return "text-amber-600 border-amber-400 bg-amber-50";
    if (level === "ضعيف") return "text-destructive border-destructive bg-destructive/5";
    return "text-muted-foreground";
  };

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
          { label: "ممتاز", value: students.filter(s => s.level === "ممتاز").length, color: "text-green-600" },
          { label: "معفيون", value: students.filter(s => s.is_exempt).length, color: "text-blue-600" },
          { label: "بدون حلقة", value: students.filter(s => !s.circle_id).length, color: "text-amber-600" },
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
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? "لا توجد نتائج مطابقة" : "لا يوجد طلاب بعد"}</p>
              {!search && <p className="text-sm mt-1">انقر على "إضافة طالب" للبدء</p>}
            </div>
          ) : (
            <div className="divide-y divide-muted/40">
              {students.map(student => (
                <div key={student.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{student.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-secondary truncate">{student.full_name}</p>
                      {student.level && (
                        <Badge variant="outline" className={`text-xs ${levelColor(student.level)}`}>{student.level}</Badge>
                      )}
                      {student.is_exempt && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-400 bg-blue-50">معفي</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{student.grade}</span>
                      {student.circle_name && <span>• {student.circle_name}</span>}
                      {student.teacher_name && <span>• {student.teacher_name}</span>}
                      {student.current_memorization && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" />
                          {student.current_memorization}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => setDetailStudent(student)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => setEditStudent(student)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget({ id: student.id, name: student.full_name, relatedCount: 0 })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <StudentModal open={!!editStudent} onClose={() => setEditStudent(null)} student={editStudent} />
      <StudentDetailModal
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
        onEdit={() => { setEditStudent(detailStudent); setDetailStudent(null); }}
      />
      <SafeDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name ?? ""}
        itemType="طالب"
        impact="سيتم نقل الطالب إلى سلة المحذوفات. يمكن استعادته لاحقاً."
      />
    </div>
  );
}
