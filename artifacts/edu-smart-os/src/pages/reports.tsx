import { useDashboardStats, useStudents, useLeaderboard } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Reports() {
  const { stats, loading } = useDashboardStats();
  const { students } = useStudents();
  const { leaderboard } = useLeaderboard();

  const absenteeStudents = leaderboard.filter(e => e.attendance_score < 60).slice(0, 5);
  const lowPerformers = leaderboard.filter(e => e.memorization_score < 60).slice(0, 5);
  const unpaidStudents = students.filter(s => s.payment_status === "غير مدفوع" || s.payment_status === "متأخر").slice(0, 5);

  const insights = [];
  if (stats) {
    const attendanceTotal = (stats.present_today ?? 0) + (stats.absent_today ?? 0);
    const attendancePct = attendanceTotal > 0 ? Math.round((stats.present_today ?? 0) / attendanceTotal * 100) : 0;
    if (attendancePct < 70) {
      insights.push({ type: "warning", severity: "high", title: "نسبة الحضور منخفضة", description: `نسبة الحضور الحالية ${attendancePct}% — ننصح بالتواصل مع أولياء الأمور لمتابعة الغياب.` });
    }
    if ((stats.profit ?? 0) < 0) {
      insights.push({ type: "warning", severity: "high", title: "المصروفات تتجاوز الإيرادات", description: `الربح الحالي سلبي (${stats.profit?.toLocaleString()} ج.م) — راجع بنود المصروفات.` });
    }
    if (unpaidStudents.length > 0) {
      insights.push({ type: "warning", severity: "medium", title: `${unpaidStudents.length} طالب لم يسدد رسومه`, description: "يوجد طلاب لم يسددوا اشتراكات هذا الشهر. ننصح بمتابعة أولياء أمورهم." });
    }
    if ((stats.total_students ?? 0) > 0 && (stats.total_circles ?? 0) > 0) {
      const avg = Math.round((stats.total_students ?? 0) / (stats.total_circles ?? 1));
      if (avg > 20) {
        insights.push({ type: "info", severity: "medium", title: "ازدحام في الحلقات", description: `متوسط الطلاب لكل حلقة ${avg} — قد يكون مفيداً فتح حلقات إضافية.` });
      }
    }
    if (attendancePct >= 80) {
      insights.push({ type: "positive", severity: "low", title: "نسبة حضور ممتازة", description: `الطلاب يحافظون على الحضور بنسبة ${attendancePct}% — استمر في التشجيع!` });
    }
  }

  if (insights.length === 0) {
    insights.push({ type: "positive", severity: "low", title: "ابدأ بتسجيل بيانات", description: "أضف الطلاب والحلقات والحصص لتبدأ في ظهور التحليلات والإحصائيات هنا." });
  }

  const recommendations = [
    "تحديث بيانات الحضور يومياً لحصول على تقارير دقيقة",
    "متابعة الطلاب المنخفضين في نقاط الحضور كل أسبوع",
    "إصدار الفواتير الشهرية في مطلع كل شهر",
    "مراجعة مستوى حفظ كل طالب من خلال سجل الحصص",
    "تحفيز الطلاب المتميزين باستخدام لوحة الصدارة",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary">التقارير والتحليلات</h1>
          <p className="text-muted-foreground mt-1">تحليل أداء المؤسسة ورؤى مستندة إلى البيانات الفعلية</p>
        </div>
        <BarChart3 className="h-10 w-10 text-primary opacity-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gold-500/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-secondary">
                <BarChart3 className="h-6 w-6 text-primary" />
                رؤى وتحليلات إحصائية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-xl border flex gap-4 items-start",
                      insight.severity === "high" ? "bg-destructive/5 border-destructive/20" :
                      insight.type === "positive" ? "bg-green-50 border-green-200" :
                      "bg-card border-border"
                    )}>
                      <div className="mt-1 shrink-0">
                        {insight.severity === "high" ? <AlertTriangle className="h-5 w-5 text-destructive" /> :
                         insight.type === "positive" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                         <Lightbulb className="h-5 w-5 text-accent" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-secondary">التوصيات الاستراتيجية</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-secondary">طلاب بحاجة إلى متابعة</CardTitle>
            </CardHeader>
            <CardContent>
              {absenteeStudents.length > 0 || lowPerformers.length > 0 ? (
                <div className="space-y-3">
                  {absenteeStudents.map((s, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="font-semibold text-sm text-secondary">{s.student_name}</div>
                      <div className="text-xs text-destructive mt-1">نسبة حضور: {s.attendance_score}%</div>
                    </div>
                  ))}
                  {lowPerformers.slice(0, 3 - absenteeStudents.length).map((s, idx) => (
                    <div key={`lp-${idx}`} className="p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="font-semibold text-sm text-secondary">{s.student_name}</div>
                      <div className="text-xs text-amber-600 mt-1">مستوى الحفظ منخفض</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">لا يوجد طلاب ضمن هذه الفئة حالياً</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gold-500/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg text-accent flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                تقارير جاهزة للطباعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button onClick={() => window.print()} className="w-full text-right p-3 rounded-lg bg-card border border-border hover:border-accent hover:text-accent transition-colors text-sm font-medium">
                طباعة هذه الصفحة
              </button>
              <button className="w-full text-right p-3 rounded-lg bg-card border border-border hover:border-accent hover:text-accent transition-colors text-sm font-medium">
                تقرير الحضور والغياب الشهري
              </button>
              <button className="w-full text-right p-3 rounded-lg bg-card border border-border hover:border-accent hover:text-accent transition-colors text-sm font-medium">
                الكشف المالي التفصيلي
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
