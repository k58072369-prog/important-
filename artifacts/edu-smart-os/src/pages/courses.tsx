import { useState } from "react";
import {
  useCourses, addCourse, updateCourse, deleteCourse,
  useTeachers, useStudents, useCourseStudents,
  enrollStudentInCourse, unenrollStudentFromCourse,
  useCourseSessions, addCourseSession, updateCourseSession, deleteCourseSession,
  useCourseSessionRecords, saveCourseSessionRecords,
  type Course, type CourseSession,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Plus, Users, CalendarDays, Trash2, Edit2, Eye, UserPlus, UserMinus,
  Clock, ChevronRight, GraduationCap, Award, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "detail" | "session-detail";

export default function Courses() {
  const { courses, loading } = useCourses();
  const { teachers } = useTeachers();
  const { students } = useStudents();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>("list");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null);
  const [courseModal, setCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [sessionModal, setSessionModal] = useState(false);
  const [editSession, setEditSession] = useState<CourseSession | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {view === "list" && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-secondary">الدورات التدريبية</h1>
              <p className="text-muted-foreground mt-1">إدارة الدورات والمجموعات التدريبية المستقلة</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => { setEditCourse(null); setCourseModal(true); }}>
              <Plus className="ml-2 h-4 w-4" />
              دورة جديدة
            </Button>
          </div>

          <div className="flex gap-3">
            <Input placeholder="بحث عن دورة..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">لا توجد دورات بعد</p>
              <p className="text-sm mt-1">أنشئ أول دورة تدريبية الآن</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onView={() => { setSelectedCourse(course); setView("detail"); }}
                  onEdit={() => { setEditCourse(course); setCourseModal(true); }}
                  onDelete={async () => {
                    if (!confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
                    await deleteCourse(course.id);
                    toast({ title: "تم حذف الدورة" });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === "detail" && selectedCourse && (
        <CourseDetail
          course={selectedCourse}
          students={students}
          teachers={teachers}
          onBack={() => setView("list")}
          onOpenSession={(s: CourseSession) => { setSelectedSession(s); setView("session-detail"); }}
          onAddSession={() => { setEditSession(null); setSessionModal(true); }}
          onEditSession={(s: CourseSession) => { setEditSession(s); setSessionModal(true); }}
          onEnroll={() => setEnrollModal(true)}
          toast={toast}
        />
      )}

      {view === "session-detail" && selectedSession && selectedCourse && (
        <CourseSessionDetail
          session={selectedSession}
          course={selectedCourse}
          onBack={() => setView("detail")}
          toast={toast}
        />
      )}

      {/* Course Modal */}
      <CourseFormModal
        open={courseModal}
        onClose={() => setCourseModal(false)}
        course={editCourse}
        teachers={teachers}
        toast={toast}
      />

      {/* Session Modal */}
      {selectedCourse && (
        <SessionFormModal
          open={sessionModal}
          onClose={() => setSessionModal(false)}
          session={editSession}
          courseId={selectedCourse.id}
          toast={toast}
        />
      )}

      {/* Enroll Modal */}
      {selectedCourse && (
        <EnrollModal
          open={enrollModal}
          onClose={() => setEnrollModal(false)}
          course={selectedCourse}
          allStudents={students}
          toast={toast}
        />
      )}
    </div>
  );
}

function CourseCard({ course, onView, onEdit, onDelete }: { course: Course; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const statusColor = course.status === "نشطة" ? "bg-green-100 text-green-700 border-green-300" : course.status === "منتهية" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700";
  return (
    <Card className="border-border/60 hover:shadow-md transition-all hover:border-primary/30 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold text-secondary truncate">{course.name}</CardTitle>
            {course.teacher_name && <p className="text-xs text-muted-foreground mt-0.5">{course.teacher_name}</p>}
          </div>
          <Badge variant="outline" className={cn("text-xs mr-2 flex-shrink-0", statusColor)}>{course.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {course.description && <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{course.student_count ?? 0} طالب</span>
          </div>
          {course.fee && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              <span>{course.fee} ج.م</span>
            </div>
          )}
          {course.start_date && (
            <div className="flex items-center gap-1 text-muted-foreground col-span-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{course.start_date} {course.end_date ? `← ${course.end_date}` : ""}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onView}>
            <Eye className="h-3 w-3 ml-1" /> عرض
          </Button>
          <Button size="sm" variant="outline" className="text-xs px-2" onClick={onEdit}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseDetail({ course, students, teachers, onBack, onOpenSession, onAddSession, onEditSession, onEnroll, toast }: any) {
  const { students: enrolled, loading: enrollLoading } = useCourseStudents(course.id);
  const { sessions, loading: sessionsLoading } = useCourseSessions(course.id);
  const [tab, setTab] = useState("sessions");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-secondary">
          <ChevronRight className="h-4 w-4 ml-1" /> الدورات
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-secondary">{course.name}</span>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-secondary">{course.name}</h2>
              {course.description && <p className="text-muted-foreground mt-1">{course.description}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {course.teacher_name && <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{course.teacher_name}</span>}
                {course.start_date && <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{course.start_date} {course.end_date && `← ${course.end_date}`}</span>}
                {course.seats && <span className="flex items-center gap-1"><Users className="h-4 w-4" />سعة: {course.seats}</span>}
                {course.fee && <span className="flex items-center gap-1"><Award className="h-4 w-4" />الرسوم: {course.fee} ج.م</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary/20" onClick={onEnroll}>
                <UserPlus className="h-4 w-4 ml-1" /> تسجيل طالب
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={onAddSession}>
                <Plus className="h-4 w-4 ml-1" /> حصة جديدة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="sessions">الحصص ({sessions.length})</TabsTrigger>
          <TabsTrigger value="students">الطلاب ({enrolled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4 space-y-3">
          {sessionsLoading ? <Skeleton className="h-32" /> : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>لا توجد حصص بعد. أضف أول حصة للدورة.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <Card key={s.id} className="border-border/50 hover:border-primary/30 transition-all cursor-pointer" onClick={() => onOpenSession(s)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-secondary">{s.title || `حصة ${s.date}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.day} — {s.date} {s.start_time && `| ${s.start_time} - ${s.end_time}`}</p>
                        {s.what_was_taught && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">ما تم شرحه: {s.what_was_taught}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{s.present_count ?? 0}/{s.student_count ?? 0}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={e => { e.stopPropagation(); onEditSession(s); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={async e => {
                            e.stopPropagation();
                            if (!confirm("حذف هذه الحصة؟")) return;
                            await deleteCourseSession(s.id);
                            toast({ title: "تم حذف الحصة" });
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-4 space-y-3">
          {enrollLoading ? <Skeleton className="h-32" /> : enrolled.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>لا يوجد طلاب مسجلون. سجّل طلاباً في الدورة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrolled.map(e => (
                <Card key={e.id} className="border-border/50">
                  <CardContent className="py-3 px-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-secondary">{e.student_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString("ar-EG")}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                      if (!confirm("إلغاء تسجيل هذا الطالب؟")) return;
                      await unenrollStudentFromCourse(course.id, e.student_id);
                      toast({ title: "تم إلغاء التسجيل" });
                    }}>
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CourseSessionDetail({ session, course, onBack, toast }: any) {
  const { students: enrolled } = useCourseStudents(course.id);
  const { records, loading } = useCourseSessionRecords(session.id);
  const [attendance, setAttendance] = useState<Record<string, { status: "حضور" | "غياب" | "تأخر"; notes: string }>>({});
  const [saved, setSaved] = useState(false);

  const initAttendance = () => {
    if (records.length > 0 && !saved) {
      const init: typeof attendance = {};
      records.forEach(r => { init[r.student_id] = { status: r.status, notes: r.notes ?? "" }; });
      setAttendance(init);
      setSaved(true);
    }
  };
  if (!loading && records.length > 0 && !saved) initAttendance();

  const getStatus = (sid: string): "حضور" | "غياب" | "تأخر" => attendance[sid]?.status ?? "حضور";
  const toggleStatus = (sid: string) => {
    const cur = getStatus(sid);
    const next: Record<string, "حضور" | "غياب" | "تأخر"> = { "حضور": "غياب", "غياب": "تأخر", "تأخر": "حضور" };
    setAttendance(prev => ({ ...prev, [sid]: { ...prev[sid], status: next[cur] } }));
  };

  const handleSave = async () => {
    const recs = enrolled.map(e => ({
      course_session_id: session.id,
      student_id: e.student_id,
      student_name: e.student_name,
      status: getStatus(e.student_id),
      notes: attendance[e.student_id]?.notes ?? "",
    }));
    await saveCourseSessionRecords(session.id, recs);
    toast({ title: "تم حفظ الحضور" });
    setSaved(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-secondary">
          <ChevronRight className="h-4 w-4 ml-1" /> {course.name}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-secondary">{session.title || `حصة ${session.date}`}</span>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground text-xs">التاريخ</p><p className="font-medium">{session.date}</p></div>
            <div><p className="text-muted-foreground text-xs">اليوم</p><p className="font-medium">{session.day ?? "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">الوقت</p><p className="font-medium">{session.start_time ? `${session.start_time} - ${session.end_time}` : "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">الطلاب</p><p className="font-medium">{enrolled.length}</p></div>
          </div>
          {session.what_was_taught && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">ما تم شرحه:</p>
              <p className="text-sm">{session.what_was_taught}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-secondary">الحضور والغياب</h3>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleSave}>
          <CheckCircle className="h-4 w-4 ml-2" /> حفظ الحضور
        </Button>
      </div>

      {enrolled.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>لا يوجد طلاب مسجلون في هذه الدورة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enrolled.map(e => {
            const status = getStatus(e.student_id);
            return (
              <Card key={e.student_id} className={cn("border transition-all", status === "حضور" ? "border-green-300 bg-green-50/50" : status === "غياب" ? "border-red-300 bg-red-50/50" : "border-amber-300 bg-amber-50/50")}>
                <CardContent className="py-3 px-4 flex justify-between items-center">
                  <p className="font-medium text-secondary">{e.student_name}</p>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="ملاحظات..."
                      value={attendance[e.student_id]?.notes ?? ""}
                      onChange={ev => setAttendance(prev => ({ ...prev, [e.student_id]: { ...prev[e.student_id], status: getStatus(e.student_id), notes: ev.target.value } }))}
                      className="h-8 text-sm w-36"
                    />
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(e.student_id)}
                      className={cn("min-w-20 text-xs font-semibold", status === "حضور" ? "text-green-700 border-green-400 hover:bg-green-100" : status === "غياب" ? "text-red-700 border-red-400 hover:bg-red-100" : "text-amber-700 border-amber-400 hover:bg-amber-100")}>
                      {status === "حضور" ? <><CheckCircle className="h-3.5 w-3.5 ml-1" />حضور</> : status === "غياب" ? <><XCircle className="h-3.5 w-3.5 ml-1" />غياب</> : <><AlertCircle className="h-3.5 w-3.5 ml-1" />تأخر</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseFormModal({ open, onClose, course, teachers, toast }: any) {
  const [form, setForm] = useState({ name: "", description: "", teacher_id: "", start_date: "", end_date: "", seats: "", fee: "", status: "نشطة" });

  const init = () => {
    if (course) {
      setForm({ name: course.name ?? "", description: course.description ?? "", teacher_id: course.teacher_id ?? "", start_date: course.start_date ?? "", end_date: course.end_date ?? "", seats: course.seats?.toString() ?? "", fee: course.fee?.toString() ?? "", status: course.status ?? "نشطة" });
    } else {
      setForm({ name: "", description: "", teacher_id: "", start_date: "", end_date: "", seats: "", fee: "", status: "نشطة" });
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: "اسم الدورة مطلوب", variant: "destructive" }); return; }
    const data = { name: form.name, description: form.description || undefined, teacher_id: form.teacher_id || undefined, start_date: form.start_date || undefined, end_date: form.end_date || undefined, seats: form.seats ? Number(form.seats) : undefined, fee: form.fee ? Number(form.fee) : undefined, status: form.status };
    if (course) { await updateCourse(course.id, data); toast({ title: "تم تحديث الدورة" }); }
    else { await addCourse(data); toast({ title: "تم إنشاء الدورة" }); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else init(); }}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={init}>
        <DialogHeader><DialogTitle>{course ? "تعديل الدورة" : "دورة جديدة"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>اسم الدورة *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="اسم الدورة" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>المعلم المسؤول</Label>
              <Select value={form.teacher_id || "none"} onValueChange={v => setForm(p => ({...p, teacher_id: v === "none" ? "" : v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="اختر معلماً" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون معلم</SelectItem>
                  {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ البداية</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>تاريخ النهاية</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>عدد المقاعد</Label>
              <Input type="number" value={form.seats} onChange={e => setForm(p => ({...p, seats: e.target.value}))} placeholder="عدد المقاعد" className="mt-1" />
            </div>
            <div>
              <Label>رسوم الدورة (ج.م)</Label>
              <Input type="number" value={form.fee} onChange={e => setForm(p => ({...p, fee: e.target.value}))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="نشطة">نشطة</SelectItem>
                  <SelectItem value="قادمة">قادمة</SelectItem>
                  <SelectItem value="منتهية">منتهية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>{course ? "حفظ التعديلات" : "إنشاء الدورة"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionFormModal({ open, onClose, session, courseId, toast }: any) {
  const [form, setForm] = useState({ title: "", date: "", day: "", start_time: "", end_time: "", what_was_taught: "", notes: "" });

  const init = () => {
    if (session) {
      setForm({ title: session.title ?? "", date: session.date ?? "", day: session.day ?? "", start_time: session.start_time ?? "", end_time: session.end_time ?? "", what_was_taught: session.what_was_taught ?? "", notes: session.notes ?? "" });
    } else {
      setForm({ title: "", date: new Date().toISOString().split("T")[0], day: "", start_time: "", end_time: "", what_was_taught: "", notes: "" });
    }
  };

  const handleSubmit = async () => {
    if (!form.date) { toast({ title: "التاريخ مطلوب", variant: "destructive" }); return; }
    const data = { course_id: courseId, title: form.title || undefined, date: form.date, day: form.day || undefined, start_time: form.start_time || undefined, end_time: form.end_time || undefined, what_was_taught: form.what_was_taught || undefined, notes: form.notes || undefined };
    if (session) { await updateCourseSession(session.id, data); toast({ title: "تم تحديث الحصة" }); }
    else { await addCourseSession(data); toast({ title: "تم إضافة الحصة" }); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else init(); }}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={init}>
        <DialogHeader><DialogTitle>{session ? "تعديل الحصة" : "إضافة حصة"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>عنوان الحصة</Label>
              <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="عنوان الحصة" className="mt-1" />
            </div>
            <div>
              <Label>التاريخ *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>اليوم</Label>
              <Select value={form.day || "none"} onValueChange={v => setForm(p => ({...p, day: v === "none" ? "" : v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="اختر اليوم" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>وقت البداية</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm(p => ({...p, start_time: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>وقت النهاية</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm(p => ({...p, end_time: e.target.value}))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>ما تم شرحه</Label>
              <Textarea value={form.what_was_taught} onChange={e => setForm(p => ({...p, what_was_taught: e.target.value}))} rows={2} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2} className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>{session ? "حفظ" : "إضافة"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnrollModal({ open, onClose, course, allStudents, toast }: any) {
  const { students: enrolled } = useCourseStudents(course.id);
  const [search, setSearch] = useState("");
  const enrolledIds = new Set(enrolled.map((e: any) => e.student_id));
  const filtered = allStudents.filter((s: any) => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>تسجيل طالب في الدورة</DialogTitle></DialogHeader>
        <Input placeholder="بحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)} className="mt-2" />
        <div className="max-h-72 overflow-y-auto space-y-2 mt-3">
          {filtered.map((s: any) => (
            <div key={s.id} className="flex justify-between items-center p-2 rounded-lg border border-border/50 hover:bg-muted/30">
              <span className="text-sm font-medium">{s.full_name}</span>
              {enrolledIds.has(s.id) ? (
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 text-xs" onClick={async () => {
                  await unenrollStudentFromCourse(course.id, s.id);
                  toast({ title: "تم إلغاء التسجيل" });
                }}>
                  <UserMinus className="h-3 w-3 ml-1" /> إلغاء
                </Button>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={async () => {
                  await enrollStudentInCourse(course.id, s.id);
                  toast({ title: "تم تسجيل الطالب" });
                }}>
                  <UserPlus className="h-3 w-3 ml-1" /> تسجيل
                </Button>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
