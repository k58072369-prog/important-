import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateTeacher, useUpdateTeacher, getListTeachersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const formSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  salary: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: any;
}

export function TeacherModal({ open, onOpenChange, teacher }: TeacherModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      salary: 0,
    },
  });

  useEffect(() => {
    if (teacher) {
      form.reset({
        full_name: teacher.full_name,
        phone: teacher.phone || "",
        email: teacher.email || "",
        salary: teacher.salary || 0,
      });
    } else {
      form.reset({
        full_name: "",
        phone: "",
        email: "",
        salary: 0,
      });
    }
  }, [teacher, form]);

  const onSubmit = (values: FormValues) => {
    if (teacher) {
      updateTeacher.mutate(
        { id: teacher.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "تم تحديث بيانات المعلم بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListTeachersQueryKey() });
            onOpenChange(false);
          },
        }
      );
    } else {
      createTeacher.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast({ title: "تم إضافة المعلم بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListTeachersQueryKey() });
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
          <DialogTitle>{teacher ? "تعديل معلم" : "إضافة معلم جديد"}</DialogTitle>
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الراتب (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} dir="ltr" className="text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createTeacher.isPending || updateTeacher.isPending}>
                {teacher ? "تحديث البيانات" : "حفظ المعلم"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
