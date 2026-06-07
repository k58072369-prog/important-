import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  db,
  invoicesTable,
  expensesTable,
  studentsTable,
  teachersTable,
  incomeEntriesTable,
  salaryRecordsTable,
  transactionsTable,
} from "@workspace/db";
import {
  CreateInvoiceBody,
  UpdateInvoiceBody,
  UpdateInvoiceParams,
  ListInvoicesQueryParams,
  GetFinanceSummaryQueryParams,
  CreateExpenseBody,
  UpdateExpenseBody,
  UpdateExpenseParams,
  DeleteExpenseParams,
  ListIncomeQueryParams,
  CreateIncomeBody,
  DeleteIncomeParams,
  ListPayrollQueryParams,
  CreatePayrollBody,
  UpdatePayrollBody,
  UpdatePayrollParams,
  DeletePayrollParams,
  CalculatePayrollBody,
  ListTransactionsQueryParams,
  GetFinanceAnalyticsQueryParams,
} from "@workspace/api-zod";
import { toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

function formatInvoice(i: Record<string, unknown>) {
  return {
    ...toSnakeCase(i),
    amount: Number(i.amount),
  };
}

function formatExpense(e: Record<string, unknown>) {
  return {
    ...toSnakeCase(e),
    amount: Number(e.amount),
  };
}

function formatIncome(i: Record<string, unknown>) {
  return {
    ...toSnakeCase(i),
    amount: Number(i.amount),
  };
}

function formatSalary(s: Record<string, unknown>) {
  return {
    ...toSnakeCase(s),
    base_salary: Number(s.baseSalary ?? 0),
    session_count: Number(s.sessionCount ?? 0),
    session_rate: Number(s.sessionRate ?? 0),
    bonuses: Number(s.bonuses ?? 0),
    deductions: Number(s.deductions ?? 0),
    total_amount: Number(s.totalAmount ?? 0),
  };
}

function formatTransaction(t: Record<string, unknown>) {
  return {
    ...toSnakeCase(t),
    amount: Number(t.amount),
  };
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────

router.get("/invoices", async (req, res): Promise<void> => {
  const query = ListInvoicesQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.month) conditions.push(eq(invoicesTable.month, query.data.month));
  if (query.success && query.data.status) conditions.push(eq(invoicesTable.status, query.data.status));

  const invoices = await db
    .select({
      id: invoicesTable.id,
      studentId: invoicesTable.studentId,
      studentName: studentsTable.fullName,
      month: invoicesTable.month,
      amount: invoicesTable.amount,
      status: invoicesTable.status,
      isExempt: invoicesTable.isExempt,
      paidAt: invoicesTable.paidAt,
      createdAt: invoicesTable.createdAt,
    })
    .from(invoicesTable)
    .leftJoin(studentsTable, eq(invoicesTable.studentId, studentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(invoicesTable.month, studentsTable.fullName);

  res.json(invoices.map((i) => formatInvoice(i as any)));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month, amount_override } = parsed.data as any;
  const students = await db.select().from(studentsTable);

  const values = students.map((s) => ({
    studentId: s.id,
    month,
    amount: amount_override?.toString() ?? s.paymentAmount ?? "0",
    status: s.isExempt ? "معفي" : "غير مدفوع",
    isExempt: s.isExempt,
  }));

  if (values.length === 0) {
    res.status(201).json([]);
    return;
  }

  const invoices = await db.insert(invoicesTable).values(values).returning();
  res.status(201).json(invoices.map((i) => formatInvoice(i as any)));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.status !== undefined) updates.status = d.status;
  if (d.amount !== undefined) updates.amount = d.amount?.toString();
  if (d.is_exempt !== undefined) updates.isExempt = d.is_exempt;
  if (d.paid_at !== undefined) updates.paidAt = d.paid_at ? new Date(d.paid_at) : null;
  if (d.status === "مدفوع" && d.paid_at === undefined) updates.paidAt = new Date();

  const [invoice] = await db
    .update(invoicesTable)
    .set(updates)
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  // Record transaction when paid
  if (d.status === "مدفوع" && invoice) {
    const studentName = (
      await db.select({ name: studentsTable.fullName }).from(studentsTable).where(eq(studentsTable.id, invoice.studentId))
    )[0]?.name;
    await db.insert(transactionsTable).values({
      type: "وارد",
      amount: invoice.amount.toString(),
      description: `اشتراك شهري - ${studentName ?? ""}`,
      category: "اشتراكات الطلاب",
      date: new Date().toISOString().split("T")[0],
      linkedType: "student",
      linkedId: invoice.studentId,
      linkedName: studentName ?? null,
      sourceTable: "invoices",
      sourceId: invoice.id,
    }).onConflictDoNothing();
  }

  res.json(formatInvoice(invoice as any));
});

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

router.get("/expenses", async (_req, res): Promise<void> => {
  const expenses = await db.select().from(expensesTable).orderBy(desc(expensesTable.date));
  res.json(expenses.map((e) => formatExpense(e as any)));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [expense] = await db
    .insert(expensesTable)
    .values({
      category: d.category,
      description: d.description,
      amount: d.amount?.toString(),
      date: d.date,
      paymentMethod: d.payment_method ?? "نقداً",
      linkedToType: d.linked_to_type ?? null,
      linkedToId: d.linked_to_id ?? null,
      notes: d.notes ?? null,
    })
    .returning();

  // Record transaction
  await db.insert(transactionsTable).values({
    type: "مصروف",
    amount: d.amount?.toString(),
    description: d.description ?? d.category,
    category: d.category,
    date: d.date,
    linkedType: d.linked_to_type ?? null,
    linkedName: null,
    sourceTable: "expenses",
    sourceId: expense.id,
  });

  res.status(201).json(formatExpense(expense as any));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.category !== undefined) updates.category = d.category;
  if (d.description !== undefined) updates.description = d.description;
  if (d.amount !== undefined) updates.amount = d.amount?.toString();
  if (d.date !== undefined) updates.date = d.date;
  if (d.payment_method !== undefined) updates.paymentMethod = d.payment_method;
  if (d.notes !== undefined) updates.notes = d.notes;

  const [expense] = await db
    .update(expensesTable)
    .set(updates)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(formatExpense(expense as any));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(expensesTable).where(eq(expensesTable.id, params.data.id));
  res.json({ success: true, id: params.data.id });
});

// ─── INCOME ENTRIES ───────────────────────────────────────────────────────────

router.get("/income", async (req, res): Promise<void> => {
  const query = ListIncomeQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.type) conditions.push(eq(incomeEntriesTable.type, query.data.type));

  const income = await db
    .select()
    .from(incomeEntriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(incomeEntriesTable.date));

  res.json(income.map((i) => formatIncome(i as any)));
});

router.post("/income", async (req, res): Promise<void> => {
  const parsed = CreateIncomeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [entry] = await db
    .insert(incomeEntriesTable)
    .values({
      type: d.type,
      description: d.description,
      amount: d.amount?.toString(),
      date: d.date,
      paymentMethod: d.payment_method ?? "نقداً",
      donorName: d.donor_name ?? null,
      notes: d.notes ?? null,
    })
    .returning();

  // Record transaction
  await db.insert(transactionsTable).values({
    type: "وارد",
    amount: d.amount?.toString(),
    description: d.description,
    category: d.type,
    date: d.date,
    sourceTable: "income_entries",
    sourceId: entry.id,
  });

  res.status(201).json(formatIncome(entry as any));
});

router.delete("/income/:id", async (req, res): Promise<void> => {
  const params = DeleteIncomeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(incomeEntriesTable).where(eq(incomeEntriesTable.id, params.data.id));
  res.json({ success: true, id: params.data.id });
});

// ─── PAYROLL ──────────────────────────────────────────────────────────────────

router.get("/payroll", async (req, res): Promise<void> => {
  const query = ListPayrollQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.month) conditions.push(eq(salaryRecordsTable.month, query.data.month));
  if (query.success && query.data.teacher_id)
    conditions.push(eq(salaryRecordsTable.teacherId, query.data.teacher_id));

  const records = await db
    .select({
      id: salaryRecordsTable.id,
      teacherId: salaryRecordsTable.teacherId,
      teacherName: teachersTable.fullName,
      month: salaryRecordsTable.month,
      baseSalary: salaryRecordsTable.baseSalary,
      sessionCount: salaryRecordsTable.sessionCount,
      sessionRate: salaryRecordsTable.sessionRate,
      bonuses: salaryRecordsTable.bonuses,
      deductions: salaryRecordsTable.deductions,
      totalAmount: salaryRecordsTable.totalAmount,
      paymentMethod: salaryRecordsTable.paymentMethod,
      status: salaryRecordsTable.status,
      calculationMethod: salaryRecordsTable.calculationMethod,
      notes: salaryRecordsTable.notes,
      paidAt: salaryRecordsTable.paidAt,
      createdAt: salaryRecordsTable.createdAt,
    })
    .from(salaryRecordsTable)
    .leftJoin(teachersTable, eq(salaryRecordsTable.teacherId, teachersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(salaryRecordsTable.month, teachersTable.fullName);

  res.json(records.map((r) => formatSalary(r as any)));
});

router.post("/payroll", async (req, res): Promise<void> => {
  const parsed = CreatePayrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [record] = await db
    .insert(salaryRecordsTable)
    .values({
      teacherId: d.teacher_id,
      month: d.month,
      baseSalary: d.base_salary?.toString() ?? "0",
      sessionCount: d.session_count?.toString() ?? "0",
      sessionRate: d.session_rate?.toString() ?? "0",
      bonuses: d.bonuses?.toString() ?? "0",
      deductions: d.deductions?.toString() ?? "0",
      totalAmount: d.total_amount?.toString(),
      paymentMethod: d.payment_method ?? "نقداً",
      status: d.status ?? "معلق",
      calculationMethod: d.calculation_method,
      notes: d.notes ?? null,
    })
    .returning();

  res.status(201).json(formatSalary({ ...record, teacherName: null } as any));
});

router.post("/payroll/calculate", async (req, res): Promise<void> => {
  const parsed = CalculatePayrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month } = parsed.data as any;
  const teachers = await db.select().from(teachersTable);

  const created = [];
  for (const teacher of teachers) {
    const existingRecord = await db
      .select()
      .from(salaryRecordsTable)
      .where(and(eq(salaryRecordsTable.teacherId, teacher.id), eq(salaryRecordsTable.month, month)));

    if (existingRecord.length > 0) continue;

    const baseSalary = Number(teacher.salary ?? 0);
    const totalAmount = baseSalary;

    if (totalAmount === 0) continue;

    const [record] = await db
      .insert(salaryRecordsTable)
      .values({
        teacherId: teacher.id,
        month,
        baseSalary: baseSalary.toString(),
        sessionCount: "0",
        sessionRate: "0",
        bonuses: "0",
        deductions: "0",
        totalAmount: totalAmount.toString(),
        paymentMethod: "نقداً",
        status: "معلق",
        calculationMethod: "ثابت",
      })
      .returning();

    created.push({ ...record, teacherName: teacher.fullName });
  }

  res.status(201).json(created.map((r) => formatSalary(r as any)));
});

router.patch("/payroll/:id", async (req, res): Promise<void> => {
  const params = UpdatePayrollParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePayrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.base_salary !== undefined) updates.baseSalary = d.base_salary?.toString();
  if (d.bonuses !== undefined) updates.bonuses = d.bonuses?.toString();
  if (d.deductions !== undefined) updates.deductions = d.deductions?.toString();
  if (d.total_amount !== undefined) updates.totalAmount = d.total_amount?.toString();
  if (d.payment_method !== undefined) updates.paymentMethod = d.payment_method;
  if (d.status !== undefined) updates.status = d.status;
  if (d.notes !== undefined) updates.notes = d.notes;
  if (d.paid_at !== undefined) updates.paidAt = d.paid_at ? new Date(d.paid_at) : null;
  if (d.status === "مدفوع" && d.paid_at === undefined) updates.paidAt = new Date();

  const [record] = await db
    .update(salaryRecordsTable)
    .set(updates)
    .where(eq(salaryRecordsTable.id, params.data.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Salary record not found" });
    return;
  }

  // Record transaction if paid
  if (d.status === "مدفوع") {
    const teacher = (
      await db.select({ name: teachersTable.fullName }).from(teachersTable).where(eq(teachersTable.id, record.teacherId))
    )[0];
    await db.insert(transactionsTable).values({
      type: "مصروف",
      amount: record.totalAmount.toString(),
      description: `راتب - ${teacher?.name ?? ""}`,
      category: "رواتب",
      date: new Date().toISOString().split("T")[0],
      linkedType: "teacher",
      linkedId: record.teacherId,
      linkedName: teacher?.name ?? null,
      sourceTable: "salary_records",
      sourceId: record.id,
    }).onConflictDoNothing();
  }

  res.json(formatSalary({ ...record, teacherName: null } as any));
});

router.delete("/payroll/:id", async (req, res): Promise<void> => {
  const params = DeletePayrollParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(salaryRecordsTable).where(eq(salaryRecordsTable.id, params.data.id));
  res.json({ success: true, id: params.data.id });
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.type) conditions.push(eq(transactionsTable.type, query.data.type));

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionsTable.date));

  res.json(transactions.map((t) => formatTransaction(t as any)));
});

// ─── FINANCE SUMMARY ──────────────────────────────────────────────────────────

router.get("/finance/summary", async (req, res): Promise<void> => {
  const query = GetFinanceSummaryQueryParams.safeParse(req.query);
  const month = query.success && query.data.month ? query.data.month : null;

  const invoiceConditions = month ? [eq(invoicesTable.month, month)] : [];
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(invoiceConditions.length > 0 ? and(...invoiceConditions) : undefined);

  const expenses = await db.select().from(expensesTable);
  const incomeEntries = await db.select().from(incomeEntriesTable);
  const salaryRecords = await db.select().from(salaryRecordsTable);

  const invoiceRevenue = invoices.filter((i) => i.status === "مدفوع").reduce((sum, i) => sum + Number(i.amount), 0);
  const extraIncome = incomeEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const revenue = invoiceRevenue + extraIncome;

  const opExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const salaryExpenses = salaryRecords
    .filter((s) => s.status === "مدفوع")
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalExpenses = opExpenses + salaryExpenses;

  const profit = revenue - totalExpenses;
  const paidInvoices = invoices.filter((i) => i.status === "مدفوع").length;
  const unpaidInvoices = invoices.filter((i) => i.status === "غير مدفوع").length;
  const exemptInvoices = invoices.filter((i) => i.isExempt).length;

  // Monthly breakdown
  const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
  invoices.forEach((i) => {
    if (!monthlyData[i.month]) monthlyData[i.month] = { revenue: 0, expenses: 0 };
    if (i.status === "مدفوع") monthlyData[i.month].revenue += Number(i.amount);
  });
  expenses.forEach((e) => {
    const m = e.date.substring(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { revenue: 0, expenses: 0 };
    monthlyData[m].expenses += Number(e.amount);
  });

  const monthlyBreakdown = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, data]) => ({ month: m, revenue: data.revenue, expenses: data.expenses }));

  res.json({
    month,
    revenue,
    expenses: totalExpenses,
    profit,
    paid_invoices: paidInvoices,
    unpaid_invoices: unpaidInvoices,
    exempt_invoices: exemptInvoices,
    monthly_breakdown: monthlyBreakdown,
  });
});

// ─── FINANCE ANALYTICS ────────────────────────────────────────────────────────

router.get("/finance/analytics", async (req, res): Promise<void> => {
  const query = GetFinanceAnalyticsQueryParams.safeParse(req.query);
  const monthsBack = (query.success && query.data.months) ? query.data.months : 6;

  // Generate last N months
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().substring(0, 7));
  }

  const invoices = await db.select().from(invoicesTable);
  const expenses = await db.select().from(expensesTable);
  const incomeEntries = await db.select().from(incomeEntriesTable);
  const salaryRecords = await db.select().from(salaryRecordsTable);
  const teachers = await db.select().from(teachersTable);

  // Monthly trends
  const monthly_trends = months.map((m) => {
    const invoiceRevenue = invoices
      .filter((i) => i.month === m && i.status === "مدفوع")
      .reduce((s, i) => s + Number(i.amount), 0);
    const extraIncome = incomeEntries
      .filter((e) => e.date.startsWith(m))
      .reduce((s, e) => s + Number(e.amount), 0);
    const revenue = invoiceRevenue + extraIncome;

    const expTotal = expenses
      .filter((e) => e.date.startsWith(m))
      .reduce((s, e) => s + Number(e.amount), 0);
    const salaryTotal = salaryRecords
      .filter((s) => s.month === m && s.status === "مدفوع")
      .reduce((s, r) => s + Number(r.totalAmount), 0);
    const expensesTotal = expTotal + salaryTotal;

    return {
      month: m,
      revenue,
      expenses: expensesTotal,
      profit: revenue - expensesTotal,
      salary_cost: salaryTotal,
    };
  });

  // Expense by category
  const expByCategory: Record<string, { total: number; count: number }> = {};
  expenses.forEach((e) => {
    if (!expByCategory[e.category]) expByCategory[e.category] = { total: 0, count: 0 };
    expByCategory[e.category].total += Number(e.amount);
    expByCategory[e.category].count++;
  });
  const expense_by_category = Object.entries(expByCategory).map(([cat, d]) => ({
    category: cat,
    total: d.total,
    count: d.count,
  }));

  // Collection rate
  const totalInvoiced = invoices.filter((i) => !i.isExempt).reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "مدفوع").reduce((s, i) => s + Number(i.amount), 0);
  const collection_rate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
  const total_outstanding = invoices
    .filter((i) => i.status === "غير مدفوع")
    .reduce((s, i) => s + Number(i.amount), 0);

  // Teacher performance
  const teacher_performance = teachers.map((t) => {
    const tSalaries = salaryRecords.filter((s) => s.teacherId === t.id);
    const salary_cost = tSalaries.reduce((s, r) => s + Number(r.totalAmount), 0);
    return {
      teacher_id: t.id,
      teacher_name: t.fullName,
      salary_cost,
      session_count: 0,
      student_count: 0,
    };
  });

  // Income by type
  const incomeByType: Record<string, number> = {};
  incomeEntries.forEach((e) => {
    incomeByType[e.type] = (incomeByType[e.type] ?? 0) + Number(e.amount);
  });
  const income_by_type = Object.entries(incomeByType).map(([type, total]) => ({ type, total }));

  res.json({
    monthly_trends,
    expense_by_category,
    collection_rate,
    total_outstanding,
    teacher_performance,
    income_by_type,
  });
});

export default router;
