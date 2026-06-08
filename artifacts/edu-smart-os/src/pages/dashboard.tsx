import { useState } from "react";
import { Link } from "wouter";
import { useDashboardStats, useLeaderboard, useSessions, useNotifications } from "@/lib/store";
import { seedDemoData, clearAllData } from "@/lib/seed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Users, GraduationCap, CircleDot, CalendarDays,
  TrendingUp, TrendingDown, Bell, Trophy,
  CheckCircle, XCircle, Wallet, Star,
  BookOpen, ArrowLeft, Calendar, BarChart3,
  Medal, AlertTriangle, Database, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

export default function Dashboard() {
  const { stats, loading: isLoading } = useDashboardStats();
  const { leaderboard } = useLeaderboard();
  const { sessions } = useSessions();
  const { notifications } = useNotifications();
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedData = async (reset = false) => {
    setSeeding(true);
    try {
      if (reset) await clearAllData();
      const result = await seedDemoData();
      if (result.skipped && !reset) {
        toast({ title: "البيانات موجودة", description: "استخدم زر «إعادة التهيئة» لمسح البيانات وإعادة البذر من جديد." });
      } else {
        toast({ title: `✅ تم تحميل البيانات التجريبية`, description: "25 طالب · 4 معلمين · 5 حلقات · 3 مسابقات · دورتان + حصص وفواتير وإشعارات" });
      }
    } catch (err: any) {
      toast({ title: "خطأ في تحميل البيانات", description: err?.message ?? "فشلت العملية", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const unreadNotifs = notifications?.filter(n => !n.is_read).length ?? 0;
  const topStudents = leaderboard?.slice(0, 5) ?? [];
  const recentSessions = sessions ? [...sessions].reverse().slice(0, 5) : [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const financialData = [
    { name: "الإيرادات", value: stats.total_revenue ?? 0, fill: "#10b981" },
    { name: "المصروفات", value: stats.total_expenses ?? 0, fill: "#ef4444" },
    { name: "صافي الربح", value: Math.max(stats.profit ?? 0, 0), fill: "#f59e0b" },
  ];

  const attendancePie = [
    { name: "حاضر", value: stats.present_today ?? 0, fill: "#10b981" },
    { name: "غائب", value: stats.absent_today ?? 0, fill: "#ef4444" },
  ];

  const statCards = [
    { title: "إجمالي الطلاب", value: stats.total_students, icon: Users, color: "text-primary", bg: "bg-primary/10", link: "/students" },
    { title: "إجمالي المعلمين", value: stats.total_teachers, icon: GraduationCap, color: "text-emerald-700", bg: "bg-emerald-700/10", link: "/teachers" },
    { title: "الحلقات النشطة", value: stats.total_circles, icon: CircleDot, color: "text-accent", bg: "bg-accent/10", link: "/circles" },
    { title: "إجمالي الحصص", value: stats.total_sessions, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-600/10", link: "/sessions" },
    { title: "الدورات", value: stats.total_courses ?? 0, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-600/10", link: "/courses" },
    { title: "المسابقات", value: stats.total_competitions ?? 0, icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10", link: "/competitions" },
    { title: "حضور اليوم", value: stats.present_today ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-600/10", link: "/sessions" },
    { title: "غياب اليوم", value: stats.absent_today ?? 0, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", link: "/sessions" },
    { title: "إجمالي الإيرادات", value: `${(stats.total_revenue ?? 0).toLocaleString()} ج.م`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", link: "/finance" },
    { title: "صافي الربح", value: `${(stats.profit ?? 0).toLocaleString()} ج.م`, icon: Wallet, color: (stats.profit ?? 0) >= 0 ? "text-accent" : "text-destructive", bg: (stats.profit ?? 0) >= 0 ? "bg-accent/10" : "bg-destructive/10", link: "/finance" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">مكتب الفرقان لتحفيظ القرآن الكريم — نظرة عامة شاملة</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.total_students === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeedData(false)}
              disabled={seeding}
              className="border-primary/40 text-primary hover:bg-primary/5 font-semibold"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Database className="h-4 w-4 ml-1" />}
              {seeding ? "جاري التحميل..." : "تحميل بيانات تجريبية"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeedData(true)}
              disabled={seeding}
              className="border-amber-400/60 text-amber-700 hover:bg-amber-50 text-xs"
            >
              {seeding ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Database className="h-3 w-3 ml-1" />}
              {seeding ? "جاري إعادة التهيئة..." : "إعادة تهيئة البيانات"}
            </Button>
          )}
          {unreadNotifs > 0 && (
            <Link href="/notifications">
              <Button variant="outline" size="sm" className="relative text-primary border-primary">
                <Bell className="h-4 w-4 ml-1" />
                <span>{unreadNotifs} إشعار</span>
                <span className="absolute -top-1 -left-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Smart Alerts */}
      {((stats.unpaid_invoices ?? 0) > 0 || (stats.pending_salaries ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats.unpaid_invoices ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800 flex-1">
                <strong>{stats.unpaid_invoices}</strong> فاتورة غير مدفوعة تحتاج متابعة
              </div>
              <Link href="/finance">
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-400 hover:bg-amber-100 text-xs flex-shrink-0">عرض</Button>
              </Link>
            </div>
          )}
          {(stats.pending_salaries ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-300 bg-blue-50">
              <GraduationCap className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800 flex-1">
                رواتب معلقة بإجمالي <strong>{(stats.pending_salaries ?? 0).toLocaleString()} ج.م</strong>
              </div>
              <Link href="/finance">
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-400 hover:bg-blue-100 text-xs flex-shrink-0">صرف</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <Link key={i} href={stat.link}>
            <Card className="border-gold-500/20 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.title}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-gold-500/20 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-secondary flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              الملخص المالي
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", direction: "rtl" }}
                  formatter={(val: number) => [`${val.toLocaleString()} ج.م`, ""]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {financialData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gold-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-secondary flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              حضور اليوم
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] flex flex-col items-center justify-center">
            {(stats.present_today ?? 0) + (stats.absent_today ?? 0) === 0 ? (
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد حصص اليوم</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendancePie} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {attendancePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Legend formatter={val => <span className="text-sm text-secondary">{val}</span>} />
                  <Tooltip formatter={(val: number) => [`${val} طالب`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Students */}
        <Card className="border-gold-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" />
                أفضل الطلاب
              </CardTitle>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">عرض الكل</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topStudents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">لا توجد بيانات</div>
            ) : (
              topStudents.map((entry, idx) => (
                <div key={entry.student_id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-gray-100 text-gray-600" :
                    idx === 2 ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-secondary truncate">{entry.student_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{entry.circle_name}</div>
                  </div>
                  <div className="text-sm font-bold text-primary flex-shrink-0">{entry.points}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="border-gold-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                أحدث الحصص
              </CardTitle>
              <Link href="/sessions">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">عرض الكل</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">لا توجد حصص مسجلة</div>
            ) : (
              recentSessions.map(session => (
                <div key={session.id} className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-secondary truncate">{session.circle_name}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{new Date(session.date).toLocaleDateString("ar-EG")}</div>
                  </div>
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${session.status === "مكتملة" ? "text-green-600 border-green-400 bg-green-50" : "text-amber-600 border-amber-400"}`}>
                    {session.present_count ?? 0}/{session.student_count ?? 0}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-gold-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" />
                أحدث الإشعارات
                {unreadNotifs > 0 && (
                  <Badge className="bg-destructive text-white text-xs px-1.5 py-0 h-4">{unreadNotifs}</Badge>
                )}
              </CardTitle>
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">عرض الكل</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recent_notifications?.length ? (
              stats.recent_notifications.slice(0, 5).map((notif: any) => (
                <div key={notif.id} className={`p-2.5 rounded-lg border text-sm ${notif.is_read ? "bg-muted/30 border-muted" : "bg-primary/5 border-primary/20"}`}>
                  <div className="font-medium text-secondary truncate">{notif.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">لا توجد إشعارات</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="border-gold-500/30 bg-gradient-to-l from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-accent/20 p-3 rounded-xl flex-shrink-0">
              <Star className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-secondary mb-3 text-lg">ملخص الأداء الشامل</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/60 rounded-lg p-3 border border-primary/10">
                  <div className="text-xs text-muted-foreground mb-1">نسبة حضور اليوم</div>
                  <div className="text-xl font-bold text-primary">
                    {stats.present_today != null && stats.absent_today != null && (stats.present_today + stats.absent_today) > 0
                      ? Math.round((stats.present_today / (stats.present_today + stats.absent_today)) * 100)
                      : "—"}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${stats.present_today != null && stats.absent_today != null && (stats.present_today + stats.absent_today) > 0 ? Math.round((stats.present_today / (stats.present_today + stats.absent_today)) * 100) : 0}%` }} />
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-accent/10">
                  <div className="text-xs text-muted-foreground mb-1">متوسط الطلاب/حلقة</div>
                  <div className="text-xl font-bold text-accent">
                    {stats.total_circles && stats.total_circles > 0 ? Math.round((stats.total_students ?? 0) / stats.total_circles) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">طالب / حلقة</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-violet-200">
                  <div className="text-xs text-muted-foreground mb-1">الدورات النشطة</div>
                  <div className="text-xl font-bold text-violet-600">{stats.total_courses ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">دورة تدريبية</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-muted-foreground mb-1">إجمالي الإيرادات</div>
                  <div className="text-xl font-bold text-green-600">{(stats.total_revenue ?? 0).toLocaleString()} ج.م</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
