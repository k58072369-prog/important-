import { useState } from "react";
import { useListCircles, useDeleteCircle, getListCirclesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Edit, Trash2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleModal } from "@/components/modals/circle-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Circles() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);

  const { data: circles, isLoading } = useListCircles();
  const deleteCircle = useDeleteCircle();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedCircle(null);
    setModalOpen(true);
  };

  const handleEdit = (circle: any) => {
    setSelectedCircle(circle);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      deleteCircle.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "تم حذف الحلقة" });
          queryClient.invalidateQueries({ queryKey: getListCirclesQueryKey() });
        },
        onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" })
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الحلقات</h1>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          إنشاء حلقة
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : circles?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map(circle => (
            <Card key={circle.id} className="relative group">
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(circle)}>
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(circle.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{circle.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {circle.teacher_name ?? "بدون معلم"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    circle.status === "نشطة" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                  }`}>
                    {circle.status ?? "غير محدد"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {circle.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{circle.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {circle.student_count ?? 0} طالب
                  </span>
                  {circle.time && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {circle.time}
                    </span>
                  )}
                </div>
                {circle.days && (
                  <p className="text-xs text-muted-foreground">{circle.days}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            لا توجد حلقات مسجلة — انقر على "إنشاء حلقة" للبدء
          </CardContent>
        </Card>
      )}

      <CircleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        circle={selectedCircle}
      />
    </div>
  );
}
