import { useState, useEffect, useRef } from "react";
import {
  createBackup, listBackups, deleteBackup, restoreBackup,
  verifyIntegrity, autoFixOrphanedRecords, exportToJson, importFromJson,
  formatSize, AUTO_BACKUP_INTERVAL_MS,
  type BackupMeta, type IntegrityIssue,
} from "@/lib/backup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Download, Upload, RefreshCw, Trash2, CheckCircle, AlertTriangle,
  AlertCircle, Clock, Database, Wrench, Archive, FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BackupPanelProps {
  open: boolean;
  onClose: () => void;
}

export function BackupPanel({ open, onClose }: BackupPanelProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [issues, setIssues] = useState<IntegrityIssue[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [nextBackupIn, setNextBackupIn] = useState(AUTO_BACKUP_INTERVAL_MS / 1000);
  const importRef = useRef<HTMLInputElement>(null);

  const refreshBackups = () => setBackups(listBackups());

  useEffect(() => {
    if (!open) return;
    refreshBackups();

    // Countdown timer
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, AUTO_BACKUP_INTERVAL_MS - (elapsed % AUTO_BACKUP_INTERVAL_MS));
      setNextBackupIn(Math.round(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const meta = await createBackup("يدوي");
      toast({ title: "تم إنشاء النسخة الاحتياطية", description: formatSize(meta.size_bytes) });
      refreshBackups();
    } catch {
      toast({ title: "فشل إنشاء النسخة", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية بهذه النسخة.")) return;
    setIsRestoring(id);
    try {
      const result = await restoreBackup(id);
      if (result.success) {
        toast({ title: "تمت الاستعادة بنجاح", description: result.message });
      } else {
        toast({ title: "فشل الاستعادة", description: result.message, variant: "destructive" });
      }
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("حذف هذه النسخة الاحتياطية؟")) return;
    deleteBackup(id);
    refreshBackups();
    toast({ title: "تم الحذف" });
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const found = await verifyIntegrity();
      setIssues(found);
      if (found.length === 0) toast({ title: "لا توجد مشاكل — البيانات سليمة" });
      else toast({ title: `تم اكتشاف ${found.length} مشكلة`, variant: found.some(i => i.severity === "error") ? "destructive" : "default" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFix = async () => {
    setIsFixing(true);
    try {
      const count = await autoFixOrphanedRecords();
      toast({ title: `تم إصلاح ${count} سجل` });
      setIssues(null);
    } finally {
      setIsFixing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية.")) return;
    const result = await importFromJson(file);
    if (result.success) {
      toast({ title: "تم الاستيراد بنجاح", description: result.message });
      refreshBackups();
    } else {
      toast({ title: "فشل الاستيراد", description: result.message, variant: "destructive" });
    }
    if (importRef.current) importRef.current.value = "";
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-secondary text-xl">
            <Shield className="h-5 w-5 text-primary" />
            إدارة النسخ الاحتياطية وسلامة البيانات
          </DialogTitle>
        </DialogHeader>

        {/* Status Bar */}
        <div className="grid grid-cols-3 gap-3 mt-1">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-green-700">IndexedDB</div>
            <div className="text-xs text-green-600">نشط</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-blue-700">نسخة تلقائية في</div>
            <div className="text-xs text-blue-600 font-mono">{formatCountdown(nextBackupIn)}</div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
            <Archive className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-xs font-medium text-secondary">عدد النسخ</div>
            <div className="text-xs text-primary font-bold">{backups.length}</div>
          </div>
        </div>

        <Tabs defaultValue="backups">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="backups">النسخ الاحتياطية</TabsTrigger>
            <TabsTrigger value="integrity">سلامة البيانات</TabsTrigger>
            <TabsTrigger value="export">استيراد/تصدير</TabsTrigger>
          </TabsList>

          {/* ── BACKUPS TAB ── */}
          <TabsContent value="backups" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">يتم الحفظ تلقائياً كل 5 دقائق. أقصى عدد نسخ محفوظة: 7.</p>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={isCreating}>
                <RefreshCw className={cn("h-3.5 w-3.5 ml-1", isCreating && "animate-spin")} />
                {isCreating ? "جاري الحفظ..." : "نسخة الآن"}
              </Button>
            </div>

            {backups.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <Archive className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>لا توجد نسخ احتياطية بعد</p>
                <p className="text-xs mt-1">ستنشأ أول نسخة تلقائياً بعد 30 ثانية من بدء التشغيل</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((b, i) => (
                  <div key={b.id} className={cn("flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/20 transition-colors", i === 0 && "border-primary/30 bg-primary/5")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary truncate">{b.label}</p>
                        {i === 0 && <Badge className="bg-green-100 text-green-700 text-xs py-0">الأحدث</Badge>}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{new Date(b.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</span>
                        <span>{formatSize(b.size_bytes)}</span>
                        <span>{Object.values(b.counts).reduce((s, v) => s + v, 0)} سجل</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isRestoring === b.id} onClick={() => handleRestore(b.id)}>
                        {isRestoring === b.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : "استعادة"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── INTEGRITY TAB ── */}
          <TabsContent value="integrity" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">فحص سلامة العلاقات بين البيانات واكتشاف السجلات التالفة.</p>
              <div className="flex gap-2">
                {issues && issues.length > 0 && (
                  <Button size="sm" variant="outline" className="text-amber-700 border-amber-400 hover:bg-amber-50 text-xs" onClick={handleFix} disabled={isFixing}>
                    <Wrench className={cn("h-3.5 w-3.5 ml-1", isFixing && "animate-spin")} />
                    {isFixing ? "جاري الإصلاح..." : "إصلاح تلقائي"}
                  </Button>
                )}
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleVerify} disabled={isVerifying}>
                  <Shield className={cn("h-3.5 w-3.5 ml-1", isVerifying && "animate-spin")} />
                  {isVerifying ? "جاري الفحص..." : "فحص الآن"}
                </Button>
              </div>
            </div>

            {isVerifying ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : issues === null ? (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <Database className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>اضغط "فحص الآن" للتحقق من سلامة البيانات</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-10 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-700">جميع البيانات سليمة</p>
                <p className="text-xs text-green-600 mt-1">لا توجد علاقات مكسورة أو سجلات تالفة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((issue, i) => (
                  <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl border text-sm", issue.severity === "error" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}>
                    {issue.severity === "error" ? <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className={cn("font-medium text-xs", issue.severity === "error" ? "text-destructive" : "text-amber-700")}>{issue.table}</p>
                      <p className="text-xs text-muted-foreground">{issue.issue}</p>
                    </div>
                    <Badge variant="outline" className={cn("mr-auto text-xs flex-shrink-0", issue.severity === "error" ? "text-destructive border-destructive/40" : "text-amber-700 border-amber-400")}>
                      {issue.severity === "error" ? "خطأ" : "تحذير"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── EXPORT/IMPORT TAB ── */}
          <TabsContent value="export" className="mt-4 space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  تصدير البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">تصدير جميع بيانات النظام كملف JSON يمكن حفظه على جهازك للنسخ الاحتياطي.</p>
                <Button className="bg-primary hover:bg-primary/90 w-full" onClick={exportToJson}>
                  <FileJson className="h-4 w-4 ml-2" />
                  تصدير كملف JSON
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-amber-600" />
                  استيراد بيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  استيراد بيانات من ملف JSON محفوظ سابقاً.
                  <span className="text-destructive font-medium"> سيتم استبدال البيانات الحالية.</span>
                </p>
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                <Button variant="outline" className="text-amber-700 border-amber-400 hover:bg-amber-50 w-full" onClick={() => importRef.current?.click()}>
                  <Upload className="h-4 w-4 ml-2" />
                  استيراد من ملف JSON
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 space-y-1">
              <p className="font-semibold flex items-center gap-1"><Shield className="h-4 w-4" />نصائح لحماية بياناتك</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside text-blue-700">
                <li>صدّر نسخة JSON يومياً واحفظها في مكان آمن</li>
                <li>البيانات محفوظة تلقائياً في IndexedDB — لا تحتاج إنترنت</li>
                <li>تجنب مسح بيانات المتصفح أو التخزين المحلي</li>
                <li>النسخ الاحتياطية تُحفظ تلقائياً كل 5 دقائق في الـ localStorage</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
