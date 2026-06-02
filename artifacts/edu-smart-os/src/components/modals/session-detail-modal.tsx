import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Clock, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { useSessionRecords, useSessions } from "@/lib/store";

interface SessionDetailModalProps {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
}

export function SessionDetailModal({ open, sessionId, onClose }: SessionDetailModalProps) {
  const { sessions } = useSessions();
  const session = sessionId ? sessions.find(s => s.id === sessionId) : null;
  const { records, loading } = useSessionRecords(open ? sessionId : null);

  const presentCount = records.filter(r => r.is_present).length;
  const absentCount = records.filter(r => !r.is_present).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">تفاصيل الحصة</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {session && (
              <div className="bg-muted/40 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(session.date ?? "").toLocaleDateString('ar-EG')}</span>
                </div>
                {session.day && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{session.day}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{session.circle_name || "—"}</span>
                </div>
                <div>
                  <Badge variant="outline" className={
                    session.status === "مكتملة" ? "text-green-600 border-green-600" :
                    "text-amber-600 border-amber-400"
                  }>{session.status}</Badge>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-xl font-bold text-green-600">{presentCount}</div>
                  <div className="text-xs text-green-700">حاضر</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-xl font-bold text-destructive">{absentCount}</div>
                  <div className="text-xs text-red-700">غائب</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xl font-bold text-primary">{records.length}</div>
                  <div className="text-xs text-muted-foreground">إجمالي</div>
                </div>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>لا توجد سجلات حضور لهذه الحصة</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-secondary flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  سجل الطلاب
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 rounded-tr-lg">الطالب</th>
                        <th className="px-3 py-2">الحضور</th>
                        <th className="px-3 py-2">الحفظ</th>
                        <th className="px-3 py-2">المراجعة</th>
                        <th className="px-3 py-2">الحفظ القادم</th>
                        <th className="px-3 py-2">الدرجة</th>
                        <th className="px-3 py-2 rounded-tl-lg">التقييم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => (
                        <tr key={record.id} className={`border-b border-muted/60 ${record.is_present ? "" : "bg-red-50/50"}`}>
                          <td className="px-3 py-2 font-medium">{record.student_name}</td>
                          <td className="px-3 py-2">
                            {record.is_present ? (
                              <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> حاضر</span>
                            ) : (
                              <span className="text-destructive flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> غائب</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{record.memorization_amount || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{record.revision_amount || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{record.next_memorization || "—"}</td>
                          <td className="px-3 py-2">
                            {record.grade != null ? (
                              <span className={`font-semibold ${record.grade >= 80 ? "text-green-600" : record.grade >= 60 ? "text-amber-600" : "text-destructive"}`}>
                                {record.grade}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {record.performance_label ? (
                              <Badge variant="outline" className="text-xs">{record.performance_label}</Badge>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
