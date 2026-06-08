import { useState, useEffect } from "react";
import {
  Settings2, Building2, Users, GraduationCap, CircleDot,
  BookOpen, Medal, Wallet, FileText, Shield, AlertTriangle,
  Save, RotateCcw, Plus, Trash2, CheckCircle,
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
            <button
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >×</button>
          </Badge>
        ))}
        {values.length === 0 && <span className="text-xs text-muted-foreground">لا توجد قيم</span>}
      </div>
    </div>
  );
}

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
          <p className="text-muted-foreground mt-1">مركز التحكم الكامل بالنظام</p>
        </div>
        <Button
          onClick={handleSave}
          className={`bg-primary hover:bg-primary/90 text-primary-foreground gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "تم الحفظ" : "حفظ الإعدادات"}
        </Button>
      </div>

      <Tabs defaultValue="general" dir="rtl">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/60 p-1.5 mb-6 justify-start">
          {tabs.map(t => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={`gap-1.5 text-xs ${t.id === "danger" ? "data-[state=active]:bg-destructive data-[state=active]:text-white" : ""}`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

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
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.competition_pass_score}
                  onChange={e => update("competition_pass_score", Number(e.target.value))}
                />
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
                  <div className="text-xs text-muted-foreground mt-0.5">يتم الحفظ تلقائياً بشكل دوري</div>
                </div>
                <Switch
                  checked={settings.auto_backup_enabled}
                  onCheckedChange={v => update("auto_backup_enabled", v)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>الفترة الزمنية (ساعات)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={settings.auto_backup_interval_hours}
                    onChange={e => update("auto_backup_interval_hours", Number(e.target.value))}
                    disabled={!settings.auto_backup_enabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>الحد الأقصى للنسخ المحفوظة</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.max_backups}
                    onChange={e => update("max_backups", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
                <strong>ملاحظة:</strong> يمكن إدارة النسخ الاحتياطية وتصديرها واستعادتها من زر «النسخ الاحتياطية» في أسفل القائمة الجانبية.
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

              <Button
                variant="destructive"
                onClick={() => setResetOpen(true)}
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                ضبط المصنع — حذف جميع البيانات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          onClick={handleSave}
          className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"} text-white`}
        >
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
                ⚠️ سيتم حذف جميع البيانات نهائياً ولا يمكن التراجع عن هذا القرار!
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
            <Button
              variant="destructive"
              onClick={handleFactoryReset}
              disabled={resetInput !== "RESET" || resetting}
              className="flex-1"
            >
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
