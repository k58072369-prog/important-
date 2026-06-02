import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSession, getListSessionsQueryKey, useListCircles } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  circle_id: z.string().min(1, "الحلقة مطلوبة"),
  date: z.string().min(1, "التاريخ مطلوب"),
  day: z.string().min(1, "اليوم مطلوب"),
  time: z.string().min(1, "الوقت مطلوب"),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const STATUSES = ["مكتملة", "ملغاة", "مؤجلة", "جارية"];

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionModal({ open, onOpenChange }: SessionModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSession = useCreateSession();
  const { data: circles } = useListCircles();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      circle_id: "",
      date: today,
      day: "",
      time: "",
      status: "مكتملة",
    },
  });

  const onSubmit = (values: FormValues) => {
    createSession.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "تم إنشاء الحصة بنجاح", description: "تم إضافة سجلات الطلاب تلقائياً" });
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          form.reset();
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: "خطأ في الإنشاء", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء حصة جديدة</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {circles?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اليوم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر اليوم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending ? "جارٍ الإنشاء..." : "إنشاء الحصة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
