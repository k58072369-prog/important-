import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit, Users, CircleDot, CalendarDays, GraduationCap, Clock,
  CheckCircle, TrendingUp, Star, Award,
} from "lucide-react";
import { useCircleStats } from "@/lib/store";
import type { Circle } from "@/lib/store";

interface CircleDetailModalProps {
  open: boolean;
  onClose: () => void;
  circle?: Circle | null;
  onEdit?: () => void;
}

export function CircleDetailModal({ open, onClose, circle, onEdit }: CircleDetailModalProps) {
  const { stats, loading } = useCircleStats(open && circle ? circle.id : null);
  const [tab, setTab] = useState("info");

  if (!circle) return null;

  const statusColor = circle.status === "نشطة"
    ? "text-green-600 border-green-400 bg-green-50"
    : circle.status === "متوقفة"
    ? "text-amber-600 border-amber-400 bg-amber-50"
    : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-accent" />
            ملف الحلقة الشامل
          </DialogTitle>
        </DialogHeader>

        {/* Header card */}
        <div className="bg-gradient-to-l from-accent/10 to-primary/5 rounded-xl p-5 border border-accent/10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{circle.name}</h2>
              {circle.description && (
                <p className="text-muted-foreground text-sm mt-0.5">{circle.description}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${statusColor}`}>{circle.status}</Badge>
                {circle.teacher_name && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    <GraduationCap className="h-3 w-3 ml-1" />{circle.teacher_name}
                  </Badge>
                )}
                {circle.days && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 ml-1" />{circle.days}
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/60 rounded-lg p-2 border border-border/50 text-center min-w-[65px]">
                <div className="text-xl font-bold text-primary">{circle.student_count ?? 0}</div>
                <div className="text-xs text-muted-foreground">طالب</div>
              </div>
              {stats && !loading && (
                <div className="bg-white/60 rounded-lg p-2 border border-border/50 text-center min-w-[65px]">
                  <div className={`text-xl font-bold ${stats.attendancePct >= 80 ? "text-green-600" : stats.attendancePct >= 60 ? "text-amber-600" : "text-destructive"}`}>
                    {stats.attendancePct}%
                  </div>
                  <div className="text-xs text-muted-foreground">الحضور</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-primary">{stats.students.length}</div>
              <div className="text-xs text-muted-foreground">إجمالي الطلاب</div>
            </div>
            <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-accent">{stats.totalSessions}</div>
              <div className="text-xs text-muted-foreground">إجمالي الحصص</div>
            </div>
            <div className={`border rounded-lg p-3 text-center ${stats.attendancePct >= 80 ? "bg-green-50 border-green-200" : stats.attendancePct >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <div className={`text-xl font-bold ${stats.attendancePct >= 80 ? "text-green-600" : stats.attendancePct >= 60 ? "text-amber-600" : "text-destructive"}`}>
                {stats.attendancePct}%
              </div>
              <div className="text-xs text-muted-foreground">نسبة الحضور العامة</div>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="info" className="text-xs py-2">معلومات الحلقة</TabsTrigger>
            <TabsTrigger value="students" className="text-xs py-2">الطلاب</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs py-2">آخر الحصص</TabsTrigger>
          </TabsList>

          {/* معلومات الحلقة */}
          <TabsContent value="info" className="mt-4 space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
              {circle.teacher_name && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">المعلم المسؤول:</span>
                  <span className="font-medium">{circle.teacher_name}</span>
                </div>
              )}
              {circle.days && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">أيام الحلقة:</span>
                  <span className="font-medium">{circle.days}</span>
                </div>
              )}
              {circle.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">وقت الحلقة:</span>
                  <span className="font-medium">{circle.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">عدد الطلاب:</span>
                <span className="font-bold text-primary">{circle.student_count ?? 0}</span>
              </div>
            </div>

            {/* أفضل الطلاب */}
            {stats && stats.topStudents.length > 0 && (
              <div>
                <h4 className="font-semibold text-secondary text-sm mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  أفضل الطلاب التزاماً
                </h4>
                <div className="space-y-2">
                  {stats.topStudents.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between bg-muted/20 rounded-lg p-2.5 border border-border/40">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-800" : i === 2 ? "bg-amber-700/60 text-white" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-sm">{s.full_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${s.attendancePct >= 80 ? "text-green-600" : s.attendancePct >= 60 ? "text-amber-600" : "text-destructive"}`}>
                          {s.attendancePct}% حضور
                        </span>
                        {s.avgGrade > 0 && (
                          <span className="text-xs text-muted-foreground">{s.avgGrade} متوسط</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* الطلاب */}
          <TabsContent value="students" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats || stats.students.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا يوجد طلاب في هذه الحلقة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.students.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">{s.grade}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.level && <Badge variant="outline" className="text-xs">{s.level}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* آخر الحصص */}
          <TabsContent value="sessions" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats || stats.sessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد حصص مسجلة لهذه الحلقة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div>
                      <div className="font-medium text-sm" dir="ltr">{s.date}</div>
                      {s.day && <div className="text-xs text-muted-foreground">{s.day}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {s.present_count ?? 0} حاضر
                      </div>
                      <Badge variant="outline" className={`text-xs ${s.status === "مكتملة" ? "text-green-600 border-green-400" : "text-amber-600 border-amber-400"}`}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {stats.totalSessions > 5 && (
                  <p className="text-xs text-muted-foreground text-center">عرض آخر 5 حصص من إجمالي {stats.totalSessions}</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          {onEdit && (
            <Button onClick={onEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Edit className="h-4 w-4 ml-2" />
              تعديل بيانات الحلقة
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
