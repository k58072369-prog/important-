import { useState } from "react";
import { useCircles, deleteCircle, type Circle } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, CircleDot, Clock, Users, GraduationCap, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CircleModal } from "@/components/modals/circle-modal";
import { CircleDetailModal } from "@/components/modals/circle-detail-modal";
import { SafeDeleteDialog } from "@/components/safe-delete-dialog";

export default function Circles() {
  const { circles, loading } = useCircles();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editCircle, setEditCircle] = useState<Circle | null>(null);
  const [viewCircle, setViewCircle] = useState<Circle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; studentCount: number } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCircle(deleteTarget.id);
      toast({ title: `تم نقل الحلقة "${deleteTarget.name}" إلى سلة المحذوفات` });
    } catch {
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  const statusColor = (status: string) =>
    status === "نشطة" ? "bg-green-50 text-green-700 border-green-300" :
    status === "متوقفة" ? "bg-amber-50 text-amber-700 border-amber-300" :
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary">الحلقات القرءانية</h1>
          <p className="text-muted-foreground mt-1">إدارة الحلقات والمجموعات</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="ml-2 h-4 w-4" />
          إضافة حلقة
        </Button>
      </div>

      {circles.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-primary">{circles.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي الحلقات</div>
            </CardContent>
          </Card>
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-green-600">{circles.filter(c => c.status === "نشطة").length}</div>
              <div className="text-sm text-muted-foreground">نشطة</div>
            </CardContent>
          </Card>
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-accent">{circles.reduce((s, c) => s + (c.student_count ?? 0), 0)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الطلاب</div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : !circles.length ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
          <CircleDot className="h-14 w-14 mx-auto mb-4 opacity-30" />
          <p className="text-lg">لا يوجد حلقات</p>
          <p className="text-sm mt-2">اضغط على "إضافة حلقة" للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map(circle => (
            <Card key={circle.id} className="border-gold-500/20 overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="p-5 border-b border-muted/50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-accent/10 p-3 rounded-full flex-shrink-0">
                      <CircleDot className="h-6 w-6 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-secondary truncate">{circle.name}</h3>
                      {circle.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{circle.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusColor(circle.status ?? "")}`}>
                    {circle.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="pt-4 pb-4 space-y-3">
                {circle.teacher_name && (
                  <div className="flex items-center text-sm gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{circle.teacher_name}</span>
                  </div>
                )}
                {circle.days && (
                  <div className="flex items-center text-sm gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="truncate">{circle.days}{circle.time ? ` — ${circle.time}` : ""}</span>
                  </div>
                )}
                <div className="flex items-center text-sm gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{circle.student_count ?? 0} طالب مسجل</span>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-muted/50">
                  <Button variant="outline" size="sm" className="text-accent hover:text-accent hover:bg-accent/10" onClick={() => setViewCircle(circle)}>
                    <Eye className="h-4 w-4 ml-1" />
                    الملف
                  </Button>
                  <Button variant="outline" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => setEditCircle(circle)}>
                    <Edit className="h-4 w-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget({ id: circle.id, name: circle.name, studentCount: circle.student_count ?? 0 })}
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

      <CircleModal open={addOpen} onClose={() => setAddOpen(false)} />
      <CircleModal open={!!editCircle} onClose={() => setEditCircle(null)} circle={editCircle} />
      <CircleDetailModal
        open={!!viewCircle}
        onClose={() => setViewCircle(null)}
        circle={viewCircle}
        onEdit={() => { setEditCircle(viewCircle); setViewCircle(null); }}
      />

      <SafeDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name ?? ""}
        itemType="حلقة"
        relatedItems={deleteTarget?.studentCount ? [{ label: "طلاب مسجلون", count: deleteTarget.studentCount }] : []}
        impact="سيتم نقل الحلقة إلى سلة المحذوفات. يبقى الطلاب والحصص المرتبطة كما هي."
      />
    </div>
  );
}
