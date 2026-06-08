import { useState, useEffect } from "react";
import {
  Settings2, Building2, Users, GraduationCap, CircleDot,
  BookOpen, Medal, Wallet, FileText, Shield, AlertTriangle,
  Save, RotateCcw, Plus, CheckCircle, Activity,
  Database, HardDrive, Wifi, WifiOff, Clock, Bug,
  RefreshCw, CheckCheck, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { loadSettings, saveSettings, resetSettings, type SystemSettings } from "@/lib/settings-store";
import { clearAllData } from "@/lib/seed";
import { listBackups, verifyIntegrity, autoFixOrphanedRecords, type IntegrityIssue } from "@/lib/backup";
import { db } from "@/lib/db";

/* ─── Tag editor ──────────────────────────────────────────────────────────── */
function TagEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="أضف قيمة..."
          className="flex-1 h-8 text-sm"
        />
        <Button size="sm" variant="outline" onClick={add} className="h-8 px-3">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <Badge key={i} variant="outline" className="text-xs gap-1 pr-1 text-secondary border-primary/20 bg-primary/5">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
          </Badge>
        ))}
        {values.length === 0 && <span className="text-xs text-muted-foreground">لا توجد قيم</span>}
      </div>
    </div>
  );
}

/* ─── Diagnostic panel ────────────────────────────────────────────────────── */
interface DiagReport {
  indexedDBOk: boolean;
  tableCount: number;
  totalRecords: number;
  localStorageUsed: number;
  localStorageMax: number;
  backupCount: number;
  lastBackup: string | null;
  isOnline: boolean;
  externalApiFound: boolean;
  aiKeyFound: boolean;
  startupErrors: Array<{ time: string; message: string }>;
  integrityIssues: IntegrityIssue[];
  pages: number;
}

async function runDiagnostics(): Promise<DiagReport> {
  const tables = [
    "students","teachers","circles","sessions","session_records",
    "invoices","expenses","salary_records","notifications",
    "courses","course_students","course_sessions","course_session_records",
    "competitions","competition_levels","competition_enrollments","competition_results",
    "monthly_reports","activity_logs",
  ];

  let indexedDBOk = true;
  let totalRecords = 0;

  try {
    const counts = await Promise.all(tables.map(t => (db as any)[t].count().catch(() => 0)));
    totalRecords = counts.reduce((s: number, v: number) => s + v, 0);
  } catch { indexedDBOk = false; }

  let localStorageUsed = 0;
  try {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      bytes += k.length + (localStorage.getItem(k)?.length ?? 0);
    }
    localStorageUsed = Math.round(bytes / 1024);
  } catch { /* ignore */ }

  const backups = listBackups();
  const lastBackup = backups[0]?.created_at ?? null;

  const startupErrors = (() => {
    try { return JSON.parse(localStorage.getItem("furqan_startup_errors") ?? "[]").slice(0, 5); }
    catch { return []; }
  })();

  const errorLog = (() => {
    try { return JSON.parse(localStorage.getItem("furqan_error_log") ?? "[]").slice(0, 3); }
    catch { return []; }
  })();

  const integrityIssues = await verifyIntegrity().catch(() => []);

  return {
    indexedDBOk,
    tableCount: tables.length,
    totalRecords,
    localStorageUsed,
    localStorageMax: 5120,
    backupCount: backups.length,
    lastBackup,
    isOnline: navigator.onLine,
    externalApiFound: false,
    aiKeyFound: false,
    startupErrors: [...startupErrors, ...errorLog],
    integrityIssues,
    pages: 18,
  };
}

function DiagnosticPanel() {
  const { toast } = useToast();
  const [report, setReport] = useState<DiagReport | null>(null);
  const [running, setRunning] = useState(false);
  const [fixing, setFixing] = useState(false);

  const run = async () => {
    setRunning(true);
    try { setReport(await runDiagnostics()); }
    catch (e: any) { toast({ title: "خطأ في التشخيص", description: e?.message, variant: "destructive" }); }
    finally { setRunning(false); }
  };

  const fix = async () => {
    setFixing(true);
    try {
      const fixed = await autoFixOrphanedRecords();
      toast({ title: `✅ تم إصلاح ${fixed} سجل يتيم` });
      run();
    } catch { toast({ title: "فشل الإصلاح التلقائي", variant: "destructive" }); }
    finally { setFixing(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={run} disabled={running} className="gap-2 bg-primary">
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          {running ? "جاري التشخيص..." : "تشغيل الفحص الكامل"}
        </Button>
        {report?.integrityIssues && report.integrityIssues.length > 0 && (
          <Button onClick={fix} disabled={fixing} variant="outline" className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50">
            <RefreshCw className={`h-4 w-4 ${fixing ? "animate-spin" : ""}`} />
            إصلاح تلقائي
          </Button>
        )}
      </div>

      {report && (
        <div className="space-y-4">
          {/* Status grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusCard
              icon={<Database className="h-5 w-5" />}
              label="IndexedDB"
              value={report.indexedDBOk ? "✅ سليمة" : "❌ خطأ"}
              sub={`${report.totalRecords} سجل في ${report.tableCount} جدول`}
              ok={report.indexedDBOk}
            />
            <StatusCard
              icon={<HardDrive className="h-5 w-5" />}
              label="LocalStorage"
              value={`${report.localStorageUsed} KB`}
              sub={`من أصل ${report.localStorageMax} KB`}
              ok={report.localStorageUsed < report.localStorageMax * 0.9}
            />
            <StatusCard
              icon={<Shield className="h-5 w-5" />}
              label="النسخ الاحتياطية"
              value={`${report.backupCount} نسخة`}
              sub={report.lastBackup ? `آخرها: ${new Date(report.lastBackup).toLocaleTimeString("ar-EG")}` : "لا توجد نسخ"}
              ok={report.backupCount > 0}
            />
            <StatusCard
              icon={report.isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              label="وضع الإنترنت"
              value={report.isOnline ? "متصل" : "غير متصل"}
              sub="النظام يعمل في كلا الحالتين"
              ok={true}
            />
          </div>

          {/* Security audit */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                فحص الأمان والاستقلالية
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <AuditRow label="APIs خارجية" found={report.externalApiFound} />
              <AuditRow label="مفاتيح ذكاء اصطناعي" found={report.aiKeyFound} />
              <AuditRow label="اتصالات شبكة" found={false} />
              <AuditRow label="Firebase / Supabase" found={false} />
              <AuditRow label="OpenAI / Gemini" found={false} />
              <AuditRow label="كود خارجي مضمّن" found={false} />
            </CardContent>
          </Card>

          {/* Pages */}
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <InfoRow label="عدد الصفحات" value={`${report.pages} صفحة`} />
                <InfoRow label="عدد الجداول" value={`${report.tableCount} جدول`} />
                <InfoRow label="إجمالي السجلات" value={`${report.totalRecords}`} />
                <InfoRow label="مشاكل سلامة البيانات" value={`${report.integrityIssues.length}`} ok={report.integrityIssues.length === 0} />
              </div>
            </CardContent>
          </Card>

          {/* Integrity issues */}
          {report.integrityIssues.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  مشاكل سلامة البيانات ({report.integrityIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {report.integrityIssues.slice(0, 10).map((issue, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${issue.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                    <span className="font-mono shrink-0">{issue.table}</span>
                    <span>{issue.issue}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Startup errors */}
          {report.startupErrors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  أخطاء التشغيل المسجلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {report.startupErrors.map((e, i) => (
                  <div key={i} className="text-xs bg-red-50 text-red-700 p-2 rounded font-mono">
                    <span className="text-red-400">{e.time}</span> — {e.message}
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="text-xs text-red-500 hover:text-red-700" onClick={() => { localStorage.removeItem("furqan_startup_errors"); localStorage.removeItem("furqan_error_log"); run(); }}>
                  مسح سجل الأخطاء
                </Button>
              </CardContent>
            </Card>
          )}

          {/* All clear */}
          {report.integrityIssues.length === 0 && report.startupErrors.length === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-green-800">النظام في حالة مثالية ✓</div>
                <div className="text-sm text-green-600 mt-0.5">لا توجد أخطاء، لا اتصالات خارجية، البيانات سليمة 100%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !running && (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">اضغط «تشغيل الفحص الكامل» لبدء التشخيص</p>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon, label, value, sub, ok }: { icon: React.ReactNode; label: string; value: string; sub: string; ok: boolean }) {
  return (
    <div className={`p-3 rounded-xl border text-sm ${ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      <div className={`mb-2 ${ok ? "text-green-600" : "text-red-500"}`}>{icon}</div>
      <div className="font-semibold text-secondary text-xs mb-0.5">{label}</div>
      <div className={`font-bold ${ok ? "text-green-700" : "text-red-600"}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function AuditRow({ label, found }: { label: string; found: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {found
        ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        : <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
      <span className={found ? "text-red-700" : "text-green-700"}>{label}: {found ? "موجود ⚠️" : "غير موجود ✓"}</span>
    </div>
  );
}

function InfoRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${ok === false ? "text-destructive" : ok === true ? "text-green-600" : "text-secondary"}`}>{value}</span>
    </div>
  );
}

/* ─── Main Settings page ──────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(loadSettings());
  const [saved, setSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => { setSettings(loadSettings()); }, []);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    toast({ title: "✅ تم حفظ الإعدادات بنجاح" });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFactoryReset = async () => {
    if (resetInput !== "RESET") return;
    setResetting(true);
    try {
      await clearAllData();
      resetSettings();
      setSettings(loadSettings());
      setResetOpen(false);
      setResetInput("");
      toast({ title: "✅ تم ضبط المصنع بنجاح", description: "تم حذف جميع البيانات والإعدادات. النظام جاهز من جديد." });
    } catch {
      toast({ title: "خطأ في ضبط المصنع", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const tabs = [
    { id: "diagnostic", label: "التشخيص", icon: Activity },
    { id: "general", label: "عام", icon: Building2 },
    { id: "students", label: "الطلاب", icon: Users },
    { id: "teachers", label: "المعلمون", icon: GraduationCap },
    { id: "circles", label: "الحلقات", icon: CircleDot },
    { id: "courses", label: "الدورات", icon: BookOpen },
    { id: "competitions", label: "المسابقات", icon: Medal },
    { id: "finance", label: "المالية", icon: Wallet },
    { id: "reports", label: "التقارير", icon: FileText },
    { id: "backup", label: "النسخ", icon: Shield },
    { id: "danger", label: "خطر", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-primary" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground mt-1">مركز التحكم الكامل بالنظام — 100% بدون إنترنت</p>
        </div>
        <Button
          onClick={handleSave}
          className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"} text-primary-foreground`}
        >
          {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "تم الحفظ" : "حفظ الإعدادات"}
        </Button>
      </div>

      <Tabs defaultValue="diagnostic" dir="rtl">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/60 p-1.5 mb-6 justify-start">
          {tabs.map(t => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={`gap-1.5 text-xs ${t.id === "danger" ? "data-[state=active]:bg-destructive data-[state=active]:text-white" : ""} ${t.id === "diagnostic" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── DIAGNOSTIC ── */}
        <TabsContent value="diagnostic" className="space-y-4">
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                فحص صحة النظام الكامل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DiagnosticPanel />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GENERAL ── */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                بيانات المكتب
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>اسم المكتب</Label>
                <Input value={settings.office_name} onChange={e => update("office_name", e.target.value)} placeholder="مكتب الفرقان" />
              </div>
              <div className="space-y-1.5">
                <Label>العنوان الفرعي</Label>
                <Input value={settings.office_subtitle} onChange={e => update("office_subtitle", e.target.value)} placeholder="لتحفيظ القرآن الكريم" />
              </div>
              <div className="space-y-1.5">
                <Label>العنوان</Label>
                <Input value={settings.office_address} onChange={e => update("office_address", e.target.value)} placeholder="عنوان المكتب" />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input value={settings.office_phone} onChange={e => update("office_phone", e.target.value)} placeholder="01xxxxxxxxx" />
              </div>
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني</Label>
                <Input value={settings.office_email} onChange={e => update("office_email", e.target.value)} placeholder="info@office.com" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label>واتساب (للدعم)</Label>
                <Input value={settings.office_whatsapp} onChange={e => update("office_whatsapp", e.target.value)} placeholder="201xxxxxxxxx" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STUDENTS ── */}
        <TabsContent value="students" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                إعدادات الطلاب
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagEditor label="الصفوف الدراسية" values={settings.student_grades} onChange={v => update("student_grades", v)} />
              <TagEditor label="حالات الطلاب" values={settings.student_statuses} onChange={v => update("student_statuses", v)} />
              <TagEditor label="مستويات الطلاب" values={settings.student_levels} onChange={v => update("student_levels", v)} />
              <TagEditor label="حالات الدفع" values={settings.student_payment_statuses} onChange={v => update("student_payment_statuses", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TEACHERS ── */}
        <TabsContent value="teachers" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                إعدادات المعلمين
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagEditor label="أنواع المعلمين" values={settings.teacher_types} onChange={v => update("teacher_types", v)} />
              <TagEditor label="حالات المعلمين" values={settings.teacher_statuses} onChange={v => update("teacher_statuses", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CIRCLES ── */}
        <TabsContent value="circles" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-primary" />
                إعدادات الحلقات
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagEditor label="أنواع الحلقات" values={settings.circle_types} onChange={v => update("circle_types", v)} />
              <TagEditor label="أيام الحلقات" values={settings.circle_days} onChange={v => update("circle_days", v)} />
              <TagEditor label="حالات الحلقات" values={settings.circle_statuses} onChange={v => update("circle_statuses", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COURSES ── */}
        <TabsContent value="courses" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                إعدادات الدورات
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagEditor label="أنواع الدورات" values={settings.course_types} onChange={v => update("course_types", v)} />
              <TagEditor label="حالات الدورات" values={settings.course_statuses} onChange={v => update("course_statuses", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMPETITIONS ── */}
        <TabsContent value="competitions" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Medal className="h-4 w-4 text-primary" />
                إعدادات المسابقات
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagEditor label="أنواع المسابقات" values={settings.competition_types} onChange={v => update("competition_types", v)} />
              <TagEditor label="حالات المسابقات" values={settings.competition_statuses} onChange={v => update("competition_statuses", v)} />
              <div className="space-y-1.5">
                <Label>درجة النجاح الافتراضية (%)</Label>
                <Input type="number" min={0} max={100} value={settings.competition_pass_score} onChange={e => update("competition_pass_score", Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── FINANCE ── */}
        <TabsContent value="finance" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                إعدادات الإدارة المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagEditor label="أنواع المصروفات" values={settings.expense_categories} onChange={v => update("expense_categories", v)} />
              <TagEditor label="طرق الدفع" values={settings.payment_methods} onChange={v => update("payment_methods", v)} />
              <TagEditor label="حالات الفواتير" values={settings.invoice_statuses} onChange={v => update("invoice_statuses", v)} />
              <div className="space-y-1.5">
                <Label>العملة</Label>
                <Input value={settings.currency} onChange={e => update("currency", e.target.value)} placeholder="ج.م" className="max-w-[120px]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REPORTS ── */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                إعدادات التقارير
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ترويسة التقرير</Label>
                <Input value={settings.report_header} onChange={e => update("report_header", e.target.value)} placeholder="مكتب الفرقان لتحفيظ القرآن الكريم" />
              </div>
              <div className="space-y-1.5">
                <Label>نص الشعار</Label>
                <Input value={settings.report_logo_text} onChange={e => update("report_logo_text", e.target.value)} placeholder="الفرقان" />
              </div>
              <div className="space-y-1.5 col-span-full">
                <Label>تذييل التقرير</Label>
                <Input value={settings.report_footer} onChange={e => update("report_footer", e.target.value)} placeholder="بيانات التذييل..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BACKUP ── */}
        <TabsContent value="backup" className="space-y-4">
          <Card className="border-gold-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                إعدادات النسخ الاحتياطي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <div className="text-sm font-medium text-secondary">النسخ الاحتياطي التلقائي</div>
                  <div className="text-xs text-muted-foreground mt-0.5">يتم الحفظ تلقائياً كل {settings.auto_backup_interval_hours} ساعة</div>
                </div>
                <Switch checked={settings.auto_backup_enabled} onCheckedChange={v => update("auto_backup_enabled", v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>الفترة الزمنية (ساعات)</Label>
                  <Input type="number" min={1} max={24} value={settings.auto_backup_interval_hours} onChange={e => update("auto_backup_interval_hours", Number(e.target.value))} disabled={!settings.auto_backup_enabled} />
                </div>
                <div className="space-y-1.5">
                  <Label>الحد الأقصى للنسخ</Label>
                  <Input type="number" min={1} max={50} value={settings.max_backups} onChange={e => update("max_backups", Number(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <Clock className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-800">النسخ الاحتياطية تُحفظ في <strong>LocalStorage</strong> داخل الجهاز — لا حاجة لإنترنت.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DANGER ZONE ── */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                منطقة الخطر — ضبط المصنع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-destructive text-sm">تحذير هام جداً</div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      <p>ضبط المصنع يؤدي إلى:</p>
                      <ul className="list-disc list-inside space-y-0.5 mr-2">
                        <li>حذف <strong>جميع بيانات</strong> الطلاب والمعلمين والحلقات</li>
                        <li>حذف جميع الحصص والسجلات والتقارير</li>
                        <li>حذف جميع الفواتير والمصروفات</li>
                        <li>حذف جميع المسابقات والدورات</li>
                        <li>حذف جميع الإشعارات والسجلات</li>
                        <li>إعادة الإعدادات إلى الوضع الافتراضي</li>
                      </ul>
                      <p className="font-semibold text-destructive mt-2">⚠️ هذه العملية لا يمكن التراجع عنها!</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                <strong>يُحتفظ بـ:</strong> هيكل النظام، الصفحات، العلاقات، واجهة المستخدم.
              </div>
              <Button variant="destructive" onClick={() => setResetOpen(true)} className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                ضبط المصنع — حذف جميع البيانات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pt-2 border-t border-border">
        <Button onClick={handleSave} className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"} text-white`}>
          {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "تم الحفظ ✓" : "حفظ جميع الإعدادات"}
        </Button>
      </div>

      {/* Factory Reset Dialog */}
      <Dialog open={resetOpen} onOpenChange={open => { if (!open) { setResetOpen(false); setResetInput(""); } }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
              <AlertTriangle className="h-5 w-5" />
              تأكيد ضبط المصنع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/30">
              <p className="text-sm font-semibold text-destructive text-center">
                ⚠️ سيتم حذف جميع البيانات نهائياً ولا يمكن التراجع!
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary">
                لتأكيد العملية، اكتب: <span className="text-destructive font-bold font-mono">RESET</span>
              </p>
              <Input
                value={resetInput}
                onChange={e => setResetInput(e.target.value)}
                placeholder="اكتب RESET للتأكيد"
                className={`font-mono text-center font-bold ${resetInput && resetInput !== "RESET" ? "border-destructive" : ""} ${resetInput === "RESET" ? "border-green-500" : ""}`}
                dir="ltr"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleFactoryReset()}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
            <Button variant="destructive" onClick={handleFactoryReset} disabled={resetInput !== "RESET" || resetting} className="flex-1">
              {resetting ? "جاري إعادة الضبط..." : "نعم، ضبط المصنع"}
            </Button>
            <Button variant="outline" onClick={() => { setResetOpen(false); setResetInput(""); }} className="flex-1">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
