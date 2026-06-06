import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Calendar, Clock, CheckCircle, XCircle, BookOpen, Mic, Edit2, Save, X } from "lucide-react";
import { useSessionRecords, useSessions, updateSessionRecord, type SessionRecord } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface SessionDetailModalProps {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
}

const PERFORMANCE_LABELS = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"];
const HEARD_BY_OPTIONS = ["المعلم", "المحفظ", "المشرف", "كتابة يدوية..."];

interface EditingState {
  is_present: boolean;
  memorization_amount: string;
  revision_amount: string;
  next_memorization: string;
  grade: string;
  performance_label: string;
  heard_by: string;
  heard_by_custom: string;
  notes: string;
}

function EditRowInline({
  record,
  onSave,
  onCancel,
}: {
  record: SessionRecord;
  onSave: (data: Partial<SessionRecord>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditingState>({
    is_present: record.is_present,
    memorization_amount: record.memorization_amount ?? "",
    revision_amount: record.revision_amount ?? "",
    next_memorization: record.next_memorization ?? "",
    grade: record.grade != null ? String(record.grade) : "",
    performance_label: record.performance_label ?? "",
    heard_by: HEARD_BY_OPTIONS.slice(0, 3).includes(record.heard_by ?? "") ? (record.heard_by ?? "") : record.heard_by ? "كتابة يدوية..." : "",
    heard_by_custom: HEARD_BY_OPTIONS.slice(0, 3).includes(record.heard_by ?? "") ? "" : (record.heard_by ?? ""),
    notes: record.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const heardByValue = form.heard_by === "كتابة يدوية..." ? form.heard_by_custom : form.heard_by;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      is_present: form.is_present,
      memorization_amount: form.memorization_amount,
      revision_amount: form.revision_amount,
      next_memorization: form.next_memorization,
      grade: form.grade ? Number(form.grade) : undefined,
      performance_label: form.performance_label,
      heard_by: heardByValue,
      notes: form.notes,
    });
    setSaving(false);
  };

  return (
    <tr className="bg-primary/5 border-b border-primary/20">
      <td className="px-3 py-2 font-medium text-sm">{record.student_name}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.is_present}
            onCheckedChange={v => setForm(f => ({ ...f, is_present: v }))}
            className="scale-75"
          />
          <span className={`text-xs ${form.is_present ? "text-green-600" : "text-destructive"}`}>
            {form.is_present ? "حاضر" : "غائب"}
          </span>
        </div>
      </td>
      <td className="px-2 py-2">
        <Input
          value={form.memorization_amount}
          onChange={e => setForm(f => ({ ...f, memorization_amount: e.target.value }))}
          placeholder="الحفظ"
          className="h-7 text-xs w-24"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={form.revision_amount}
          onChange={e => setForm(f => ({ ...f, revision_amount: e.target.value }))}
          placeholder="المراجعة"
          className="h-7 text-xs w-24"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={form.grade}
          onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
          placeholder="0-100"
          type="number"
          min={0}
          max={100}
          className="h-7 text-xs w-16"
        />
      </td>
      <td className="px-2 py-2">
        <Select value={form.performance_label} onValueChange={v => setForm(f => ({ ...f, performance_label: v }))}>
          <SelectTrigger className="h-7 text-xs w-28">
            <SelectValue placeholder="التقييم" />
          </SelectTrigger>
          <SelectContent>
            {PERFORMANCE_LABELS.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-col gap-1">
          <Select value={form.heard_by} onValueChange={v => setForm(f => ({ ...f, heard_by: v }))}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue placeholder="سمع عند" />
            </SelectTrigger>
            <SelectContent>
              {HEARD_BY_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.heard_by === "كتابة يدوية..." && (
            <Input
              value={form.heard_by_custom}
              onChange={e => setForm(f => ({ ...f, heard_by_custom: e.target.value }))}
              placeholder="اكتب الاسم..."
              className="h-7 text-xs w-28"
            />
          )}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <Button size="sm" className="h-7 px-2 text-xs bg-primary" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function SessionDetailModal({ open, sessionId, onClose }: SessionDetailModalProps) {
  const { sessions } = useSessions();
  const session = sessionId ? sessions.find(s => s.id === sessionId) : null;
  const { records, loading } = useSessionRecords(open ? sessionId : null);
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const presentCount = records.filter(r => r.is_present).length;
  const absentCount = records.filter(r => !r.is_present).length;

  const handleSaveRecord = async (id: string, data: Partial<SessionRecord>) => {
    try {
      await updateSessionRecord(id, data);
      setEditingId(null);
      toast({ title: "تم حفظ التعديل بنجاح" });
    } catch {
      toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-secondary">تفاصيل الحصة</DialogTitle>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              className={editMode ? "bg-primary text-primary-foreground" : ""}
              onClick={() => { setEditMode(!editMode); setEditingId(null); }}
            >
              {editMode ? <><X className="h-4 w-4 ml-1" />إلغاء التعديل</> : <><Edit2 className="h-4 w-4 ml-1" />تعديل الحضور</>}
            </Button>
          </div>
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
                    session.status === "مكتملة" ? "text-green-600 border-green-600" : "text-amber-600 border-amber-400"
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

            {editMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <Edit2 className="inline h-4 w-4 ml-1" />
                وضع التعديل مفعّل — اضغط على زر التعديل بجانب أي طالب لتغيير بياناته
              </div>
            )}

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
                        <th className="px-3 py-2">التقييم</th>
                        <th className="px-3 py-2">سمع عند</th>
                        {editMode && <th className="px-3 py-2 rounded-tl-lg">تعديل</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => (
                        editMode && editingId === record.id ? (
                          <EditRowInline
                            key={record.id}
                            record={record}
                            onSave={(data) => handleSaveRecord(record.id, data)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <tr key={record.id} className={`border-b border-muted/60 hover:bg-muted/20 ${record.is_present ? "" : "bg-red-50/50"}`}>
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
                            <td className="px-3 py-2">
                              {record.heard_by ? (
                                <span className="flex items-center gap-1 text-blue-600 text-xs">
                                  <Mic className="h-3 w-3" />
                                  {record.heard_by}
                                </span>
                              ) : "—"}
                            </td>
                            {editMode && (
                              <td className="px-3 py-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                                  onClick={() => setEditingId(record.id)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        )
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
