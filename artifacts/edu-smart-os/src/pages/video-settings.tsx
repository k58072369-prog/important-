import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { IntroScreen } from "@/components/intro-screen";
import {
  saveVideoToIndexedDB,
  getVideoFromIndexedDB,
  deleteVideoFromIndexedDB,
  type VideoRecord,
} from "@/lib/intro-video-db";
import {
  getSplashSettings,
  saveSplashSettings,
  clearPlayedFlag,
  type SplashSettings,
} from "@/lib/splash-settings";
import {
  Upload, Trash2, Play, Film, HardDrive, Calendar, RefreshCw,
  ToggleRight, Eye, MonitorPlay,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function VideoSettings() {
  const [settings, setSettings] = useState<SplashSettings>(getSplashSettings());
  const [videoRecord, setVideoRecord] = useState<VideoRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullIntro, setShowFullIntro] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewBlobRef = useRef<string | null>(null);

  useEffect(() => {
    loadVideo();
    return () => {
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
    };
  }, []);

  async function loadVideo() {
    const record = await getVideoFromIndexedDB();
    setVideoRecord(record);
  }

  function handleSettingChange(key: keyof SplashSettings, value: boolean | string) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSplashSettings(next);
    toast({ title: "تم حفظ الإعداد", description: "تم تحديث إعدادات الفيديو الافتتاحي" });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "ملف غير صالح", description: "يرجى اختيار ملف فيديو", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      await saveVideoToIndexedDB(file);
      await loadVideo();
      toast({ title: "تم رفع الفيديو", description: `تم حفظ "${file.name}" بنجاح` });
    } catch {
      toast({ title: "فشل الرفع", description: "حدث خطأ أثناء حفظ الفيديو", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    await deleteVideoFromIndexedDB();
    setVideoRecord(null);
    if (previewBlobRef.current) { URL.revokeObjectURL(previewBlobRef.current); previewBlobRef.current = null; }
    setPreviewUrl(null);
    setShowPreview(false);
    toast({ title: "تم الحذف", description: "تم حذف الفيديو الافتتاحي" });
  }

  async function handlePreview() {
    if (showPreview) { setShowPreview(false); return; }
    if (videoRecord) {
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
      const url = URL.createObjectURL(videoRecord.blob);
      previewBlobRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl("/intro.mp4");
    }
    setShowPreview(true);
  }

  function handleResetPlayed() {
    clearPlayedFlag();
    toast({ title: "تم الإعادة", description: "سيظهر الفيديو الافتتاحي عند فتح النظام مرة أخرى" });
  }

  const hasCustomVideo = !!videoRecord;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Film className="h-7 w-7 text-emerald-500" />
          إعدادات الفيديو الافتتاحي
        </h1>
        <p className="text-muted-foreground mt-1">إدارة الفيديو الذي يظهر عند فتح النظام</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <ToggleRight className="h-5 w-5 text-emerald-500" />
            إعدادات التشغيل
          </h2>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <Label className="text-sm font-medium">تفعيل الفيديو الافتتاحي</Label>
              <p className="text-xs text-muted-foreground mt-0.5">يظهر الفيديو عند كل فتح للنظام</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => handleSettingChange("enabled", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <Label className="text-sm font-medium">تشغيل تلقائي</Label>
              <p className="text-xs text-muted-foreground mt-0.5">يبدأ الفيديو فور ظهور الشاشة</p>
            </div>
            <Switch
              checked={settings.autoplay}
              onCheckedChange={(v) => handleSettingChange("autoplay", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <Label className="text-sm font-medium">تشغيل مرة واحدة فقط</Label>
              <p className="text-xs text-muted-foreground mt-0.5">لا يُعرض مرة أخرى بعد المشاهدة</p>
            </div>
            <Switch
              checked={settings.playOnce}
              onCheckedChange={(v) => handleSettingChange("playOnce", v)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
            onClick={handleResetPlayed}
          >
            <RefreshCw className="h-4 w-4" />
            إعادة تشغيل الفيديو عند الفتح التالي
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <HardDrive className="h-5 w-5 text-emerald-500" />
            إدارة ملف الفيديو
          </h2>

          {hasCustomVideo && videoRecord ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                <Film className="h-4 w-4" />
                <span className="truncate">{videoRecord.filename}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {formatBytes(videoRecord.size)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(videoRecord.uploaded_at)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/50 border border-dashed border-border p-4 text-center text-sm text-muted-foreground space-y-1">
              <Film className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>لا يوجد فيديو مخصص</p>
              <p className="text-xs">سيُستخدم الفيديو الافتراضي للنظام</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "جاري الرفع..." : hasCustomVideo ? "استبدال الفيديو" : "رفع فيديو جديد"}
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "إخفاء المعاينة" : "معاينة الفيديو"}
            </Button>

            <Button
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setShowFullIntro(true)}
            >
              <MonitorPlay className="h-4 w-4" />
              تجربة الشاشة الافتتاحية كاملة
            </Button>

            {hasCustomVideo && (
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                حذف الفيديو
              </Button>
            )}
          </div>
        </div>
      </div>

      {showPreview && previewUrl && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Play className="h-5 w-5 text-emerald-500" />
            معاينة الفيديو الافتتاحي
          </h2>
          <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-2xl mx-auto">
            <video
              key={previewUrl}
              src={previewUrl}
              controls
              className="w-full h-full object-contain"
              autoPlay
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700 dark:text-amber-400 space-y-1">
        <p className="font-semibold">ملاحظات مهمة:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>الفيديو المرفوع يُحفظ محلياً في المتصفح ويعمل بدون إنترنت</li>
          <li>يدعم النظام جميع صيغ الفيديو الشائعة (MP4، WebM، MOV)</li>
          <li>في حال عدم رفع فيديو، يُستخدم الفيديو الافتراضي للنظام</li>
          <li>تظهر شاشة الفيديو قبل لوحة التحكم مباشرة عند فتح النظام</li>
        </ul>
      </div>

      {showFullIntro && (
        <IntroScreen onDone={() => setShowFullIntro(false)} />
      )}
    </div>
  );
}
