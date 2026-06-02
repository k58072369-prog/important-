import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetSession,
  useGetSessionRecords,
  useSaveSessionRecords,
  getGetSessionQueryKey,
  getGetSessionRecordsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Save, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PERFORMANCE_LABELS = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"];

type RecordState = {
  id: string;
  student_id: string;
  student_name: string;
  is_present: boolean;
  memorization_amount: string;
  revision_amount: string;
  next_memorization: string;
  next_revision: string;
  grade: number;
  performance_label: string;
  notes: string;
};

export default function SessionDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useGetSession(id, {
    query: { enabled: !!id, queryKey: getGetSessionQueryKey(id) },
  });

  const { data: records, isLoading: recordsLoading } = useGetSessionRecords(id, {
    query: { enabled: !!id, queryKey: getGetSessionRecordsQueryKey(id) },
  });

  const saveRecords = useSaveSessionRecords();

  const [localRecords, setLocalRecords] = useState<RecordState[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (records) {
      setLocalRecords(
        records.map((r: any) => ({
          id: r.id,
          student_id: r.student_id,
          student_name: r.student_name ?? "",
          is_present: r.is_present ?? true,
          memorization_amount: r.memorization_amount ?? "",
          revision_amount: r.revision_amount ?? "",
          next_memorization: r.next_memorization ?? "",
          next_revision: r.next_revision ?? "",
          grade: r.grade ?? 0,
          performance_label: r.performance_label ?? "",
          notes: r.notes ?? "",
        }))
      );
      setDirty(false);
    }
  }, [records]);

  const updateRecord = (index: number, field: keyof RecordState, value: unknown) => {
    setLocalRecords(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSaveAll = () => {
    saveRecords.mutate(
      { id, data: { records: localRecords } },
      {
        onSuccess: () => {
          toast({ title: "تم حفظ جميع السجلات بنجاح" });
          queryClient.invalidateQueries({ queryKey: getGetSessionRecordsQueryKey(id) });
          setDirty(false);
        },
        onError: () => toast({ title: "خطأ في الحفظ", variant: "destructive" }),
      }
    );
  };

  if (sessionLoading || recordsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) return <div className="text-center py-16 text-muted-foreground">الحصة غير موجودة</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sessions")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{session.circle_name} — تفاصيل الحصة</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {session.date} | {session.teacher_name ?? "بدون معلم"} | {session.status}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={!dirty || saveRecords.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveRecords.isPending ? "جارٍ الحفظ..." : "حفظ الكل"}
        </Button>
      </div>

      <div className="space-y-4">
        {localRecords.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              لا يوجد طلاب مسجلون في هذه الحصة
            </CardContent>
          </Card>
        )}

        {localRecords.map((record, idx) => (
          <Card key={record.id} className={`border-r-4 ${record.is_present ? "border-r-green-500" : "border-r-red-400"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{record.student_name}</CardTitle>
                <div className="flex items-center gap-2">
                  {[
                    { label: "حاضر", value: true, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
                    { label: "غائب", value: false, icon: XCircle, color: "text-red-600 bg-red-50" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <button
                      key={label}
                      onClick={() => updateRecord(idx, "is_present", value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        record.is_present === value
                          ? `${color} ring-2 ring-offset-1 ${value ? "ring-green-400" : "ring-red-400"}`
                          : "text-muted-foreground bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">مقدار الحفظ اليوم</label>
                  <Input
                    value={record.memorization_amount}
                    onChange={e => updateRecord(idx, "memorization_amount", e.target.value)}
                    placeholder="مثال: من آية 1 إلى 10"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">مقدار المراجعة اليوم</label>
                  <Input
                    value={record.revision_amount}
                    onChange={e => updateRecord(idx, "revision_amount", e.target.value)}
                    placeholder="مثال: سورة الفاتحة"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">واجب الحفظ للحصة القادمة</label>
                  <Input
                    value={record.next_memorization}
                    onChange={e => updateRecord(idx, "next_memorization", e.target.value)}
                    placeholder="مثال: من آية 11 إلى 20"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">واجب المراجعة للحصة القادمة</label>
                  <Input
                    value={record.next_revision}
                    onChange={e => updateRecord(idx, "next_revision", e.target.value)}
                    placeholder="مثال: سورة البقرة"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">الدرجة (0-10)</label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={record.grade}
                    onChange={e => updateRecord(idx, "grade", Number(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">التقييم</label>
                  <Select
                    value={record.performance_label}
                    onValueChange={val => updateRecord(idx, "performance_label", val)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="اختر التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFORMANCE_LABELS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">ملاحظات</label>
                  <Input
                    value={record.notes}
                    onChange={e => updateRecord(idx, "notes", e.target.value)}
                    placeholder="أي ملاحظات إضافية"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {localRecords.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={!dirty || saveRecords.isPending}
            size="lg"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saveRecords.isPending ? "جارٍ الحفظ..." : "حفظ جميع السجلات"}
          </Button>
        </div>
      )}
    </div>
  );
}
