import { useGetAttendanceReport, useGetMemorizationReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const { data: attendance, isLoading: attLoading } = useGetAttendanceReport({});
  const { data: memorization, isLoading: memLoading } = useGetMemorizationReport({});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">التقارير</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تقرير الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            {attLoading ? <Skeleton className="h-40" /> : attendance ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">نسبة الحضور الكلية</div>
                  <div className="text-3xl font-bold">{attendance.overall_attendance_rate}%</div>
                </div>
                <div className="space-y-2">
                  {attendance.students?.slice(0, 5).map(s => (
                    <div key={s.student_id} className="flex justify-between items-center text-sm border-b pb-2">
                      <span>{s.student_name}</span>
                      <span className="font-medium">{s.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تقرير الحفظ</CardTitle>
          </CardHeader>
          <CardContent>
            {memLoading ? <Skeleton className="h-40" /> : memorization ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">إجمالي الطلاب المسجلين</div>
                  <div className="text-3xl font-bold">{memorization.total_students}</div>
                </div>
                <div className="space-y-2">
                  {memorization.students?.slice(0, 5).map(s => (
                    <div key={s.student_id} className="flex justify-between items-center text-sm border-b pb-2">
                      <span>{s.student_name}</span>
                      <span className="font-medium">{s.total_memorized}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
