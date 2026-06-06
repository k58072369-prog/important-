import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit, Phone, GraduationCap, Users, CircleDot, CalendarDays,
  Banknote, TrendingUp, BarChart3, CheckCircle, Star,
} from "lucide-react";
import { useTeacherStats } from "@/lib/store";
import type { Teacher } from "@/lib/store";

interface TeacherDetailModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  onEdit?: () => void;
}

export function TeacherDetailModal({ open, onClose, teacher, onEdit }: TeacherDetailModalProps) {
  const { stats, loading } = useTeacherStats(open && teacher ? teacher.id : null);
  const [tab, setTab] = useState("profile");

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            ملف المعلم الشامل
          </DialogTitle>
        </DialogHeader>

        {/* Header card */}
        <div className="bg-gradient-to-l from-primary/10 to-accent/5 rounded-xl p-5 border border-primary/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{teacher.full_name}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span dir="ltr">{teacher.phone}</span>
              </div>
              {teacher.experience && (
                <p className="text-xs text-muted-foreground mt-1">{teacher.experience}</p>
              )}
            </div>
            {teacher.salary && (
              <div className="bg-white/60 rounded-xl p-3 text-center border border-border/50">
                <div className="text-xl font-bold text-primary">{teacher.salary}</div>
                <div className="text-xs text-muted-foreground">الراتب الأساسي (ج.م)</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-primary">{stats.students.length}</div>
              <div className="text-xs text-muted-foreground">طلاب</div>
            </div>
            <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-accent">{stats.circles.length}</div>
              <div className="text-xs text-muted-foreground">حلقات</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-600">{stats.sessions.length}</div>
              <div className="text-xs text-green-700">حصص</div>
            </div>
            <div className={`border rounded-lg p-3 text-center ${stats.attendancePct >= 80 ? "bg-green-50 border-green-200" : stats.attendancePct >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <div className={`text-xl font-bold ${stats.attendancePct >= 80 ? "text-green-600" : stats.attendancePct >= 60 ? "text-amber-600" : "text-destructive"}`}>{stats.attendancePct}%</div>
              <div className="text-xs text-muted-foreground">معدل الحضور</div>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="text-xs py-2">البيانات</TabsTrigger>
            <TabsTrigger value="students" className="text-xs py-2">الطلاب</TabsTrigger>
            <TabsTrigger value="circles" className="text-xs py-2">الحلقات</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs py-2">الحصص والرواتب</TabsTrigger>
          </TabsList>

          {/* تبويب البيانات */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4 text-sm">
              {teacher.phone && (
                <div className="flex items-center gap-2 col-span-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">الهاتف:</span>
                  <span dir="ltr">{teacher.phone}</span>
                </div>
              )}
              {teacher.email && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">البريد الإلكتروني: </span>
                  <span dir="ltr">{teacher.email}</span>
                </div>
              )}
              {teacher.hire_date && (
                <div>
                  <span className="text-muted-foreground">تاريخ التعيين: </span>
                  <span dir="ltr">{teacher.hire_date}</span>
                </div>
              )}
              {teacher.salary && (
                <div>
                  <span className="text-muted-foreground">الراتب: </span>
                  <span className="font-semibold text-primary">{teacher.salary} ج.م</span>
                </div>
              )}
            </div>
            {teacher.experience && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm">
                <span className="font-semibold text-primary">الخبرة والتخصص: </span>
                <span>{teacher.experience}</span>
              </div>
            )}
            {teacher.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <span className="font-semibold">ملاحظات: </span>{teacher.notes}
              </div>
            )}
            {stats && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1">متوسط درجات الطلاب</div>
                  <div className="text-xl font-bold text-secondary">{stats.avgGrade || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1">معدل الحضور</div>
                  <div className={`text-xl font-bold ${stats.attendancePct >= 80 ? "text-green-600" : "text-amber-600"}`}>{stats.attendancePct}%</div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* تبويب الطلاب */}
          <TabsContent value="students" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats || stats.students.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا يوجد طلاب مرتبطون بهذا المعلم</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.students.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">{s.grade} {s.circle_name ? `— ${s.circle_name}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.level && <Badge variant="outline" className="text-xs">{s.level}</Badge>}
                      {s.points != null && (
                        <span className="text-xs text-amber-600 font-semibold">{s.points} نقطة</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* تبويب الحلقات */}
          <TabsContent value="circles" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !stats || stats.circles.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CircleDot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد حلقات مرتبطة بهذا المعلم</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.circles.map(c => (
                  <div key={c.id} className="bg-accent/5 border border-accent/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-secondary">{c.name}</div>
                        {c.days && <div className="text-xs text-muted-foreground mt-0.5">{c.days}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="font-bold text-primary">{c.student_count ?? 0}</div>
                          <div className="text-xs text-muted-foreground">طالب</div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${c.status === "نشطة" ? "text-green-600 border-green-400" : "text-muted-foreground"}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* تبويب الحصص والرواتب */}
          <TabsContent value="sessions" className="mt-4 space-y-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <>
                {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-secondary text-sm mb-2 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      آخر الحصص
                    </h4>
                    <div className="space-y-2">
                      {stats.recentSessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm">
                          <div>
                            <span className="font-medium">{s.circle_name}</span>
                            <span className="text-muted-foreground mr-2">{s.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-xs">{s.present_count ?? 0} حاضر</span>
                            <Badge variant="outline" className="text-xs">{s.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد حصص مسجلة</p>
                  </div>
                )}

                {stats?.salaryRecords && stats.salaryRecords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary text-sm mb-2 flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-primary" />
                      سجل الرواتب
                    </h4>
                    <div className="space-y-2">
                      {stats.salaryRecords.slice(0, 6).map(sr => (
                        <div key={sr.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm">
                          <span className="font-medium">{sr.month}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">{sr.base_salary} ج.م</span>
                            <Badge variant="outline" className={`text-xs ${sr.status === "مدفوع" ? "text-green-600 border-green-400" : "text-amber-600 border-amber-400"}`}>
                              {sr.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          {onEdit && (
            <Button onClick={onEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Edit className="h-4 w-4 ml-2" />
              تعديل البيانات
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
