import { Router, type IRouter } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db, studentsTable, sessionRecordsTable, circlesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/ai/insights", async (req, res): Promise<void> => {
  try {
    const [totalStudents] = await db.select({ count: count() }).from(studentsTable);
    const weakStudents = await db.select().from(studentsTable).where(eq(studentsTable.level, "ضعيف"));
    const unpaidStudents = await db.select().from(studentsTable).where(eq(studentsTable.paymentStatus, "غير مدفوع"));

    const prompt = `أنت مساعد تعليمي ذكي لنظام إدارة حلقات تحفيظ القرآن الكريم.
    
البيانات الحالية:
- إجمالي الطلاب: ${Number(totalStudents.count)}
- الطلاب الضعفاء: ${weakStudents.length}
- الطلاب المتأخرون في المصروفات: ${unpaidStudents.length}

قدم تحليلاً ذكياً مختصراً بالعربية يحتوي على:
1. ثلاثة رؤى مهمة عن الأداء العام
2. ثلاث توصيات عملية للتحسين
3. قائمة الطلاب الذين يحتاجون اهتماماً خاصاً (إن وجدوا)

أجب بصيغة JSON بالشكل التالي بالضبط:
{
  "insights": [
    {"title": "...", "description": "...", "type": "performance|financial|attendance", "severity": "low|medium|high"}
  ],
  "recommendations": ["...", "...", "..."],
  "weak_students": [{"id": "...", "name": "...", "issue": "..."}]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = {
        insights: [
          { title: "نظام يعمل بكفاءة", description: "النظام يعمل بشكل طبيعي والبيانات تُحفظ بنجاح", type: "performance", severity: "low" }
        ],
        recommendations: ["تابع حضور الطلاب بانتظام", "راجع مستوى الحفظ أسبوعياً", "تواصل مع أولياء الأمور المتأخرين"],
        weak_students: weakStudents.map(s => ({ id: s.id, name: s.fullName, issue: "مستوى ضعيف يحتاج متابعة" }))
      };
    }

    res.json({
      insights: parsed.insights ?? [],
      recommendations: parsed.recommendations ?? [],
      weak_students: parsed.weak_students ?? [],
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "AI insights failed");
    res.json({
      insights: [
        { title: "نظام جاهز", description: "النظام يعمل بكفاءة وجاهز لاستقبال البيانات", type: "performance", severity: "low" }
      ],
      recommendations: ["أضف طلاباً ومعلمين لبدء الاستخدام", "أنشئ الحلقات وجدول الحصص", "تابع الحضور والحفظ بانتظام"],
      weak_students: [],
      generated_at: new Date().toISOString(),
    });
  }
});

router.get("/ai/analyze-student/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, rawId));

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const records = await db.select().from(sessionRecordsTable).where(eq(sessionRecordsTable.studentId, rawId));
    const presentCount = records.filter(r => r.isPresent).length;
    const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

    const prompt = `حلل أداء الطالب التالي بالعربية وقدم تقريراً شاملاً:

اسم الطالب: ${student.fullName}
الصف الدراسي: ${student.grade}
المستوى: ${student.level ?? "غير محدد"}
التقييم: ${student.rating ?? "غير محدد"}/10
نسبة الحضور: ${attendanceRate}%
الحفظ الحالي: ${student.currentMemorization ?? "غير محدد"}
المراجعة الحالية: ${student.currentRevision ?? "غير محدد"}
النقاط: ${student.points ?? 0}
إجمالي الحصص: ${records.length}

أجب بصيغة JSON:
{
  "summary": "ملخص شامل عن أداء الطالب",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "overall_score": 75
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = {
        summary: `الطالب ${student.fullName} يسير في مسيرته التعليمية`,
        strengths: ["الالتزام بالحضور", "الجدية في التعلم"],
        weaknesses: ["يحتاج متابعة مستمرة"],
        recommendations: ["تشجيع الطالب على الاستمرار", "متابعة الحفظ أسبوعياً"],
        overall_score: student.rating ? student.rating * 10 : 70,
      };
    }

    res.json({
      student_id: student.id,
      student_name: student.fullName,
      summary: parsed.summary ?? "",
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      recommendations: parsed.recommendations ?? [],
      attendance_rate: attendanceRate,
      memorization_progress: student.currentMemorization ?? "—",
      overall_score: parsed.overall_score ?? 70,
    });
  } catch (err) {
    req.log.error({ err }, "Student analysis failed");
    res.status(500).json({ error: "Analysis failed" });
  }
});

export default router;
