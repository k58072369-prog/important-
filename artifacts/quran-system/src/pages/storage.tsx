import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileJson,
  HardDrive,
  Activity,
  Trash2,
  Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function useStorageStats() {
  return useQuery({ queryKey: ["storage-stats"], queryFn: () => apiFetch("/storage/stats"), refetchInterval: 30_000 });
}

function useBackups() {
  return useQuery({ queryKey: ["storage-backups"], queryFn: () => apiFetch("/storage/backups") });
}

function useAuditLogs(limit = 50) {
  return useQuery({ queryKey: ["audit-logs", limit], queryFn: () => apiFetch(`/storage/logs?limit=${limit}`) });
}

function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/storage/backup", { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["storage-stats"] }); qc.invalidateQueries({ queryKey: ["storage-backups"] }); },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

function StatCard({ title, value, sub, icon: Icon, color = "text-primary" }: {
  title: string; value: string | number; sub?: string; icon: any; color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TableRow({ label, count, color = "text-foreground" }: { label: string; count: number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold text-sm ${color}`}>{count.toLocaleString()} سجل</span>
    </div>
  );
}

// ─── Restore Modal ────────────────────────────────────────────────────────────

function RestoreModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const restore = useMutation({
    mutationFn: (data: any) => apiFetch("/storage/restore", { method: "POST", body: JSON.stringify({ data }) }),
    onSuccess: () => {
      toast({ title: "✅ تمت استعادة البيانات بنجاح" });
      qc.invalidateQueries({ queryKey: ["storage-stats"] });
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (e: any) => toast({ title: "خطأ في الاستعادة: " + e.message, variant: "destructive" }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target?.result as string);
        if (!obj.data) { setError("ملف النسخة الاحتياطية غير صحيح"); return; }
        setParsed(obj);
        setError("");
      } catch {
        setError("ملف JSON غير صالح");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader><DialogTitle>استعادة من نسخة احتياطية</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ سيتم استبدال البيانات الحالية بالبيانات المستعادة. سيتم إنشاء نسخة احتياطية تلقائياً قبل الاستعادة.
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">اختر ملف النسخة الاحتياطية (.json)</label>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="block w-full text-sm border rounded-lg p-2" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {parsed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ تم قراءة الملف — تاريخ النسخة: {formatDate(parsed.created_at)}
              <br />المحتوى: {Object.entries(parsed.data).map(([k, v]) => `${k}: ${(v as any[]).length}`).join(" | ")}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button disabled={!parsed || restore.isPending} onClick={() => restore.mutate(parsed.data)} className="bg-yellow-600 hover:bg-yellow-700">
              {restore.isPending ? "جارٍ الاستعادة..." : "استعادة البيانات"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Audit Log Modal ──────────────────────────────────────────────────────────

function AuditModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: logs, isLoading } = useAuditLogs(100);

  const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    create: { label: "إنشاء", color: "bg-green-100 text-green-800" },
    update: { label: "تعديل", color: "bg-blue-100 text-blue-800" },
    delete: { label: "حذف", color: "bg-red-100 text-red-800" },
    backup: { label: "نسخ احتياطي", color: "bg-purple-100 text-purple-800" },
    restore: { label: "استعادة", color: "bg-yellow-100 text-yellow-800" },
  };

  const ENTITY_LABELS: Record<string, string> = {
    student: "طالب", teacher: "معلم", circle: "حلقة", session: "حصة",
    expense: "مصروف", invoice: "فاتورة", income: "وارد", payroll: "راتب",
    system: "النظام", database: "قاعدة البيانات",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle>سجل العمليات (Audit Log)</DialogTitle></DialogHeader>
        {isLoading ? <Skeleton className="h-60" /> : (
          <div className="space-y-1">
            {(logs ?? []).length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد عمليات مسجّلة</p>}
            {(logs ?? []).map((log: any) => {
              const a = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-800" };
              return (
                <div key={log.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.color}`}>{a.label}</span>
                    <span className="font-medium">{ENTITY_LABELS[log.entity] ?? log.entity}</span>
                    {log.entity_name && <span className="text-muted-foreground">— {log.entity_name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {log.status === "success"
                      ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    }
                    <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Storage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStorageStats();
  const { data: backups, isLoading: backupsLoading } = useBackups();
  const createBackup = useCreateBackup();
  const { toast } = useToast();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const handleBackup = async () => {
    createBackup.mutate(undefined, {
      onSuccess: (res: any) => {
        toast({ title: "✅ تم إنشاء النسخة الاحتياطية", description: `${res.filename} (${formatBytes(res.sizeBytes)})` });
      },
      onError: () => toast({ title: "خطأ في إنشاء النسخة الاحتياطية", variant: "destructive" }),
    });
  };

  const handleDownload = (filename: string) => {
    window.open(`${BASE}/api/storage/backup/download/${filename}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة التخزين</h1>
          <p className="text-muted-foreground text-sm mt-1">قاعدة بيانات محلية · نسخ احتياطي تلقائي · سجل العمليات</p>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-400 gap-1">
          <CheckCircle className="h-3 w-3" />
          {stats?.storage_status === "healthy" ? "النظام سليم" : "جارٍ الفحص..."}
        </Badge>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="إجمالي السجلات" value={(stats?.total_records ?? 0).toLocaleString()} sub="في قاعدة البيانات" icon={Database} color="text-primary" />
          <StatCard title="نوع قاعدة البيانات" value={stats?.db_type ?? "PostgreSQL"} sub="محلية — بدون إنترنت" icon={HardDrive} color="text-violet-600" />
          <StatCard title="ملفات النسخ الاحتياطي" value={stats?.backup_files_count ?? 0} sub="آخر 10 نسخ محفوظة" icon={FileJson} color="text-blue-600" />
          <StatCard title="سجلات العمليات" value={(stats?.audit_logs_count ?? 0).toLocaleString()} sub="كل العمليات مسجّلة" icon={Activity} color="text-amber-600" />
        </div>
      )}

      {/* System Info Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { icon: Shield, label: "الحماية", value: "PostgreSQL ACID", color: "text-green-700" },
              { icon: Clock, label: "النسخ الاحتياطي", value: "تلقائي كل 6 ساعات", color: "text-blue-700" },
              { icon: CheckCircle, label: "عمل بدون إنترنت", value: "نعم — محلي 100%", color: "text-green-700" },
              { icon: RefreshCw, label: "آخر نسخة", value: stats?.last_backup ? formatDate(stats.last_backup.createdAt) : "لم يتم بعد", color: "text-violet-700" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <div><div className="text-muted-foreground text-xs">{label}</div><div className={`font-medium ${color}`}>{value}</div></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Tables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">محتوى قاعدة البيانات</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchStats()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />تحديث
            </Button>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-48" /> : (
              <div>
                <TableRow label="الطلاب" count={stats?.tables?.students ?? 0} color="text-blue-600" />
                <TableRow label="المعلمون" count={stats?.tables?.teachers ?? 0} color="text-violet-600" />
                <TableRow label="الحلقات" count={stats?.tables?.circles ?? 0} color="text-green-600" />
                <TableRow label="الحصص" count={stats?.tables?.sessions ?? 0} color="text-amber-600" />
                <TableRow label="الفواتير" count={stats?.tables?.invoices ?? 0} color="text-primary" />
                <TableRow label="المصروفات" count={stats?.tables?.expenses ?? 0} color="text-red-600" />
                <TableRow label="الواردات" count={stats?.tables?.income ?? 0} color="text-green-600" />
                <TableRow label="الرواتب" count={stats?.tables?.payroll ?? 0} color="text-violet-600" />
                <TableRow label="المعاملات المالية" count={stats?.tables?.transactions ?? 0} color="text-primary" />
                <div className="flex justify-between items-center pt-2 mt-1 border-t">
                  <span className="text-sm font-semibold">الإجمالي</span>
                  <span className="font-bold text-primary">{(stats?.total_records ?? 0).toLocaleString()} سجل</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">النسخ الاحتياطي</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRestoreOpen(true)} className="gap-1 h-7 text-xs">
                <Upload className="h-3 w-3" />استعادة
              </Button>
              <Button size="sm" onClick={handleBackup} disabled={createBackup.isPending} className="gap-1 h-7 text-xs">
                <Download className="h-3 w-3" />{createBackup.isPending ? "جارٍ..." : "نسخة الآن"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {backupsLoading ? <Skeleton className="h-48" /> : (
              <div className="space-y-2">
                {(backups ?? []).length === 0 && (
                  <div className="text-center py-8">
                    <FileJson className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">لا توجد نسخ احتياطية بعد</p>
                    <p className="text-xs text-muted-foreground">سيتم إنشاء نسخة احتياطية تلقائياً في 30 ثانية من تشغيل الخادم</p>
                  </div>
                )}
                {(backups ?? []).slice(0, 6).map((b: any) => (
                  <div key={b.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="text-xs font-medium font-mono">{b.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(b.createdAt)} · {formatBytes(Number(b.sizeBytes ?? 0))} · {Number(b.recordCount ?? 0)} سجل
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${b.triggeredBy === "auto" ? "bg-blue-100 text-blue-700" : b.triggeredBy === "pre-restore" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {b.triggeredBy === "auto" ? "تلقائي" : b.triggeredBy === "pre-restore" ? "قبل الاستعادة" : "يدوي"}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(b.filename)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage Directory Structure */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">هيكل التخزين المحلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { dir: "/storage/backup/", desc: "ملفات النسخ الاحتياطي JSON", icon: FileJson, color: "text-blue-600", bg: "bg-blue-50", count: `${stats?.backup_files_count ?? 0} ملف` },
              { dir: "/storage/logs/", desc: "سجلات النظام والأخطاء", icon: Activity, color: "text-amber-600", bg: "bg-amber-50", count: `${(stats?.audit_logs_count ?? 0)} عملية` },
              { dir: "/storage/cache/", desc: "بيانات مؤقتة وحالة النظام", icon: RefreshCw, color: "text-green-600", bg: "bg-green-50", count: "temp_data.json" },
            ].map(({ dir, desc, icon: Icon, color, bg, count }) => (
              <div key={dir} className={`${bg} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="font-mono text-xs font-medium">{dir}</span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
                <p className={`text-sm font-bold mt-1 ${color}`}>{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => setAuditOpen(true)}>
          <Eye className="h-4 w-4" />عرض سجل العمليات
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setRestoreOpen(true)}>
          <Upload className="h-4 w-4" />استعادة من ملف
        </Button>
        <Button className="gap-2" onClick={handleBackup} disabled={createBackup.isPending}>
          <Download className="h-4 w-4" />{createBackup.isPending ? "جارٍ إنشاء النسخة..." : "إنشاء نسخة احتياطية الآن"}
        </Button>
      </div>

      <RestoreModal open={restoreOpen} onOpenChange={setRestoreOpen} />
      <AuditModal open={auditOpen} onOpenChange={setAuditOpen} />
    </div>
  );
}
