import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit, Phone, Mail, BookOpen, CheckCircle, XCircle, Trophy,
  BookMarked, Wallet, Star, TrendingUp, Users, Calendar,
  GraduationCap, BarChart3, Award, Mic,
} from "lucide-react";
import { useStudentStats } from "@/lib/store";
import type { Student } from "@/lib/store";

interface StudentDetailModalProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
  onEdit?: () => void;
}

export function StudentDetailModal({ open, onClose, student, onEdit }: StudentDetailModalProps) {
  const { stats, loading } = useStudentStats(open && student ? student.id : null);
  const [tab, setTab] = useState("profile");

  if (!student) return null;

  const attendanceColor = (pct: number) =>
    pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-destructive";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            ملف الطالب الشامل
          </DialogTitle>
        </DialogHeader>

        {/* Header card */}
        <div className="bg-gradient-to-l from-primary/10 to-accent/5 rounded-xl p-5 border border-primary/10">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{student.full_name}</h2>
              <p className="text-muted-foreground mt-0.5">{student.grade || "—"}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {student.circle_name && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    <Users className="h-3 w-3 ml-1" />{student.circle_name}
                  </Badge>
                )}
                {student.teacher_name && (
                  <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                    <GraduationCap className="h-3 w-3 ml-1" />{student.teacher_name}
                  </Badge>
                )}
                {student.level && (
                  <Badge className="bg-accent/20 text-accent border-accent text-xs">{student.level}</Badge>
                )}
                {student.is_exempt && (
                  <Badge variant="outline" className="text-blue-600 border-blue-400 bg-blue-50 text-xs">معفي من الرسوم</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/60 rounded-lg p-2 border border-border/50 min-w-[70px]">
                <div className="text-xl font-bold text-accent">{student.points ?? 0}</div>
                <div className="text-xs text-muted-foreground">النقاط</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2 border border-border/50 min-w-[70px]">
                <div className="text-xl font-bold text-primary">{student.rating ? `${student.rating}/10` : "—"}</div>
                <div className="text-xs text-muted-foreground">التقييم</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats from live data */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-600">{stats.presentCount}</div>
              <div className="text-xs text-green-700">حضور</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-destructive">{stats.absentCount}</div>
              <div className="text-xs text-red-700">غياب</div>
            </div>
            <div className={`bg-muted/40 border border-border rounded-lg p-3 text-center`}>
              <div className={`text-xl font-bold ${attendanceColor(stats.attendancePct)}`}>{stats.attendancePct}%</div>
              <div className="text-xs text-muted-foreground">الالتزام</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-amber-600">{stats.avgGrade || "—"}</div>
              <div className="text-xs text-amber-700">متوسط الدرجات</div>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="profile" className="text-xs py-2">البيانات</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs py-2">الحضور</TabsTrigger>
            <TabsTrigger value="competitions" className="text-xs py-2">المسابقات</TabsTrigger>
            <TabsTrigger value="courses" className="text-xs py-2">الدورات</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs py-2">المالية</TabsTrigger>
          </TabsList>

          {/* تبويب البيانات */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4 text-sm">
              {student.guardian_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">ولي الأمر:</span>
                  <span dir="ltr">{student.guardian_phone}</span>
                </div>
              )}
              {student.secondary_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{student.secondary_phone}</span>
                </div>
              )}
              {student.email && (
                <div className="flex items-center gap-2 col-span-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span dir="ltr">{student.email}</span>
                </div>
              )}
              {student.age && <div><span className="text-muted-foreground">العمر: </span><span>{student.age} سنة</span></div>}
              {student.birth_date && <div><span className="text-muted-foreground">الميلاد: </span><span dir="ltr">{student.birth_date}</span></div>}
              {student.enrollment_date && <div className="col-span-2"><span className="text-muted-foreground">تاريخ التسجيل: </span><span dir="ltr">{student.enrollment_date}</span></div>}
            </div>

            {(student.current_memorization || student.current_revision || student.last_memorization_position || student.last_revision_position) && (
              <div>
                <h3 className="font-semibold text-secondary flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  الحفظ والمراجعة
                </h3>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                  {student.current_memorization && (
                    <div className="bg-white/70 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">مقدار الحفظ الحالي</div>
                      <div className="font-semibold text-primary">{student.current_memorization}</div>
                    </div>
                  )}
                  {student.current_revision && (
                    <div className="bg-white/70 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">مقدار المراجعة الحالية</div>
                      <div className="font-semibold text-primary">{student.current_revision}</div>
                    </div>
                  )}
                  {student.last_memorization_position && (
                    <div className="bg-white/70 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">آخر موضع حفظ</div>
                      <div className="font-semibold text-accent">{student.last_memorization_position}</div>
                    </div>
                  )}
                  {student.last_revision_position && (
                    <div className="bg-white/70 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">آخر موضع مراجعة</div>
                      <div className="font-semibold text-accent">{student.last_revision_position}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {student.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <span className="font-semibold">ملاحظات: </span>{student.notes}
              </div>
            )}
          </TabsContent>

          {/* تبويب الحضور */}
          <TabsContent value="attendance" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats || stats.totalSessions === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد سجلات حضور بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3 flex-wrap text-sm">
                  <span className="bg-green-50 border border-green-200 rounded px-3 py-1 text-green-700">
                    ✓ حضر {stats.presentCount} مرة
                  </span>
                  <span className="bg-red-50 border border-red-200 rounded px-3 py-1 text-red-700">
                    ✗ غاب {stats.absentCount} مرة
                  </span>
                  <span className={`border rounded px-3 py-1 ${stats.attendancePct >= 80 ? "bg-green-50 border-green-200 text-green-700" : stats.attendancePct >= 60 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                    نسبة الالتزام {stats.attendancePct}%
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground text-xs">
                      <tr>
                        <th className="px-3 py-2">التاريخ</th>
                        <th className="px-3 py-2">الحضور</th>
                        <th className="px-3 py-2">الحفظ</th>
                        <th className="px-3 py-2">الدرجة</th>
                        <th className="px-3 py-2">سمع عند</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentSessions.map((s, i) => (
                        <tr key={i} className={`border-b border-muted/50 ${s.present ? "" : "bg-red-50/40"}`}>
                          <td className="px-3 py-2 font-medium" dir="ltr">{s.date}</td>
                          <td className="px-3 py-2">
                            {s.present
                              ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />حاضر</span>
                              : <span className="text-destructive flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />غائب</span>}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{s.memorization || "—"}</td>
                          <td className="px-3 py-2">
                            {s.grade != null
                              ? <span className={`font-semibold ${s.grade >= 80 ? "text-green-600" : s.grade >= 60 ? "text-amber-600" : "text-destructive"}`}>{s.grade}</span>
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-xs text-blue-600">
                            {s.heard_by ? <span className="flex items-center gap-1"><Mic className="h-3 w-3" />{s.heard_by}</span> : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stats.totalSessions > 10 && (
                  <p className="text-xs text-muted-foreground text-center">عرض آخر 10 حصص من إجمالي {stats.totalSessions}</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* تبويب المسابقات */}
          <TabsContent value="competitions" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !stats || stats.competitionResults.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لم يشارك في أي مسابقة بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.competitionResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div>
                      <div className="font-semibold text-sm text-secondary">{r.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.level}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.score != null && (
                        <div className="text-center">
                          <div className={`font-bold text-lg ${r.score >= 80 ? "text-green-600" : r.score >= 60 ? "text-amber-600" : "text-destructive"}`}>{r.score}</div>
                          <div className="text-xs text-muted-foreground">الدرجة</div>
                        </div>
                      )}
                      {r.grade && <Badge variant="outline" className="text-xs">{r.grade}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* تبويب الدورات */}
          <TabsContent value="courses" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats || stats.courses.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لم يسجل في أي دورة بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.courses.map((course, i) => (
                  <div key={i} className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-lg p-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{course}</span>
                    <Badge variant="outline" className="mr-auto text-xs text-green-600 border-green-400">مسجل</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* تبويب المالية */}
          <TabsContent value="finance" className="mt-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats ? (
              <div className="text-center py-10 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد بيانات مالية</p>
              </div>
            ) : (
              <div className="space-y-4">
                {student.is_exempt && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm font-medium">
                    هذا الطالب معفي من الرسوم الدراسية
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-600">{stats.paidInvoices}</div>
                    <div className="text-xs text-green-700">فاتورة مدفوعة</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-destructive">{stats.unpaidInvoices}</div>
                    <div className="text-xs text-red-700">فاتورة غير مدفوعة</div>
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-primary">{stats.totalPaid}</div>
                    <div className="text-xs text-muted-foreground">إجمالي المدفوع (ج.م)</div>
                  </div>
                </div>
                {stats.unpaidInvoices > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    ⚠️ يوجد {stats.unpaidInvoices} فاتورة غير مسددة
                  </div>
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
              تعديل البيانات
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
