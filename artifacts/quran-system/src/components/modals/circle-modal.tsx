import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCircle, useUpdateCircle, getListCirclesQueryKey, useListTeachers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, "اسم الحلقة مطلوب"),
  description: z.string().optional(),
  days: z.string().optional(),
  time: z.string().optional(),
  teacher_id: z.string().optional(),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CircleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circle?: any;
}

export function CircleModal({ open, onOpenChange, circle }: CircleModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createCircle = useCreateCircle();
  const updateCircle = useUpdateCircle();
  const { data: teachers } = useListTeachers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      days: "",
      time: "",
      teacher_id: "",
      status: "نشطة",
    },
  });

  useEffect(() => {
    if (circle) {
      form.reset({
        name: circle.name || "",
        description: circle.description || "",
        days: circle.days || "",
        time: circle.time || "",
        teacher_id: circle.teacher_id || "",
        status: circle.status || "نشطة",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        days: "",
        time: "",
        teacher_id: "",
        status: "نشطة",
      });
    }
  }, [circle, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      description: values.description,
      days: values.days,
      time: values.time,
      teacher_id: values.teacher_id === "none" ? undefined : values.teacher_id,
      status: values.status ?? "نشطة",
    };

    if (circle) {
      updateCircle.mutate(
        { id: circle.id, data: payload },
        {
          onSuccess: () => {
            toast({ title: "تم تحديث الحلقة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListCirclesQueryKey() });
            onOpenChange(false);
          },
          onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
        }
      );
    } else {
      createCircle.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "تم إنشاء الحلقة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListCirclesQueryKey() });
            form.reset();
            onOpenChange(false);
          },
          onError: () => toast({ title: "خطأ في الإنشاء", variant: "destructive" }),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{circle ? "تعديل الحلقة" : "إنشاء حلقة جديدة"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الحلقة</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: حلقة الفجر" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="وصف مختصر للحلقة" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المعلم المسؤول</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أيام الحلقة</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: السبت والاثنين" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوقت</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحالة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="نشطة">نشطة</SelectItem>
                      <SelectItem value="متوقفة">متوقفة</SelectItem>
                      <SelectItem value="مكتملة">مكتملة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createCircle.isPending || updateCircle.isPending}>
                {circle ? "تحديث الحلقة" : "إنشاء الحلقة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
