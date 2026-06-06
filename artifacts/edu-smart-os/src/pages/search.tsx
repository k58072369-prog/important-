import { useState, useDeferredValue } from "react";
import { useGlobalSearch } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Users, GraduationCap, CircleDot, CalendarDays, Wallet,
  Phone, BookOpen, CheckCircle, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterType = "all" | "students" | "teachers" | "circles" | "sessions" | "invoices";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const deferred = useDeferredValue(query);
  const { results, loading } = useGlobalSearch(deferred);

  const totalCount = results
    ? (results.students?.length ?? 0) +
      (results.teachers?.length ?? 0) +
      (results.circles?.length ?? 0) +
      (results.sessions?.length ?? 0) +
      (results.invoices?.length ?? 0)
    : 0;

  const showStudents = (filter === "all" || filter === "students") && (results?.students?.length ?? 0) > 0;
  const showTeachers = (filter === "all" || filter === "teachers") && (results?.teachers?.length ?? 0) > 0;
  const showCircles = (filter === "all" || filter === "circles") && (results?.circles?.length ?? 0) > 0;
  const showSessions = (filter === "all" || filter === "sessions") && (results?.sessions?.length ?? 0) > 0;
  const showInvoices = (filter === "all" || filter === "invoices") && (results?.invoices?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <Search className="h-7 w-7 text-primary" />
          البحث المتقدم الشامل
        </h1>
        <p className="text-muted-foreground mt-1">بحث فوري عبر جميع أقسام النظام</p>
      </div>

      {/* Search box */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، الهاتف، الحلقة، المعلم، التاريخ، رقم الفاتورة..."
            className="pr-10 text-base h-11"
            autoFocus
          />
        </div>
        <Select value={filter} onValueChange={v => setFilter(v as FilterType)}>
          <SelectTrigger className="w-44 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأقسام</SelectItem>
            <SelectItem value="students">الطلاب فقط</SelectItem>
            <SelectItem value="teachers">المعلمون فقط</SelectItem>
            <SelectItem value="circles">الحلقات فقط</SelectItem>
            <SelectItem value="sessions">الحصص فقط</SelectItem>
            <SelectItem value="invoices">الفواتير فقط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick filter chips */}
      {results && totalCount > 0 && (
        <div className="flex gap-2 flex-wrap text-xs">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilter("all")}>
            الكل ({totalCount})
          </Button>
          {(results.students?.length ?? 0) > 0 && (
            <Button variant={filter === "students" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilter("students")}>
              <Users className="h-3 w-3 ml-1" />طلاب ({results.students.length})
            </Button>
          )}
          {(results.teachers?.length ?? 0) > 0 && (
            <Button variant={filter === "teachers" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilter("teachers")}>
              <GraduationCap className="h-3 w-3 ml-1" />معلمون ({results.teachers.length})
            </Button>
          )}
          {(results.circles?.length ?? 0) > 0 && (
            <Button variant={filter === "circles" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilter("circles")}>
              <CircleDot className="h-3 w-3 ml-1" />حلقات ({results.circles.length})
            </Button>
          )}
          {(results.sessions?.length ?? 0) > 0 && (
            <Button variant={filter === "sessions" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilter("sessions")}>
              <CalendarDays className="h-3 w-3 ml-1" />حصص ({results.sessions.length})
            </Button>
          )}
          {(results.invoices?.length ?? 0) > 0 && (
            <Button variant={filter === "invoices" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setFilter("invoices")}>
              <Wallet className="h-3 w-3 ml-1" />فواتير ({results.invoices.length})
            </Button>
          )}
        </div>
      )}

      {/* Empty / placeholder state */}
      {!query || query.trim().length < 2 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">ابدأ بالكتابة للبحث</p>
          <p className="text-sm mt-1">يمكنك البحث بالاسم، الهاتف، الحلقة، المعلم، التاريخ أو الحالة</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
            {["طالب", "معلم", "حلقة", "يناير", "مدفوع", "ممتاز"].map(hint => (
              <button key={hint} onClick={() => setQuery(hint)} className="bg-muted rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
                {hint}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !results || totalCount === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-14 w-14 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">لم يُعثر على نتائج</p>
          <p className="text-sm mt-1">جرّب كلمات أخرى أو تحقق من التهجئة</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Highlight query helper */}
          <p className="text-sm text-muted-foreground">
            تم العثور على <span className="font-bold text-secondary">{totalCount}</span> نتيجة لـ "<span className="text-primary">{deferred}</span>"
          </p>

          {/* Students */}
          {showStudents && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  الطلاب ({results.students.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {results.students.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5 border border-border/40 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <div className="font-medium text-secondary truncate">{s.full_name}</div>
                      <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {s.grade && <span>{s.grade}</span>}
                        {s.circle_name && <span><CircleDot className="inline h-3 w-3 ml-0.5" />{s.circle_name}</span>}
                        {s.teacher_name && <span><GraduationCap className="inline h-3 w-3 ml-0.5" />{s.teacher_name}</span>}
                        {s.guardian_phone && <span dir="ltr"><Phone className="inline h-3 w-3 ml-0.5" />{s.guardian_phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                      {s.level && <Badge variant="outline" className="text-xs">{s.level}</Badge>}
                      {s.is_exempt && <Badge variant="outline" className="text-xs text-blue-600 border-blue-400">معفي</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Teachers */}
          {showTeachers && (
            <Card className="border-accent/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  المعلمون ({results.teachers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {results.teachers.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5 border border-border/40 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <div className="font-medium text-secondary">{t.full_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        {t.phone && <span dir="ltr"><Phone className="inline h-3 w-3 ml-0.5" />{t.phone}</span>}
                        {t.experience && <span>{t.experience}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center text-xs">
                        <div className="font-bold text-primary">{t.circle_count ?? 0}</div>
                        <div className="text-muted-foreground">حلقات</div>
                      </div>
                      <div className="text-center text-xs">
                        <div className="font-bold text-accent">{t.student_count ?? 0}</div>
                        <div className="text-muted-foreground">طلاب</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Circles */}
          {showCircles && (
            <Card className="border-amber-300/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-amber-600" />
                  الحلقات ({results.circles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {results.circles.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5 border border-border/40 hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-medium text-secondary">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        {c.teacher_name && <span><GraduationCap className="inline h-3 w-3 ml-0.5" />{c.teacher_name}</span>}
                        {c.days && <span>{c.days}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{c.student_count ?? 0} طالب</span>
                      <Badge variant="outline" className={`text-xs ${c.status === "نشطة" ? "text-green-600 border-green-400" : "text-muted-foreground"}`}>
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sessions */}
          {showSessions && (
            <Card className="border-blue-300/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  الحصص ({results.sessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {results.sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5 border border-border/40">
                    <div>
                      <div className="font-medium text-secondary">{s.circle_name || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        <span dir="ltr">{s.date}</span>
                        {s.day && <span>{s.day}</span>}
                        {s.teacher_name && <span>{s.teacher_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.present_count != null && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />{s.present_count} حاضر
                        </span>
                      )}
                      <Badge variant="outline" className={`text-xs ${s.status === "مكتملة" ? "text-green-600 border-green-400" : "text-amber-600 border-amber-400"}`}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Invoices */}
          {showInvoices && (
            <Card className="border-green-300/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  الفواتير ({results.invoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {results.invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5 border border-border/40">
                    <div>
                      <div className="font-medium text-secondary">{inv.student_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {inv.month} — {inv.amount} ج.م
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${inv.status === "مدفوع" ? "text-green-600 border-green-400" : inv.status === "معفي" ? "text-blue-600 border-blue-400" : "text-destructive border-destructive"}`}>
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
