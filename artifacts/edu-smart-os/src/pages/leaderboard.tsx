import { useState } from "react";
import { useMonthlyLeaderboard, useTeacherLeaderboard, useAvailableMonths } from "@/lib/store";
import { getCurrentMonth, getMonthLabel } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Star, Medal, Crown, Users, GraduationCap, CalendarDays,
  TrendingUp, Target, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MEDAL_BG = [
  "bg-yellow-500/10 border-yellow-500/30",
  "bg-slate-400/10 border-slate-400/30",
  "bg-amber-700/10 border-amber-700/30",
];
const MEDAL_COLOR = ["text-yellow-500", "text-slate-400", "text-amber-700"];
const MEDAL_ICONS = [Crown, Medal, Award];

function PodiumCard({ entry, rank }: { entry: any; rank: number }) {
  const Icon = MEDAL_ICONS[rank] ?? Star;
  return (
    <div className={cn(
      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center",
      MEDAL_BG[rank] ?? "bg-muted/50 border-border",
      rank === 0 ? "scale-105 shadow-lg" : "",
    )}>
      <Icon className={cn("h-7 w-7", MEDAL_COLOR[rank] ?? "text-primary")} />
      <div>
        <div className="font-bold text-secondary text-sm leading-tight">
          {entry.student_name ?? entry.teacher_name}
        </div>
        {entry.circle_name && (
          <div className="text-xs text-muted-foreground mt-0.5">{entry.circle_name}</div>
        )}
      </div>
      <div className={cn("text-2xl font-black", MEDAL_COLOR[rank] ?? "text-primary")}>
        {entry.points}
      </div>
      <div className="text-xs text-muted-foreground">نقطة</div>
    </div>
  );
}

function StudentLeaderboard({ month }: { month: string }) {
  const { leaderboard, loading } = useMonthlyLeaderboard(month);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-lg font-medium">لا توجد بيانات لهذا الشهر</p>
        <p className="text-sm mt-1">سجّل الحصص والحضور لظهور ترتيب الطلاب</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {top3[1] && <PodiumCard entry={top3[1]} rank={1} />}
          {top3[0] && <PodiumCard entry={top3[0]} rank={0} />}
          {top3[2] ? <PodiumCard entry={top3[2]} rank={2} /> : <div />}
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-2">
          {(rest as any[]).map((entry, i) => (
            <div
              key={entry.student_id}
              className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                {i + 4}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-secondary text-sm truncate">{entry.student_name}</div>
                {entry.circle_name && (
                  <div className="text-xs text-muted-foreground">{entry.circle_name}</div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {entry.attendance_score}%
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {entry.memorization_score}%
                </span>
                <Badge variant="outline" className="text-primary border-primary/30 font-bold">
                  {entry.points} نقطة
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground text-center">
        معادلة النقاط: حضور × 10 + متوسط الدرجات × 0.5 + التقييم × 5
      </div>
    </div>
  );
}

function TeacherLeaderboard({ month }: { month: string }) {
  const { leaderboard, loading } = useTeacherLeaderboard(month);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-lg font-medium">لا توجد بيانات لهذا الشهر</p>
        <p className="text-sm mt-1">سجّل الحصص والحضور لظهور ترتيب المعلمين</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(leaderboard as any[]).map((entry, idx) => {
        const Icon = idx === 0 ? Crown : idx === 1 ? Medal : idx === 2 ? Award : GraduationCap;
        const iconColor =
          idx === 0 ? "text-yellow-500" :
          idx === 1 ? "text-slate-400" :
          idx === 2 ? "text-amber-700" : "text-muted-foreground";
        return (
          <div
            key={entry.teacher_id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-colors",
              idx === 0
                ? "bg-yellow-500/5 border-yellow-500/20"
                : "bg-card border-border hover:border-primary/20",
            )}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-secondary">{entry.teacher_name}</div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {entry.student_count} طالب نشط
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  حضور {entry.attendance_rate}%
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  متوسط {entry.avg_grade} درجة
                </span>
                {entry.top_students > 0 && (
                  <span className="flex items-center gap-1 text-primary">
                    <Star className="h-3 w-3" />
                    {entry.top_students} متميز
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 font-bold shrink-0">
              {entry.points} نقطة
            </Badge>
          </div>
        );
      })}
      <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground text-center">
        نقاط المعلم = متوسط نقاط طلابه + (المتميزون × 5) + (نسبة الحضور × 0.3)
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { months, loading: monthsLoading } = useAvailableMonths();

  const monthOptions = months.length > 0 ? months : [getCurrentMonth()];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            لوحة الصدارة الشهرية
          </h1>
          <p className="text-muted-foreground mt-1">
            ترتيب الطلاب والمعلمين حسب الأداء — تبدأ من الصفر مع كل شهر جديد
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={month} onValueChange={setMonth} disabled={monthsLoading}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="اختر الشهر" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m} value={m}>
                  {getMonthLabel(m)}{m === getCurrentMonth() ? " (الحالي)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-secondary flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {getMonthLabel(month)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students">
            <TabsList className="mb-4 bg-muted/60">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                طلاب الشهر
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                معلمو الشهر
              </TabsTrigger>
            </TabsList>
            <TabsContent value="students">
              <StudentLeaderboard month={month} />
            </TabsContent>
            <TabsContent value="teachers">
              <TeacherLeaderboard month={month} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
