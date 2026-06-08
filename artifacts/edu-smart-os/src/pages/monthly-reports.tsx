import { useState } from "react";
import { useStudents, useMonthlyReports, generateMonthlyReport, generateAllMonthlyReports } from "@/lib/store";
import { getCurrentMonth, getMonthLabel } from "@/lib/db";
import { downloadHTML, printPDF, downloadSingleHTML, printSinglePDF } from "@/lib/report-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Loader2, Search, CalendarDays, CheckCircle2, AlertTriangle,
  TrendingUp, Users, BookOpen, RefreshCw, Download, Printer,
  BarChart3, Star, Award, Hash, Phone, GraduationCap, Globe,
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

function StatCard({ label, value, sub, color = "text-primary" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-bold", color)}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  if (!count) return null;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-14 text-left shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2">
        <div className={cn("h-2 rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-secondary w-6 text-center shrink-0">{count}</span>
    </div>
  );
}

function ReportCard({ report }: { report: any }) {
  const totalRatings = (report.rating_excellent ?? 0) + (report.rating_very_good ?? 0) + (report.rating_good ?? 0) + (report.rating_acceptable ?? 0) + (report.rating_poor ?? 0);

  return (
    <div className="space-y-4">
      {/* Student code + meta */}
      {(report.student_code || report.guardian_phone || report.grade) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {report.student_code && (
            <Badge className="bg-emerald-900 text-white hover:bg-emerald-900 font-mono text-xs">
              <Hash className="h-3 w-3 ml-1" />{report.student_code}
            </Badge>
          )}
          {report.grade && (
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="h-3 w-3 ml-1" />{report.grade}
            </Badge>
          )}
          {report.guardian_phone && (
            <Badge variant="outline" className="text-xs">
              <Phone className="h-3 w-3 ml-1" />{report.guardian_phone}
            </Badge>
          )}
          {report.teacher_name && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 ml-1" />{report.teacher_name}
            </Badge>
          )}
          {report.circle_name && (
            <Badge variant="outline" className="text-xs">
              <BookOpen className="h-3 w-3 ml-1" />{report.circle_name}
            </Badge>
          )}
        </div>
      )}

      {/* Attendance + Grades */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="إجمالي الحصص" value={report.sessions_count} color="text-blue-600" />
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <div className="text-xs text-muted-foreground mb-1">الحضور</div>
          <AttendanceBadge pct={report.attendance_pct} />
          <div className="text-xs text-muted-foreground mt-1">
            {report.present_count}/{report.sessions_count} حصة
          </div>
        </div>
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <div className="text-xs text-muted-foreground mb-1">الغياب</div>
          <div className="text-lg font-bold text-red-500">{report.absent_count}</div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {(report.late_count ?? 0) > 0 && <div>تأخر: {report.late_count}</div>}
            {(report.excused_count ?? 0) > 0 && <div>بعذر: {report.excused_count}</div>}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <div className="text-xs text-muted-foreground mb-1">متوسط الدرجات</div>
          <GradeBadge grade={report.avg_grade} />
          {report.avg_grade > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {report.min_grade} – {report.max_grade}
            </div>
          )}
        </div>
      </div>

      {/* Memorization + Revision */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
          <div className="text-xs text-purple-600 font-semibold mb-1 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> الحفظ
          </div>
          <div className="text-xl font-bold text-purple-700">{report.memorization_count} حصة</div>
          {report.last_memorization && (
            <div className="text-xs text-purple-500 mt-1">آخر موضع: {report.last_memorization}</div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-100">
          <div className="text-xs text-cyan-600 font-semibold mb-1 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> المراجعة
          </div>
          <div className="text-xl font-bold text-cyan-700">{report.revision_count} حصة</div>
          {report.last_revision && (
            <div className="text-xs text-cyan-500 mt-1">آخر موضع: {report.last_revision}</div>
          )}
        </div>
      </div>

      {/* Ratings breakdown */}
      {totalRatings > 0 && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <div className="text-xs font-semibold text-secondary mb-2 flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500" /> توزيع التقييمات ({totalRatings} جلسة)
          </div>
          <div className="space-y-1.5">
            <RatingBar label="ممتاز" count={report.rating_excellent ?? 0} total={totalRatings} color="bg-green-500" />
            <RatingBar label="جيد جداً" count={report.rating_very_good ?? 0} total={totalRatings} color="bg-emerald-400" />
            <RatingBar label="جيد" count={report.rating_good ?? 0} total={totalRatings} color="bg-blue-500" />
            <RatingBar label="مقبول" count={report.rating_acceptable ?? 0} total={totalRatings} color="bg-amber-500" />
            <RatingBar label="ضعيف" count={report.rating_poor ?? 0} total={totalRatings} color="bg-red-500" />
          </div>
        </div>
      )}

      {/* Evaluation text */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-secondary leading-relaxed">{report.evaluation_text}</p>
        </div>
      </div>

      {/* Issued date */}
      <div className="text-xs text-muted-foreground text-left">
        <CalendarDays className="h-3 w-3 inline ml-1" />
        صدر: {new Date(report.created_at).toLocaleDateString("ar-EG")}
      </div>
    </div>
  );
}

export default function MonthlyReports() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [month, setMonth] = useState(getCurrentMonth);
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [exportingHTML, setExportingHTML] = useState(false);
  const { students, loading: studentsLoading } = useStudents();
  const { reports, loading: reportsLoading } = useMonthlyReports(selectedStudent ?? undefined);
  const { reports: allReports } = useMonthlyReports();
  const { toast } = useToast();

  const pastMonths = getPastMonths(12);

  const filteredStudents = students.filter(s =>
    !search ||
    s.full_name.includes(search) ||
    (s.student_code && s.student_code.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const studentReport = reports.find(r => r.month === month);
  const monthReports = allReports.filter(r => r.month === month);

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      await generateMonthlyReport(selectedStudent, month);
      toast({ title: "✅ تم إنشاء التقرير", description: `تقرير ${getMonthLabel(month)} جاهز` });
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message ?? "فشل إنشاء التقرير", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      const count = await generateAllMonthlyReports(month);
      toast({ title: `✅ تم إنشاء ${count} تقرير`, description: `تقارير ${getMonthLabel(month)} لجميع الطلاب` });
    } catch {
      toast({ title: "خطأ في إنشاء التقارير", variant: "destructive" });
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleExportHTML = () => {
    if (monthReports.length === 0) {
      toast({ title: "لا توجد تقارير", description: "أنشئ التقارير أولاً ثم صدّرها", variant: "destructive" });
      return;
    }
    setExportingHTML(true);
    try {
      downloadHTML(monthReports, getMonthLabel(month), month);
      toast({ title: "✅ تم تحميل ملف HTML", description: `${monthReports.length} تقرير طالب` });
    } finally {
      setExportingHTML(false);
    }
  };

  const handlePrintPDF = () => {
    if (monthReports.length === 0) {
      toast({ title: "لا توجد تقارير", description: "أنشئ التقارير أولاً", variant: "destructive" });
      return;
    }
    printPDF(monthReports, getMonthLabel(month), month);
  };

  const handleSingleHTML = () => {
    if (!studentReport) return;
    downloadSingleHTML(studentReport);
    toast({ title: "✅ تم تحميل تقرير الطالب بصيغة HTML" });
  };

  const handleSinglePDF = () => {
    if (!studentReport) return;
    printSinglePDF(studentReport);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            التقارير الشهرية للطلاب
          </h1>
          <p className="text-muted-foreground mt-1">تقارير تفصيلية لأداء كل طالب شهرياً — كود الطالب، الحضور، الحفظ، التقييمات</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-44 bg-card border-border">
              <CalendarDays className="h-4 w-4 ml-2 text-muted-foreground" />
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

      {/* Bulk actions bar */}
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <span className="font-semibold text-secondary">تقارير {getMonthLabel(month)}</span>
                <span className="text-sm text-muted-foreground mr-2">
                  ({monthReports.length}/{students.length} طالب تمت معالجته)
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateAll}
                disabled={generatingAll}
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                {generatingAll ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
                إنشاء لجميع الطلاب ({students.length})
              </Button>
              <Button
                size="sm"
                onClick={handleExportHTML}
                disabled={exportingHTML || monthReports.length === 0}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {exportingHTML ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Globe className="h-4 w-4 ml-2" />}
                تحميل HTML
              </Button>
              <Button
                size="sm"
                onClick={handlePrintPDF}
                disabled={monthReports.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة / PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student list */}
        <Card className="border-border lg:h-fit">
          <CardHeader>
            <CardTitle className="text-base text-secondary">اختر الطالب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الكود..."
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
              <div className="max-h-[480px] overflow-y-auto space-y-1">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا يوجد طلاب</p>
                ) : (
                  filteredStudents.map(s => {
                    const hasReport = allReports.some(r => r.student_id === s.id && r.month === month);
                    return (
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
                        <div className="flex items-center justify-between">
                          <span>{s.full_name}</span>
                          {hasReport && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {s.student_code && (
                            <span className="text-xs font-mono text-emerald-600">{s.student_code}</span>
                          )}
                          {s.circle_name && (
                            <span className="text-xs text-muted-foreground font-normal">{s.circle_name}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedStudent ? (
            <Card className="border-border">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">اختر طالباً من القائمة</p>
                <p className="text-sm mt-1">لعرض وإنشاء التقارير الشهرية التفصيلية</p>
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
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {selectedStudentData?.student_code && (
                          <Badge className="bg-emerald-900 text-white hover:bg-emerald-900 font-mono text-xs">
                            <Hash className="h-3 w-3 ml-1" />{selectedStudentData.student_code}
                          </Badge>
                        )}
                        {selectedStudentData?.circle_name && (
                          <span className="text-sm text-muted-foreground">{selectedStudentData.circle_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {studentReport && (
                        <>
                          <Button variant="outline" size="sm" onClick={handleSingleHTML} className="text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                            <Globe className="h-3 w-3 ml-1" /> HTML
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleSinglePDF} className="text-xs border-red-300 text-red-600 hover:bg-red-50">
                            <Printer className="h-3 w-3 ml-1" /> PDF
                          </Button>
                        </>
                      )}
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
                        {studentReport ? "تحديث" : "إنشاء"} التقرير
                      </Button>
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          تقرير {getMonthLabel(month)} متوفر
                        </Badge>
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
