import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, MessageCircle, PhoneIcon, PlayCircle, Upload, Trash2, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import { getSplashSettings, saveSplashSettings, clearVideoCache, type SplashSettings } from "@/lib/splash-settings";
import { useToast } from "@/hooks/use-toast";

export default function Help() {
  const { toast } = useToast();

  const [splashSettings, setSplashSettings] = useState<SplashSettings>(getSplashSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSplash = (patch: Partial<SplashSettings>) => {
    const next = { ...splashSettings, ...patch };
    setSplashSettings(next);
    saveSplashSettings(next);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف فيديو صالح", variant: "destructive" });
      return;
    }

    try {
      const CACHE_NAME = "furqan-splash-video-v1";
      const videoUrl = "/intro.mp4";

      if ("caches" in window) {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(file, {
          headers: { "Content-Type": file.type },
        });
        await cache.put(videoUrl, response);
      }

      updateSplash({ videoUrl });
      toast({ title: "تم رفع الفيديو", description: "تم حفظ الفيديو الافتتاحي بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الفيديو، حاول مرة أخرى", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearCache = async () => {
    await clearVideoCache();
    updateSplash({ videoUrl: "/intro.mp4" });
    toast({ title: "تم المسح", description: "تم مسح ذاكرة التخزين المؤقت للفيديو" });
  };

  const faqs = [
    {
      q: "كيف يمكنني إضافة طالب جديد إلى حلقة معينة؟",
      a: "من صفحة 'الطلاب'، انقر على زر 'إضافة طالب'. في النموذج الذي يظهر، قم بتعبئة بيانات الطالب وحدد الحلقة المطلوبة من القائمة المنسدلة."
    },
    {
      q: "كيف أتابع حضور وغياب الطلاب بشكل يومي؟",
      a: "من صفحة 'الحصص'، قم بإنشاء حصة جديدة للحلقة. بعد ذلك، يمكنك الدخول لتفاصيل الحصة وتسجيل حضور وغياب كل طالب وتقييم أدائه."
    },
    {
      q: "كيف يعمل نظام لوحة الصدارة؟",
      a: "يتم حساب النقاط تلقائياً بناءً على حضور الطالب، تقييمات الحفظ والمراجعة، والتزامه في الحصص. يتم تحديث الترتيب بشكل فوري."
    },
    {
      q: "كيف يمكنني إصدار فاتورة شهرية للطالب؟",
      a: "من صفحة 'الشؤون المالية'، قسم 'الاشتراكات والفواتير'، انقر على 'إصدار فاتورة' وحدد الطالب والشهر والمبلغ المطلوب."
    },
    {
      q: "كيف أختار عدة أيام للحلقة؟",
      a: "عند إنشاء أو تعديل الحلقة، ستجد قسم 'أيام الحلقة' يتيح اختيار أكثر من يوم عبر خانات الاختيار. يمكنك تحديد أي مجموعة من أيام الأسبوع."
    },
    {
      q: "كيف أسجّل حضور جلسة اختبار المسابقة؟",
      a: "من صفحة 'المسابقات'، افتح المسابقة واختر المستوى، ثم انقر على 'جلسات الاختبار'. أنشئ جلسة جديدة وسيتم جلب المشاركين تلقائياً لتسجيل الحضور والدرجات."
    },
    {
      q: "هل يعمل النظام بدون إنترنت؟",
      a: "نعم. النظام يعمل بالكامل بدون إنترنت، جميع البيانات محفوظة محلياً في المتصفح (IndexedDB). يمكنك استخدام جميع الميزات في أي وقت."
    },
    {
      q: "كيف أعمل نسخة احتياطية للبيانات؟",
      a: "من أسفل القائمة الجانبية، انقر على 'النسخ الاحتياطية'. يمكنك إنشاء نسخة يدوية أو تفعيل النسخ التلقائي، والاستعادة منها في أي وقت."
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
          <HelpCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-secondary">مركز المساعدة والدعم</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          نحن هنا لمساعدتك في استخدام نظام مكتب الفرقان لتحفيظ القرآن الكريم بكل سهولة وفعالية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">

          {/* ─── Splash Screen Settings ───────────────────────────── */}
          <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-secondary">
                <PlayCircle className="h-5 w-5 text-amber-500" />
                إعدادات الشاشة الافتتاحية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
                <div>
                  <p className="font-semibold text-sm">تفعيل الشاشة الافتتاحية</p>
                  <p className="text-xs text-muted-foreground mt-0.5">عرض الفيديو الافتتاحي عند تشغيل النظام</p>
                </div>
                <Switch
                  checked={splashSettings.enabled}
                  onCheckedChange={(v) => updateSplash({ enabled: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
                <div>
                  <p className="font-semibold text-sm">تشغيل الفيديو تلقائياً</p>
                  <p className="text-xs text-muted-foreground mt-0.5">يبدأ الفيديو مباشرة عند فتح النظام</p>
                </div>
                <Switch
                  checked={splashSettings.autoplay}
                  onCheckedChange={(v) => updateSplash({ autoplay: v })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skip-text" className="font-semibold text-sm">نص زر التخطي</Label>
                <Input
                  id="skip-text"
                  value={splashSettings.skipButtonText}
                  onChange={(e) => updateSplash({ skipButtonText: e.target.value })}
                  placeholder="تخطي"
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">النص الذي يظهر على زر التخطي في الشاشة الافتتاحية</p>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-sm">استبدال الفيديو الافتتاحي</Label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border-amber-500/40 hover:bg-amber-50"
                  >
                    <Upload className="h-4 w-4 text-amber-600" />
                    رفع فيديو جديد
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearCache}
                    className="flex items-center gap-2 border-red-300 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    مسح الذاكرة المؤقتة
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  يُحفظ الفيديو في ذاكرة التخزين المؤقت للمتصفح لضمان تشغيله بدون إنترنت
                </p>
              </div>

              <div className="pt-2 border-t">
                <Button
                  onClick={() => {
                    saveSplashSettings({ ...splashSettings, enabled: true });
                    window.location.reload();
                  }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  معاينة الشاشة الافتتاحية
                </Button>
                <p className="text-xs text-muted-foreground mt-2">سيتم إعادة تحميل الصفحة لمعاينة الشاشة الافتتاحية</p>
              </div>
            </CardContent>
          </Card>

          {/* ─── FAQ ─────────────────────────────────────────────── */}
          <Card className="border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-secondary">الأسئلة الشائعة</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-right font-medium text-base hover:text-primary">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gold-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10" />
            <CardHeader>
              <CardTitle className="text-xl text-secondary">الدعم الفني المباشر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm leading-relaxed">
                هل تواجه مشكلة تقنية أو تحتاج إلى مساعدة متقدمة؟ فريق الدعم الفني متواجد لمساعدتك.
              </p>

              <a
                href="https://wa.me/201127416995"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <MessageCircle className="h-6 w-6" />
                تواصل معنا عبر واتساب
              </a>

              <div className="pt-4 border-t border-muted text-center space-y-2">
                <div className="text-sm font-medium text-secondary">أو اتصل بنا مباشرة</div>
                <div className="text-lg font-bold text-primary flex items-center justify-center gap-2" dir="ltr">
                  <PhoneIcon className="h-4 w-4" />
                  +20 112 741 6995
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 space-y-3">
              <h3 className="font-bold text-secondary">معلومات النظام</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>وضع التشغيل</span>
                  <span className="text-green-600 font-semibold">بدون إنترنت ✓</span>
                </div>
                <div className="flex justify-between">
                  <span>التخزين</span>
                  <span className="font-medium">محلي (IndexedDB)</span>
                </div>
                <div className="flex justify-between">
                  <span>النسخ الاحتياطي</span>
                  <span className="font-medium">تلقائي كل 6 ساعات</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
