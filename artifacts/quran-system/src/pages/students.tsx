import { useState } from "react";
import { useListStudents, useDeleteStudent, getListStudentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentModal } from "@/components/modals/student-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function PaymentBadge({ status }: { status: string }) {
  const paid = status === "paid" || status === "مدفوع";
  const exempt = status === "exempt" || status === "معفى";
  if (paid) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">مدفوع</span>;
  if (exempt) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">معفى</span>;
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">غير مدفوع</span>;
}

export default function Students() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: students, isLoading } = useListStudents();
  const deleteStudent = useDeleteStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedStudent(null);
    setModalOpen(true);
  };

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      deleteStudent.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "تم الحذف بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
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
        <h1 className="text-3xl font-bold">الطلاب</h1>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          إضافة طالب
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب ({students?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : students?.length ? (
            <div className="divide-y">
              {students.map(student => (
                <div key={student.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{student.full_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {student.teacher_name ? `المعلم: ${student.teacher_name}` : "بدون معلم"}
                        {student.circle_name ? ` — الحلقة: ${student.circle_name}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PaymentBadge status={student.payment_status || ""} />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا يوجد طلاب مسجلون</p>
          )}
        </CardContent>
      </Card>

      <StudentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        student={selectedStudent}
      />
    </div>
  );
}
