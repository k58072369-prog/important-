import { useState } from "react";
import {
  useTrash,
  restoreStudent, permanentDeleteStudent,
  restoreTeacher, permanentDeleteTeacher,
  restoreCircle, permanentDeleteCircle,
  restoreInvoice, permanentDeleteInvoice,
  restoreExpense, permanentDeleteExpense,
  restoreCourse, permanentDeleteCourse,
  restoreCompetition, permanentDeleteCompetition,
} from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, RotateCcw, AlertTriangle, Users, GraduationCap, CircleDot, Banknote, BookOpen, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SafeDeleteDialog } from "@/components/safe-delete-dialog";

type TrashItem = {
  id: string;
  name: string;
  type: string;
  deleted_at: string;
  extra?: string;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "طالب":      { icon: Users,         color: "text-blue-600",  label: "طالب" },
  "معلم":      { icon: GraduationCap, color: "text-emerald-600", label: "معلم" },
  "حلقة":      { icon: CircleDot,     color: "text-amber-600", label: "حلقة" },
  "فاتورة":    { icon: Banknote,      color: "text-purple-600", label: "فاتورة" },
  "مصروف":     { icon: Banknote,      color: "text-red-600",   label: "مصروف" },
  "دورة":      { icon: BookOpen,      color: "text-cyan-600",  label: "دورة" },
  "مسابقة":    { icon: Trophy,        color: "text-rose-600",  label: "مسابقة" },
};

export default function Trash() {
  const { trash, loading } = useTrash();
  const { toast } = useToast();
  const [permanentTarget, setPermanentTarget] = useState<{ id: string; name: string; type: string } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="text-center space-y-2">
          <Trash2 className="h-12 w-12 mx-auto opacity-30" />
          <p>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  const allItems: TrashItem[] = [
    ...(trash?.students ?? []).map(s => ({ id: s.id, name: s.full_name, type: "طالب", deleted_at: s.deleted_at!, extra: s.circle_name })),
    ...(trash?.teachers ?? []).map(t => ({ id: t.id, name: t.full_name, type: "معلم", deleted_at: t.deleted_at!, extra: t.phone })),
    ...(trash?.circles  ?? []).map(c => ({ id: c.id, name: c.name, type: "حلقة", deleted_at: c.deleted_at!, extra: c.teacher_name })),
    ...(trash?.invoices ?? []).map(i => ({ id: i.id, name: `${i.student_name} — ${i.month}`, type: "فاتورة", deleted_at: i.deleted_at!, extra: `${i.amount} ج.م` })),
    ...(trash?.expenses ?? []).map(e => ({ id: e.id, name: e.name ?? e.category, type: "مصروف", deleted_at: e.deleted_at!, extra: `${e.amount} ج.م` })),
    ...(trash?.courses  ?? []).map(c => ({ id: c.id, name: c.name, type: "دورة", deleted_at: c.deleted_at!, extra: c.teacher_name })),
    ...(trash?.competitions ?? []).map(c => ({ id: c.id, name: c.name, type: "مسابقة", deleted_at: c.deleted_at! })),
  ].sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));

  const byType: Record<string, TrashItem[]> = {};
  for (const item of allItems) {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  }

  const handleRestore = async (item: TrashItem) => {
    try {
      switch (item.type) {
        case "طالب":     await restoreStudent(item.id); break;
        case "معلم":     await restoreTeacher(item.id); break;
        case "حلقة":     await restoreCircle(item.id); break;
        case "فاتورة":   await restoreInvoice(item.id); break;
        case "مصروف":    await restoreExpense(item.id); break;
        case "دورة":     await restoreCourse(item.id); break;
        case "مسابقة":   await restoreCompetition(item.id); break;
      }
      toast({ title: `تمت استعادة ${item.type} "${item.name}" بنجاح` });
    } catch {
      toast({ title: "حدث خطأ أثناء الاستعادة", variant: "destructive" });
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentTarget) return;
    try {
      switch (permanentTarget.type) {
        case "طالب":     await permanentDeleteStudent(permanentTarget.id); break;
        case "معلم":     await permanentDeleteTeacher(permanentTarget.id); break;
        case "حلقة":     await permanentDeleteCircle(permanentTarget.id); break;
        case "فاتورة":   await permanentDeleteInvoice(permanentTarget.id); break;
        case "مصروف":    await permanentDeleteExpense(permanentTarget.id); break;
        case "دورة":     await permanentDeleteCourse(permanentTarget.id); break;
        case "مسابقة":   await permanentDeleteCompetition(permanentTarget.id); break;
      }
      toast({ title: `تم حذف "${permanentTarget.name}" نهائياً` });
      setPermanentTarget(null);
    } catch {
      toast({ title: "حدث خطأ أثناء الحذف النهائي", variant: "destructive" });
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  const renderItems = (items: TrashItem[]) => {
    if (!items.length) return (
      <div className="text-center py-12 text-muted-foreground">
        <Trash2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>لا يوجد عناصر محذوفة</p>
      </div>
    );

    return (
      <div className="divide-y divide-border">
        {items.map(item => {
          const cfg = TYPE_CONFIG[item.type] ?? { icon: Trash2, color: "text-muted-foreground", label: item.type };
          const Icon = cfg.icon;
          return (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-3 px-4 hover:bg-muted/30 transition-colors">
              <div className={`p-2 rounded-full bg-muted/50 ${cfg.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-secondary truncate">{item.name}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{item.type}</Badge>
                  {item.extra && <span className="text-xs text-muted-foreground truncate">{item.extra}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatDate(item.deleted_at)}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm" variant="outline"
                  className="text-primary hover:bg-primary/10 hover:text-primary border-primary/30 text-xs"
                  onClick={() => handleRestore(item)}
                >
                  <RotateCcw className="h-3 w-3 ml-1" />
                  استعادة
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 text-xs"
                  onClick={() => setPermanentTarget({ id: item.id, name: item.name, type: item.type })}
                >
                  <Trash2 className="h-3 w-3 ml-1" />
                  حذف نهائي
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const typeKeys = Object.keys(byType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <Trash2 className="h-8 w-8 text-destructive" />
          سلة المحذوفات
        </h1>
        <p className="text-muted-foreground mt-1">جميع العناصر المحذوفة — يمكن استعادتها أو حذفها نهائياً</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gold-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-destructive">{allItems.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي المحذوفات</div>
          </CardContent>
        </Card>
        {typeKeys.slice(0, 3).map(t => (
          <Card key={t} className="border-gold-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-2xl font-bold ${TYPE_CONFIG[t]?.color ?? "text-secondary"}`}>{byType[t].length}</div>
              <div className="text-sm text-muted-foreground">{t}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allItems.length === 0 ? (
        <Card className="border-gold-500/20">
          <CardContent className="py-20 text-center text-muted-foreground">
            <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">سلة المحذوفات فارغة</p>
            <p className="text-sm mt-2">جميع العناصر سليمة، لا توجد عناصر محذوفة</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gold-500/20 overflow-hidden">
          <Tabs defaultValue="all" dir="rtl">
            <div className="p-4 border-b border-border overflow-x-auto">
              <TabsList className="gap-1 flex-wrap h-auto">
                <TabsTrigger value="all" className="text-sm">
                  الكل ({allItems.length})
                </TabsTrigger>
                {typeKeys.map(t => (
                  <TabsTrigger key={t} value={t} className="text-sm">
                    {t} ({byType[t].length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="all" className="m-0">
              {renderItems(allItems)}
            </TabsContent>
            {typeKeys.map(t => (
              <TabsContent key={t} value={t} className="m-0">
                {renderItems(byType[t])}
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-700">
          <p className="font-semibold mb-1">تنبيه مهم</p>
          <p>الحذف النهائي لا يمكن التراجع عنه. تأكد من أنك لا تحتاج إلى هذه البيانات قبل حذفها نهائياً.</p>
        </div>
      </div>

      <SafeDeleteDialog
        open={!!permanentTarget}
        onClose={() => setPermanentTarget(null)}
        onConfirm={handlePermanentDelete}
        itemName={permanentTarget?.name ?? ""}
        itemType={permanentTarget?.type ?? ""}
        requireTyping
        impact="سيتم حذف هذا العنصر نهائياً من قاعدة البيانات ولا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
}
