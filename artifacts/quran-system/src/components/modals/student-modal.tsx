import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateStudent, useUpdateStudent, getListStudentsQueryKey, useListTeachers, useListCircles } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const formSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  grade: z.string().min(1, "الصف الدراسي مطلوب"),
  guardian_phone: z.string().min(8, "رقم ولي الأمر مطلوب"),
  teacher_id: z.string().optional(),
  circle_id: z.string().optional(),
  payment_status: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
}

export function StudentModal({ open, onOpenChange, student }: StudentModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  
  const { data: teachers } = useListTeachers();
  const { data: circles } = useListCircles();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      grade: "",
      guardian_phone: "",
      teacher_id: "",
      circle_id: "",
      payment_status: "unpaid",
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        full_name: student.full_name,
        grade: student.grade || "",
        guardian_phone: student.guardian_phone || "",
        teacher_id: student.teacher_id || "",
        circle_id: student.circle_id || "",
        payment_status: student.payment_status || "unpaid",
      });
    } else {
      form.reset({
        full_name: "",
        grade: "",
        guardian_phone: "",
        teacher_id: "",
        circle_id: "",
        payment_status: "unpaid",
      });
    }
  }, [student, form]);

  const onSubmit = (values: FormValues) => {
    if (student) {
      updateStudent.mutate(
        { id: student.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "تم تحديث بيانات الطالب بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
            onOpenChange(false);
          },
        }
      );
    } else {
      createStudent.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast({ title: "تم إضافة الطالب بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{student ? "تعديل طالب" : "إضافة طالب جديد"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الرباعي</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصف الدراسي</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guardian_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم ولي الأمر</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="teacher_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المعلم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المعلم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون معلم</SelectItem>
                        {teachers?.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="circle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحلقة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحلقة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون حلقة</SelectItem>
                        {circles?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حالة الدفع</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="unpaid">غير مدفوع</SelectItem>
                      <SelectItem value="exempt">معفى</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createStudent.isPending || updateStudent.isPending}>
                {student ? "تحديث البيانات" : "حفظ الطالب"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
