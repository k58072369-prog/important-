import { useState } from "react";
import { useSessions, useCircles } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SessionModal } from "@/components/modals/session-modal";
import { SessionDetailModal } from "@/components/modals/session-detail-modal";

export default function Sessions() {
  const [addOpen, setAddOpen] = useState(false);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [filterCircle, setFilterCircle] = useState<string>("all");

  const { circles } = useCircles();
  const { sessions, loading } = useSessions(filterCircle !== "all" ? filterCircle : undefined);

  const statusColor = (status: string) =>
    status === "مكتملة" ? "text-green-600 border-green-600 bg-green-50" :
    status === "ملغاة" ? "text-destructive border-destructive bg-destructive/5" :
    "text-amber-600 border-amber-400 bg-amber-50";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary">الحصص اليومية</h1>
          <p className="text-muted-foreground mt-1">سجل الحصص ومتابعة الحضور والانصراف</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="ml-2 h-4 w-4" />
          بدء حصة جديدة
        </Button>
      </div>

      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-primary">{sessions.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي الحصص</div>
            </CardContent>
          </Card>
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === "مكتملة").length}</div>
              <div className="text-sm text-muted-foreground">مكتملة</div>
            </CardContent>
          </Card>
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-accent">{sessions.reduce((s, sess) => s + (sess.present_count ?? 0), 0)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الحضور</div>
            </CardContent>
          </Card>
          <Card className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-destructive">{sessions.reduce((s, sess) => s + ((sess.student_count ?? 0) - (sess.present_count ?? 0)), 0)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الغياب</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-gold-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-secondary text-base">سجل الحصص</CardTitle>
            <Select value={filterCircle} onValueChange={setFilterCircle}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="تصفية بالحلقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحلقات</SelectItem>
                {circles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !sessions.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">لا يوجد حصص مسجلة</p>
              <p className="text-sm mt-1">اضغط على "بدء حصة جديدة" لتسجيل حصة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-muted-foreground bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tr-lg">التاريخ</th>
                    <th className="px-4 py-3">اليوم</th>
                    <th className="px-4 py-3">الحلقة</th>
                    <th className="px-4 py-3">المعلم</th>
                    <th className="px-4 py-3">الحضور</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3 rounded-tl-lg text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sessions].reverse().map(session => (
                    <tr key={session.id} className="border-b border-muted/60 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium" dir="ltr">
                        {new Date(session.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{session.day || "—"}</td>
                      <td className="px-4 py-3 font-medium">{session.circle_name || "—"}</td>
                      <td className="px-4 py-3">{session.teacher_name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="text-green-600 font-semibold">{session.present_count ?? 0}</span>
                            <span className="text-muted-foreground">/{session.student_count ?? 0}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${statusColor(session.status ?? "")}`}>
                          {session.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Button
                          variant="ghost" size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => setDetailSessionId(session.id)}
                        >
                          التفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SessionModal open={addOpen} onClose={() => setAddOpen(false)} />
      <SessionDetailModal
        open={!!detailSessionId}
        sessionId={detailSessionId}
        onClose={() => setDetailSessionId(null)}
      />
    </div>
  );
}
