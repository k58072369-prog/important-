import type { MonthlyReport } from "./db";

export interface StudentInfo {
  id: string;
  student_code?: string;
  full_name: string;
  grade?: string;
  circle_name?: string;
  teacher_name?: string;
  guardian_phone?: string;
}

function gradeColor(avg: number): string {
  if (avg >= 90) return "#16a34a";
  if (avg >= 75) return "#d97706";
  if (avg >= 60) return "#2563eb";
  return "#dc2626";
}

function attendanceColor(pct: number): string {
  if (pct >= 85) return "#16a34a";
  if (pct >= 65) return "#d97706";
  return "#dc2626";
}

function attendanceLabel(pct: number): string {
  if (pct >= 90) return "ممتاز";
  if (pct >= 75) return "جيد";
  if (pct >= 60) return "متوسط";
  return "ضعيف";
}

function gradeLabelFixed(avg: number): string {
  if (avg >= 90) return "ممتاز";
  if (avg >= 75) return "جيد جداً";
  if (avg >= 60) return "جيد";
  if (avg > 0) return "مقبول";
  return "—";
}

function progressBar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return `
    <div style="background:#e5e7eb;border-radius:99px;height:8px;width:100%;margin-top:4px">
      <div style="background:${color};height:8px;border-radius:99px;width:${pct}%"></div>
    </div>
  `;
}

function buildStudentSection(report: MonthlyReport, idx: number): string {
  const attendPct = report.attendance_pct ?? 0;
  const avgGrade = report.avg_grade ?? 0;
  const aColor = attendanceColor(attendPct);
  const gColor = gradeColor(avgGrade);
  const totalRatings = (report.rating_excellent ?? 0) + (report.rating_very_good ?? 0) + (report.rating_good ?? 0) + (report.rating_acceptable ?? 0) + (report.rating_poor ?? 0);

  return `
  <div class="student-page" style="page-break-before: ${idx === 0 ? "avoid" : "always"}">
    <!-- Header -->
    <div class="card-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:11px;color:#6b7280;letter-spacing:1px;margin-bottom:4px">
            ${report.student_code ? `<span class="code-badge">${report.student_code}</span>` : ""}
          </div>
          <div style="font-size:22px;font-weight:800;color:#1f2937">${report.student_name}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">
            ${report.grade ? `<span style="margin-left:12px">📚 ${report.grade}</span>` : ""}
            ${report.circle_name ? `<span style="margin-left:12px">🕌 ${report.circle_name}</span>` : ""}
            ${report.teacher_name ? `<span style="margin-left:12px">👤 ${report.teacher_name}</span>` : ""}
            ${report.guardian_phone ? `<span>📞 ${report.guardian_phone}</span>` : ""}
          </div>
        </div>
        <div style="text-align:center;padding:12px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px">
          <div style="font-size:11px;color:#16a34a;font-weight:600">التقرير الشهري</div>
          <div style="font-size:15px;font-weight:700;color:#15803d;margin-top:2px">${report.month_label}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">${new Date(report.created_at).toLocaleDateString("ar-EG")}</div>
        </div>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">إجمالي الحصص</div>
        <div class="stat-value" style="color:#1d4ed8">${report.sessions_count}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">الحضور</div>
        <div class="stat-value" style="color:${aColor}">${report.present_count}</div>
        <div style="font-size:11px;color:#6b7280">${attendPct}% · ${attendanceLabel(attendPct)}</div>
        ${progressBar(report.present_count, report.sessions_count, aColor)}
      </div>
      <div class="stat-box">
        <div class="stat-label">الغياب</div>
        <div class="stat-value" style="color:#dc2626">${report.absent_count}</div>
        ${report.late_count ? `<div style="font-size:11px;color:#6b7280">منها تأخر: ${report.late_count}</div>` : ""}
        ${report.excused_count ? `<div style="font-size:11px;color:#6b7280">بعذر: ${report.excused_count}</div>` : ""}
      </div>
      <div class="stat-box">
        <div class="stat-label">متوسط الدرجات</div>
        <div class="stat-value" style="color:${gColor}">${avgGrade > 0 ? avgGrade : "—"}</div>
        ${avgGrade > 0 ? `<div style="font-size:11px;color:#6b7280">${report.min_grade} – ${report.max_grade} · ${gradeLabelFixed(avgGrade)}</div>` : ""}
      </div>
      <div class="stat-box">
        <div class="stat-label">جلسات حفظ</div>
        <div class="stat-value" style="color:#7c3aed">${report.memorization_count}</div>
        ${report.last_memorization ? `<div style="font-size:10px;color:#6b7280;margin-top:4px">آخر موضع: ${report.last_memorization}</div>` : ""}
      </div>
      <div class="stat-box">
        <div class="stat-label">جلسات مراجعة</div>
        <div class="stat-value" style="color:#0891b2">${report.revision_count}</div>
        ${report.last_revision ? `<div style="font-size:10px;color:#6b7280;margin-top:4px">آخر موضع: ${report.last_revision}</div>` : ""}
      </div>
    </div>

    ${totalRatings > 0 ? `
    <!-- Ratings -->
    <div class="section-title">توزيع التقييمات</div>
    <div class="ratings-row">
      ${report.rating_excellent ? `<div class="rating-item" style="color:#16a34a;background:#f0fdf4;border-color:#bbf7d0"><span style="font-weight:700">${report.rating_excellent}</span><br><span style="font-size:10px">ممتاز</span></div>` : ""}
      ${report.rating_very_good ? `<div class="rating-item" style="color:#0891b2;background:#ecfeff;border-color:#a5f3fc"><span style="font-weight:700">${report.rating_very_good}</span><br><span style="font-size:10px">جيد جداً</span></div>` : ""}
      ${report.rating_good ? `<div class="rating-item" style="color:#2563eb;background:#eff6ff;border-color:#bfdbfe"><span style="font-weight:700">${report.rating_good}</span><br><span style="font-size:10px">جيد</span></div>` : ""}
      ${report.rating_acceptable ? `<div class="rating-item" style="color:#d97706;background:#fffbeb;border-color:#fde68a"><span style="font-weight:700">${report.rating_acceptable}</span><br><span style="font-size:10px">مقبول</span></div>` : ""}
      ${report.rating_poor ? `<div class="rating-item" style="color:#dc2626;background:#fef2f2;border-color:#fecaca"><span style="font-weight:700">${report.rating_poor}</span><br><span style="font-size:10px">ضعيف</span></div>` : ""}
    </div>
    ` : ""}

    <!-- Evaluation text -->
    <div class="section-title">التقرير النصي التفصيلي</div>
    <div class="eval-box">${report.evaluation_text}</div>
  </div>
  `;
}

function buildFullHTML(reports: MonthlyReport[], monthLabel: string, month: string): string {
  const CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', 'Tahoma', 'DejaVu Sans', sans-serif;
      direction: rtl;
      background: #f9fafb;
      color: #1f2937;
      font-size: 13px;
    }
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    /* Cover */
    .cover {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
      border-radius: 20px;
      color: white;
      margin-bottom: 32px;
    }
    .cover h1 { font-size: 32px; font-weight: 800; letter-spacing: 1px; }
    .cover h2 { font-size: 20px; font-weight: 600; margin-top: 8px; opacity: 0.9; }
    .cover .meta { font-size: 13px; opacity: 0.75; margin-top: 16px; }

    /* Summary table */
    .summary-section { margin-bottom: 32px; }
    .summary-section h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #065f46; color: white; padding: 10px 12px; text-align: right; font-weight: 600; }
    td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f0fdf4; }
    tr:hover td { background: #d1fae5; }

    /* Student page */
    .student-page {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .card-header {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-bottom: 1px solid #d1fae5;
      padding: 16px 20px;
    }
    .code-badge {
      display: inline-block;
      background: #065f46;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 99px;
      letter-spacing: 1px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-box {
      background: white;
      padding: 14px 16px;
      text-align: center;
    }
    .stat-label { font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 26px; font-weight: 800; margin: 4px 0; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #065f46;
      padding: 10px 20px 4px;
      border-top: 1px solid #e5e7eb;
    }
    .ratings-row {
      display: flex;
      gap: 8px;
      padding: 8px 20px 12px;
      flex-wrap: wrap;
    }
    .rating-item {
      text-align: center;
      min-width: 60px;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid;
      font-size: 13px;
    }
    .eval-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      margin: 8px 20px 16px;
      padding: 14px 16px;
      font-size: 13px;
      line-height: 1.9;
      color: #1f2937;
    }

    @media print {
      body { background: white; }
      .page { padding: 8px; }
      .student-page { page-break-inside: avoid; box-shadow: none; }
      .cover { page-break-after: always; }
      .summary-section { page-break-after: always; }
    }
  `;

  const summaryRows = reports.map((r, i) =>
    `<tr>
      <td style="font-weight:600">${i + 1}</td>
      <td>${r.student_code ? `<span style="background:#065f46;color:white;padding:1px 8px;border-radius:99px;font-size:10px">${r.student_code}</span>` : "—"}</td>
      <td style="font-weight:600">${r.student_name}</td>
      <td>${r.circle_name ?? "—"}</td>
      <td>${r.teacher_name ?? "—"}</td>
      <td style="text-align:center;color:${attendanceColor(r.attendance_pct)};font-weight:700">${r.attendance_pct}%</td>
      <td style="text-align:center;font-weight:700;color:${r.present_count}/${r.sessions_count}">${r.present_count}/${r.sessions_count}</td>
      <td style="text-align:center;color:${gradeColor(r.avg_grade)};font-weight:700">${r.avg_grade > 0 ? r.avg_grade : "—"}</td>
      <td style="text-align:center">${r.memorization_count}</td>
      <td style="text-align:center">${r.revision_count}</td>
    </tr>`
  ).join("");

  const studentSections = reports.map((r, i) => buildStudentSection(r, i)).join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>تقرير الطلاب الشهري — ${monthLabel}</title>
  <style>${CSS}</style>
</head>
<body>
<div class="page">

  <!-- Cover -->
  <div class="cover">
    <div style="font-size:14px;opacity:.8;margin-bottom:8px">مكتب الفرقان لتحفيظ القرآن الكريم</div>
    <h1>التقرير الشهري الشامل</h1>
    <h2>${monthLabel}</h2>
    <div class="meta">
      إجمالي الطلاب: ${reports.length} طالب
      &nbsp;·&nbsp;
      تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>

  <!-- Summary table -->
  <div class="summary-section">
    <h2>📊 ملخص جميع الطلاب</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>الكود</th>
          <th>اسم الطالب</th>
          <th>الحلقة</th>
          <th>المعلم</th>
          <th>نسبة الحضور</th>
          <th>الحضور/الحصص</th>
          <th>متوسط الدرجات</th>
          <th>جلسات حفظ</th>
          <th>جلسات مراجعة</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
      </tbody>
    </table>
  </div>

  <!-- Individual student pages -->
  ${studentSections}

</div>
</body>
</html>`;
}

export function downloadHTML(reports: MonthlyReport[], monthLabel: string, month: string): void {
  const html = buildFullHTML(reports, monthLabel, month);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Students_Report_${month}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

export function printPDF(reports: MonthlyReport[], monthLabel: string, month: string): void {
  const html = buildFullHTML(reports, monthLabel, month);
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) { alert("يرجى السماح بالنوافذ المنبثقة لتصدير PDF"); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

export function downloadSingleHTML(report: MonthlyReport): void {
  const html = buildFullHTML([report], report.month_label, report.month);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Report_${report.student_name}_${report.month}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

export function printSinglePDF(report: MonthlyReport): void {
  printPDF([report], report.month_label, report.month);
}
