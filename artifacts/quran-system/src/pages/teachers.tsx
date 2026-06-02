import { useState } from "react";
import { useListTeachers, useDeleteTeacher, getListTeachersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Phone, Mail, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherModal } from "@/components/modals/teacher-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Teachers() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const { data: teachers, isLoading } = useListTeachers();
  const deleteTeacher = useDeleteTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedTeacher(null);
    setModalOpen(true);
  };

  const handleEdit = (teacher: any) => {
    setSelectedTeacher(teacher);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
      deleteTeacher.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "تم الحذف بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListTeachersQueryKey() });
        },
        onError: () => {
          toast({ title: "خطأ في الحذف", variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المعلمون</h1>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          إضافة معلم
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : teachers?.length ? (
            <div className="divide-y">
              {teachers.map(teacher => (
                <div key={teacher.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {teacher.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{teacher.full_name}</div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {teacher.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {teacher.phone}
                          </span>
                        )}
                        {teacher.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{teacher.student_count || 0} طالب</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(teacher)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(teacher.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا يوجد معلمون</p>
          )}
        </CardContent>
      </Card>

      <TeacherModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        teacher={selectedTeacher}
      />
    </div>
  );
}
