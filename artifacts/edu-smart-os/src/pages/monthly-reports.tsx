import { useState } from "react";
import { useStudents, useMonthlyReports, generateMonthlyReport } from "@/lib/store";
import { getCurrentMonth, getMonthLabel } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Loader2, Search, CalendarDays, CheckCircle2,
  AlertTriangle, TrendingUp, Users, BookOpen, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getPastMonths(count = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function AttendanceBadge({ pct }: { pct: number }) {
  const color = pct >= 85 ? "text-green-600 bg-green-50 border-green-200" :
    pct >= 65 ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-red-600 bg-red-50 border-red-200";
  const icon = pct >= 85 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold", color)}>
      {icon} {Math.round(pct)}%
    </span>
  );
}

function GradeBadge({ grade }: { grade: number }) {
  if (grade === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const color = grade >= 85 ? "text-green-600" : grade >= 70 ? "text-amber-600" : "text-red-600";
  return <span className={cn("text-sm font-bold", color)}>{grade}</span>;
}

function ReportCard({ report }: { report: any }) {
  return (
    <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">الحضور</div>
          <AttendanceBadge pct={report.attendance_pct} />
          <div className="text-xs text-muted-foreground mt-1">
            {report.present_count}/{report.sessions_count} حصة
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">متوسط الدرجات</div>
          <GradeBadge grade={report.avg_grade} />
          {report.avg_grade > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {report.min_grade} – {report.max_grade}
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">جلسات حفظ</div>
          <div className="text-sm font-bold text-secondary">{report.memorization_count}</div>
          <div className="text-xs text-muted-foreground mt-1">حصة</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">جلسات مراجعة</div>
          <div className="text-sm font-bold text-secondary">{report.revision_count}</div>
          <div className="text-xs text-muted-foreground mt-1">حصة</div>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-secondary leading-relaxed">{report.evaluation_text}</p>
        </div>
      </div>
      {(report.teacher_name || report.circle_name) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {report.teacher_name && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {report.teacher_name}
            </span>
          )}
          {report.circle_name && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {report.circle_name}
            </span>
          )}
          <span className="flex items-center gap-1 mr-auto">
            <CalendarDays className="h-3 w-3" />
            صدر: {new Date(report.created_at).toLocaleDateString("ar-EG")}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MonthlyReports() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [month, setMonth] = useState(getCurrentMonth);
  const [generating, setGenerating] = useState(false);
  const { students, loading: studentsLoading } = useStudents();
  const { reports, loading: reportsLoading } = useMonthlyReports(selectedStudent ?? undefined);
  const { toast } = useToast();

  const pastMonths = getPastMonths(12);

  const filteredStudents = students.filter(s =>
    !search || s.full_name.includes(search),
  );

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const studentReport = reports.find(r => r.month === month);

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      await generateMonthlyReport(selectedStudent, month);
      toast({ title: "تم إنشاء التقرير", description: `تقرير ${getMonthLabel(month)} جاهز` });
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message ?? "فشل إنشاء التقرير", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          التقارير الشهرية للطلاب
        </h1>
        <p className="text-muted-foreground mt-1">تقارير تفصيلية لأداء كل طالب شهرياً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border lg:h-fit">
          <CardHeader>
            <CardTitle className="text-base text-secondary">اختر الطالب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9"
                dir="rtl"
              />
            </div>
            {studentsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا يوجد طلاب</p>
                ) : (
                  filteredStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudent(s.id)}
                      className={cn(
                        "w-full text-right px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedStudent === s.id
                          ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                          : "hover:bg-muted text-secondary",
                      )}
                    >
                      {s.full_name}
                      {s.circle_name && (
                        <span className="block text-xs text-muted-foreground font-normal">{s.circle_name}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!selectedStudent ? (
            <Card className="border-border">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">اختر طالباً من القائمة</p>
                <p className="text-sm mt-1">لعرض وإنشاء التقارير الشهرية</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-lg text-secondary">
                        {selectedStudentData?.full_name}
                      </CardTitle>
                      {selectedStudentData?.circle_name && (
                        <p className="text-sm text-muted-foreground mt-0.5">{selectedStudentData.circle_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-44 bg-card border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pastMonths.map(m => (
                            <SelectItem key={m} value={m}>
                              {getMonthLabel(m)}{m === getCurrentMonth() ? " (الحالي)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : studentReport ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          تقرير {getMonthLabel(month)} متوفر
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerate}
                          disabled={generating}
                          className="text-xs"
                        >
                          {generating ? (
                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 ml-1" />
                          )}
                          تحديث التقرير
                        </Button>
                      </div>
                      <ReportCard report={studentReport} />
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
                      <div>
                        <p className="font-medium text-secondary">لا يوجد تقرير لـ {getMonthLabel(month)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          انقر على الزر أدناه لإنشاء تقرير تلقائي بناءً على بيانات الحصص
                        </p>
                      </div>
                      <Button onClick={handleGenerate} disabled={generating} className="mx-auto">
                        {generating ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <TrendingUp className="h-4 w-4 ml-2" />
                        )}
                        إنشاء التقرير الشهري
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {reports.length > 0 && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base text-secondary">سجل التقارير السابقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reports.map((r: any) => (
                        <button
                          key={r.id}
                          onClick={() => setMonth(r.month)}
                          className={cn(
                            "w-full text-right p-3 rounded-lg border text-sm transition-colors",
                            r.month === month
                              ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                              : "bg-card border-border hover:border-primary/20 text-secondary",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{r.month_label}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <AttendanceBadge pct={r.attendance_pct} />
                              {r.avg_grade > 0 && <span>متوسط {r.avg_grade}</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
