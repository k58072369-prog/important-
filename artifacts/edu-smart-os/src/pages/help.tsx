import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, MessageCircle, Send, PhoneIcon } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [query, setQuery] = useState("");

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
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
          <HelpCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-secondary">مركز المساعدة والدعم</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          نحن هنا لمساعدتك في استخدام نظام EDU SMART OS بكل سهولة وفعالية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
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

          <Card className="border-gold-500/20 bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-secondary">
                <MessageCircle className="h-5 w-5 text-accent" />
                المساعد الذكي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-card rounded-xl border p-4 h-[300px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  <div className="bg-muted p-3 rounded-lg rounded-tr-none w-[80%] text-sm">
                    مرحباً! أنا المساعد الذكي للنظام. كيف يمكنني مساعدتك اليوم؟
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="اكتب سؤالك هنا..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                    <Send className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
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
        </div>
      </div>
    </div>
  );
}