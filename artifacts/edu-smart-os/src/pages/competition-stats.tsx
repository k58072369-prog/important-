import { useCompetitionStatsGlobal } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, Users, Layers, ClipboardList, Star, TrendingUp, Award,
  CheckCircle, XCircle, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

export default function CompetitionStats() {
  const { stats, loading } = useCompetitionStatsGlobal();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">إحصائيات المسابقات</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لجميع المسابقات</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const attendancePieData = stats.totalParticipants > 0 ? [
    { name: "ناجح", value: stats.passing },
    { name: "غير ناجح", value: stats.totalResults - stats.passing },
    { name: "لم يُقيَّم", value: stats.totalParticipants - stats.totalResults },
  ].filter(d => d.value > 0) : [];

  const barData = stats.byComp.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "..." : c.name,
    مشاركون: c.participants,
    ناجحون: c.passing,
    "متوسط الدرجة": c.avgScore,
  }));

  const lineData = stats.byComp.map((c, i) => ({
    name: `م${i + 1}`,
    fullName: c.name,
    "متوسط الدرجة": c.avgScore,
    مشاركون: c.participants,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">لوحة إحصائيات المسابقات</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لجميع المسابقات والمستويات والنتائج</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-5 pb-4 text-center">
            <Trophy className="h-7 w-7 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold text-primary">{stats.totalCompetitions}</div>
            <div className="text-sm text-muted-foreground mt-1">مسابقة</div>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="pt-5 pb-4 text-center">
            <Layers className="h-7 w-7 mx-auto mb-2 text-accent" />
            <div className="text-3xl font-bold text-accent">{stats.totalLevels}</div>
            <div className="text-sm text-muted-foreground mt-1">مستوى</div>
          </CardContent>
        </Card>
        <Card className="border-blue-300/50 bg-gradient-to-br from-blue-50 to-transparent">
          <CardContent className="pt-5 pb-4 text-center">
            <Users className="h-7 w-7 mx-auto mb-2 text-blue-600" />
            <div className="text-3xl font-bold text-blue-600">{stats.totalParticipants}</div>
            <div className="text-sm text-muted-foreground mt-1">مشارك</div>
          </CardContent>
        </Card>
        <Card className="border-green-300/50 bg-gradient-to-br from-green-50 to-transparent">
          <CardContent className="pt-5 pb-4 text-center">
            <CheckCircle className="h-7 w-7 mx-auto mb-2 text-green-600" />
            <div className="text-3xl font-bold text-green-600">{stats.successPct}%</div>
            <div className="text-sm text-muted-foreground mt-1">نسبة النجاح</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary/60" />
              <div>
                <div className="text-2xl font-bold text-secondary">{stats.totalResults}</div>
                <div className="text-sm text-muted-foreground">إجمالي التقييمات</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-500/60" />
              <div>
                <div className="text-2xl font-bold text-secondary">{stats.avgScore}</div>
                <div className="text-sm text-muted-foreground">متوسط الدرجات العام</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-green-500/60" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.passing}</div>
                <div className="text-sm text-muted-foreground">ناجح</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              المشاركون والناجحون لكل مسابقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات بعد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, direction: "rtl" }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, direction: "rtl" }} />
                  <Bar dataKey="مشاركون" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ناجحون" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              توزيع النتائج الإجمالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendancePieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات بعد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {attendancePieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line chart - avg scores */}
      {lineData.length > 1 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              تطور متوسط الدرجات عبر المسابقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, direction: "rtl" }}
                  labelFormatter={(label) => {
                    const d = lineData.find(d => d.name === label);
                    return d?.fullName ?? label;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="متوسط الدرجة" stroke="#10b981" strokeWidth={2} dot={{ r: 5, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-competition breakdown */}
      {stats.byComp.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              تفصيل كل مسابقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-muted-foreground bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 rounded-tr-lg">المسابقة</th>
                    <th className="px-4 py-2">الحالة</th>
                    <th className="px-4 py-2">المستويات</th>
                    <th className="px-4 py-2">المشاركون</th>
                    <th className="px-4 py-2">الناجحون</th>
                    <th className="px-4 py-2">متوسط الدرجة</th>
                    <th className="px-4 py-2 rounded-tl-lg">نسبة النجاح</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byComp.map((c, i) => {
                    const successPct = c.participants > 0 ? Math.round((c.passing / Math.max(c.participants, 1)) * 100) : 0;
                    return (
                      <tr key={i} className="border-b border-muted/50 hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium text-secondary">{c.name}</td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className={`text-xs ${c.status === "جارية" ? "text-green-600 border-green-400" : c.status === "منتهية" ? "text-muted-foreground" : "text-amber-600 border-amber-400"}`}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-center">{c.levelCount}</td>
                        <td className="px-4 py-2 text-center font-semibold text-blue-600">{c.participants}</td>
                        <td className="px-4 py-2 text-center font-semibold text-green-600">{c.passing}</td>
                        <td className="px-4 py-2 text-center">
                          {c.avgScore > 0 ? (
                            <span className={`font-semibold ${c.avgScore >= 80 ? "text-green-600" : c.avgScore >= 60 ? "text-amber-600" : "text-destructive"}`}>
                              {c.avgScore}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {c.participants > 0 ? (
                            <span className={`font-semibold ${successPct >= 80 ? "text-green-600" : successPct >= 60 ? "text-amber-600" : "text-destructive"}`}>
                              {successPct}%
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top scorers */}
      {stats.topScorers.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              أعلى الدرجات في المسابقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topScorers.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-800" : i === 2 ? "bg-amber-700/60 text-white" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.competition}</div>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${s.score >= 80 ? "text-green-600" : s.score >= 60 ? "text-amber-600" : "text-destructive"}`}>
                    {s.score}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
