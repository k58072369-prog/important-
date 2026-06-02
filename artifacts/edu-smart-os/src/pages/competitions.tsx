import { useState } from "react";
import {
  useCompetitions, addCompetition, updateCompetition, deleteCompetition,
  useCompetitionLevels, addCompetitionLevel, updateCompetitionLevel, deleteCompetitionLevel,
  useCompetitionEnrollments, enrollStudentInLevel, unenrollStudentFromLevel,
  useCompetitionResults, saveCompetitionResult,
  useStudents,
  type Competition, type CompetitionLevel, type CompetitionEnrollment,
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
  Trophy, Plus, Users, CalendarDays, Trash2, Edit2, Eye, UserPlus, UserMinus,
  ChevronRight, Star, Award, Layers, ClipboardList, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "detail" | "level-detail";

const GRADES = ["ممتاز", "جيد جداً", "جيد", "مقبول", "يحتاج تحسين"];

export default function Competitions() {
  const { competitions, loading } = useCompetitions();
  const { students } = useStudents();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>("list");
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CompetitionLevel | null>(null);
  const [compModal, setCompModal] = useState(false);
  const [editComp, setEditComp] = useState<Competition | null>(null);
  const [levelModal, setLevelModal] = useState(false);
  const [editLevel, setEditLevel] = useState<CompetitionLevel | null>(null);
  const [enrollModal, setEnrollModal] = useState<CompetitionLevel | null>(null);
  const [search, setSearch] = useState("");

  const filtered = competitions.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {view === "list" && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-secondary">المسابقات</h1>
              <p className="text-muted-foreground mt-1">إدارة مسابقات التحفيظ والمراجعة</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => { setEditComp(null); setCompModal(true); }}>
              <Plus className="ml-2 h-4 w-4" />
              مسابقة جديدة
            </Button>
          </div>

          <Input placeholder="بحث عن مسابقة..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">لا توجد مسابقات بعد</p>
              <p className="text-sm mt-1">أنشئ أول مسابقة الآن</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(comp => (
                <CompCard
                  key={comp.id}
                  comp={comp}
                  onView={() => { setSelectedComp(comp); setView("detail"); }}
                  onEdit={() => { setEditComp(comp); setCompModal(true); }}
                  onDelete={async () => {
                    if (!confirm("هل أنت متأكد من حذف هذه المسابقة؟")) return;
                    await deleteCompetition(comp.id);
                    toast({ title: "تم حذف المسابقة" });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === "detail" && selectedComp && (
        <CompDetail
          comp={selectedComp}
          onBack={() => setView("list")}
          onOpenLevel={(lvl: CompetitionLevel) => { setSelectedLevel(lvl); setView("level-detail"); }}
          onAddLevel={() => { setEditLevel(null); setLevelModal(true); }}
          onEditLevel={(lvl: CompetitionLevel) => { setEditLevel(lvl); setLevelModal(true); }}
          onEnrollLevel={(lvl: CompetitionLevel) => setEnrollModal(lvl)}
          toast={toast}
        />
      )}

      {view === "level-detail" && selectedLevel && selectedComp && (
        <LevelDetail
          level={selectedLevel}
          comp={selectedComp}
          students={students}
          onBack={() => setView("detail")}
          toast={toast}
        />
      )}

      <CompFormModal open={compModal} onClose={() => setCompModal(false)} comp={editComp} toast={toast} />

      {selectedComp && (
        <LevelFormModal
          open={levelModal}
          onClose={() => setLevelModal(false)}
          level={editLevel}
          competitionId={selectedComp.id}
          toast={toast}
        />
      )}

      {enrollModal && (
        <EnrollLevelModal
          level={enrollModal}
          students={students}
          onClose={() => setEnrollModal(null)}
          toast={toast}
        />
      )}
    </div>
  );
}

function CompCard({ comp, onView, onEdit, onDelete }: { comp: Competition; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const statusColor = comp.status === "جارية" ? "bg-green-100 text-green-700 border-green-300" : comp.status === "منتهية" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700";
  return (
    <Card className="border-border/60 hover:shadow-md transition-all hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold text-secondary truncate">{comp.name}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("text-xs mr-2 flex-shrink-0", statusColor)}>{comp.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {comp.description && <p className="text-sm text-muted-foreground line-clamp-2">{comp.description}</p>}
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /><span>{comp.level_count ?? 0} مستوى</span></div>
          <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /><span>{comp.participant_count ?? 0} مشترك</span></div>
          {comp.start_date && <div className="flex items-center gap-1 col-span-2"><CalendarDays className="h-3.5 w-3.5" /><span>{comp.start_date} {comp.end_date && `← ${comp.end_date}`}</span></div>}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onView}><Eye className="h-3 w-3 ml-1" /> عرض</Button>
          <Button size="sm" variant="outline" className="text-xs px-2" onClick={onEdit}><Edit2 className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" className="text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompDetail({ comp, onBack, onOpenLevel, onAddLevel, onEditLevel, onEnrollLevel, toast }: any) {
  const { levels, loading } = useCompetitionLevels(comp.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-secondary">
          <ChevronRight className="h-4 w-4 ml-1" /> المسابقات
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-secondary">{comp.name}</span>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-4 items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{comp.name}</h2>
              {comp.description && <p className="text-muted-foreground mt-1">{comp.description}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {comp.start_date && <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{comp.start_date} {comp.end_date && `← ${comp.end_date}`}</span>}
                <span className="flex items-center gap-1"><Layers className="h-4 w-4" />{comp.level_count ?? 0} مستوى</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{comp.participant_count ?? 0} مشترك</span>
              </div>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={onAddLevel}>
              <Plus className="h-4 w-4 ml-1" /> إضافة مستوى
            </Button>
          </div>
        </CardContent>
      </Card>

      <h3 className="text-lg font-bold text-secondary">مستويات المسابقة</h3>

      {loading ? <Skeleton className="h-40" /> : levels.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground bg-card rounded-xl border">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>لا توجد مستويات بعد. أضف أول مستوى للمسابقة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map((lvl, i) => (
            <Card key={lvl.id} className="border-border/60 hover:shadow-sm transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{i + 1}</div>
                    <CardTitle className="text-base">{lvl.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">{lvl.student_count ?? 0} مشترك</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {lvl.required_memorization && <p>الحفظ المطلوب: <span className="text-secondary font-medium">{lvl.required_memorization}</span></p>}
                {lvl.required_revision && <p>المراجعة المطلوبة: <span className="text-secondary font-medium">{lvl.required_revision}</span></p>}
                {lvl.test_date && <p className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />موعد الاختبار: {lvl.test_date}</p>}
                {lvl.instructions && <p className="line-clamp-2 text-xs">{lvl.instructions}</p>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onOpenLevel(lvl)}><ClipboardList className="h-3 w-3 ml-1" /> النتائج</Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => onEnrollLevel(lvl)}><UserPlus className="h-3 w-3 ml-1" /> تسجيل</Button>
                  <Button size="sm" variant="outline" className="text-xs px-2" onClick={() => onEditLevel(lvl)}><Edit2 className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" className="text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => {
                    if (!confirm("حذف هذا المستوى؟")) return;
                    await deleteCompetitionLevel(lvl.id);
                    toast({ title: "تم حذف المستوى" });
                  }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function LevelDetail({ level, comp, students, onBack, toast }: any) {
  const { enrollments, loading: enrollLoading } = useCompetitionEnrollments(level.id);
  const { results } = useCompetitionResults(level.id);
  const [resultForms, setResultForms] = useState<Record<string, { degree: string; memorization_amount: string; revision_amount: string; grade: string; score: string; notes: string }>>({});

  const getForm = (enrId: string) => resultForms[enrId] ?? { degree: "", memorization_amount: "", revision_amount: "", grade: "", score: "", notes: "" };
  const setForm = (enrId: string, data: any) => setResultForms(prev => ({ ...prev, [enrId]: { ...getForm(enrId), ...data } }));

  const initForms = () => {
    const init: typeof resultForms = {};
    for (const r of results) {
      const enr = enrollments.find(e => e.student_id === r.student_id);
      if (enr) {
        init[enr.id] = { degree: r.degree?.toString() ?? "", memorization_amount: r.memorization_amount ?? "", revision_amount: r.revision_amount ?? "", grade: r.grade ?? "", score: r.score?.toString() ?? "", notes: r.notes ?? "" };
      }
    }
    return init;
  };

  const [initialized, setInitialized] = useState(false);
  if (!enrollLoading && !initialized && results.length > 0) {
    setResultForms(initForms());
    setInitialized(true);
  }

  const handleSave = async (enr: CompetitionEnrollment) => {
    const f = getForm(enr.id);
    await saveCompetitionResult({
      enrollment_id: enr.id,
      competition_id: comp.id,
      level_id: level.id,
      student_id: enr.student_id,
      student_name: enr.student_name,
      degree: f.degree ? Number(f.degree) : undefined,
      memorization_amount: f.memorization_amount || undefined,
      revision_amount: f.revision_amount || undefined,
      grade: f.grade || undefined,
      score: f.score ? Number(f.score) : undefined,
      notes: f.notes || undefined,
    });
    toast({ title: `تم حفظ نتيجة ${enr.student_name}` });
  };

  const gradeColor = (g: string) => g === "ممتاز" ? "bg-green-100 text-green-700" : g === "جيد جداً" ? "bg-blue-100 text-blue-700" : g === "جيد" ? "bg-cyan-100 text-cyan-700" : g === "مقبول" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-secondary">
          <ChevronRight className="h-4 w-4 ml-1" /> {comp.name}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-secondary">{level.name}</span>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">المستوى</p><p className="font-medium">{level.name}</p></div>
          <div><p className="text-muted-foreground text-xs">موعد الاختبار</p><p className="font-medium">{level.test_date ?? "—"}</p></div>
          <div><p className="text-muted-foreground text-xs">المشتركون</p><p className="font-medium">{enrollments.length}</p></div>
          <div><p className="text-muted-foreground text-xs">النتائج المسجلة</p><p className="font-medium">{results.length}</p></div>
        </CardContent>
      </Card>

      <h3 className="text-lg font-bold text-secondary">تقييم المشتركين</h3>

      {enrollLoading ? <Skeleton className="h-40" /> : enrollments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>لا يوجد مشتركون في هذا المستوى</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map(enr => {
            const f = getForm(enr.id);
            return (
              <Card key={enr.id} className="border-border/60">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-bold text-secondary text-base">{enr.student_name}</p>
                    {f.grade && <Badge className={cn("text-xs", gradeColor(f.grade))}>{f.grade}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">الدرجة</Label>
                      <Input type="number" value={f.degree} onChange={e => setForm(enr.id, { degree: e.target.value })} placeholder="الدرجة" className="h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">تقييم من 10</Label>
                      <Input type="number" max={10} min={0} step={0.5} value={f.score} onChange={e => setForm(enr.id, { score: e.target.value })} placeholder="0-10" className="h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">التقدير</Label>
                      <Select value={f.grade || "none"} onValueChange={v => setForm(enr.id, { grade: v === "none" ? "" : v })}>
                        <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="التقدير" /></SelectTrigger>
                        <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">مقدار الحفظ</Label>
                      <Input value={f.memorization_amount} onChange={e => setForm(enr.id, { memorization_amount: e.target.value })} placeholder="مقدار الحفظ" className="h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">مقدار المراجعة</Label>
                      <Input value={f.revision_amount} onChange={e => setForm(enr.id, { revision_amount: e.target.value })} placeholder="مقدار المراجعة" className="h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">ملاحظات</Label>
                      <Input value={f.notes} onChange={e => setForm(enr.id, { notes: e.target.value })} placeholder="ملاحظات تفصيلية" className="h-8 text-sm mt-1" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={() => handleSave(enr)}>
                      <Save className="h-3.5 w-3.5 ml-1" /> حفظ النتيجة
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

function CompFormModal({ open, onClose, comp, toast }: any) {
  const [form, setForm] = useState({ name: "", description: "", start_date: "", end_date: "", status: "قادمة" });

  const init = () => {
    if (comp) setForm({ name: comp.name ?? "", description: comp.description ?? "", start_date: comp.start_date ?? "", end_date: comp.end_date ?? "", status: comp.status ?? "قادمة" });
    else setForm({ name: "", description: "", start_date: "", end_date: "", status: "قادمة" });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: "اسم المسابقة مطلوب", variant: "destructive" }); return; }
    const data = { name: form.name, description: form.description || undefined, start_date: form.start_date || undefined, end_date: form.end_date || undefined, status: form.status };
    if (comp) { await updateCompetition(comp.id, data); toast({ title: "تم تحديث المسابقة" }); }
    else { await addCompetition(data); toast({ title: "تم إنشاء المسابقة" }); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else init(); }}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={init}>
        <DialogHeader><DialogTitle>{comp ? "تعديل المسابقة" : "مسابقة جديدة"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>اسم المسابقة *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="اسم المسابقة" className="mt-1" />
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تاريخ البداية</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>تاريخ النهاية</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="قادمة">قادمة</SelectItem>
                <SelectItem value="جارية">جارية</SelectItem>
                <SelectItem value="منتهية">منتهية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>{comp ? "حفظ" : "إنشاء"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LevelFormModal({ open, onClose, level, competitionId, toast }: any) {
  const [form, setForm] = useState({ name: "", required_memorization: "", required_revision: "", test_date: "", instructions: "" });

  const init = () => {
    if (level) setForm({ name: level.name ?? "", required_memorization: level.required_memorization ?? "", required_revision: level.required_revision ?? "", test_date: level.test_date ?? "", instructions: level.instructions ?? "" });
    else setForm({ name: "", required_memorization: "", required_revision: "", test_date: "", instructions: "" });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: "اسم المستوى مطلوب", variant: "destructive" }); return; }
    const data = { competition_id: competitionId, name: form.name, required_memorization: form.required_memorization || undefined, required_revision: form.required_revision || undefined, test_date: form.test_date || undefined, instructions: form.instructions || undefined };
    if (level) { await updateCompetitionLevel(level.id, data); toast({ title: "تم تحديث المستوى" }); }
    else { await addCompetitionLevel(data); toast({ title: "تم إضافة المستوى" }); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else init(); }}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={init}>
        <DialogHeader><DialogTitle>{level ? "تعديل المستوى" : "إضافة مستوى"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>اسم المستوى *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="مثال: المستوى الأول" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>المطلوب حفظه</Label>
              <Input value={form.required_memorization} onChange={e => setForm(p => ({...p, required_memorization: e.target.value}))} placeholder="مثال: سورة البقرة" className="mt-1" />
            </div>
            <div>
              <Label>المطلوب مراجعته</Label>
              <Input value={form.required_revision} onChange={e => setForm(p => ({...p, required_revision: e.target.value}))} placeholder="مثال: الجزء الأول" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>موعد الاختبار</Label>
            <Input type="date" value={form.test_date} onChange={e => setForm(p => ({...p, test_date: e.target.value}))} className="mt-1" />
          </div>
          <div>
            <Label>تعليمات المستوى</Label>
            <Textarea value={form.instructions} onChange={e => setForm(p => ({...p, instructions: e.target.value}))} rows={3} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>{level ? "حفظ" : "إضافة"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnrollLevelModal({ level, students, onClose, toast }: any) {
  const { enrollments } = useCompetitionEnrollments(level.id);
  const [search, setSearch] = useState("");
  const enrolledIds = new Set(enrollments.map((e: any) => e.student_id));
  const filtered = students.filter((s: any) => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={true} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>تسجيل في {level.name}</DialogTitle></DialogHeader>
        <Input placeholder="بحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)} className="mt-2" />
        <div className="max-h-72 overflow-y-auto space-y-2 mt-3">
          {filtered.map((s: any) => (
            <div key={s.id} className="flex justify-between items-center p-2 rounded-lg border border-border/50 hover:bg-muted/30">
              <span className="text-sm font-medium">{s.full_name}</span>
              {enrolledIds.has(s.id) ? (
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 text-xs" onClick={async () => {
                  const enr = enrollments.find((e: any) => e.student_id === s.id);
                  if (enr) { await unenrollStudentFromLevel(enr.id); toast({ title: "تم إلغاء التسجيل" }); }
                }}><UserMinus className="h-3 w-3 ml-1" /> إلغاء</Button>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={async () => {
                  await enrollStudentInLevel({ competition_id: level.competition_id, level_id: level.id, level_name: level.name, student_id: s.id, student_name: s.full_name });
                  toast({ title: "تم تسجيل الطالب" });
                }}><UserPlus className="h-3 w-3 ml-1" /> تسجيل</Button>
              )}
            </div>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>إغلاق</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
