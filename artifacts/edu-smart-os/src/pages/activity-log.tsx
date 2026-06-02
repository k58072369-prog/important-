import { useState } from "react";
import { useActivityLog } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History, Search, Plus, Edit, Trash2, RotateCcw, AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  ADD:              { label: "إضافة",        color: "text-green-700",  bgColor: "bg-green-50 border-green-200",   icon: Plus },
  UPDATE:           { label: "تعديل",         color: "text-blue-700",   bgColor: "bg-blue-50 border-blue-200",     icon: Edit },
  DELETE:           { label: "حذف",           color: "text-amber-700",  bgColor: "bg-amber-50 border-amber-200",   icon: Trash2 },
  RESTORE:          { label: "استعادة",        color: "text-emerald-700",bgColor: "bg-emerald-50 border-emerald-200", icon: RotateCcw },
  PERMANENT_DELETE: { label: "حذف نهائي",     color: "text-red-700",    bgColor: "bg-red-50 border-red-200",       icon: AlertTriangle },
};

const PAGE_SIZE = 50;

export default function ActivityLogPage() {
  const { logs, loading } = useActivityLog();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);

  const entityTypes = [...new Set(logs.map(l => l.entity_type))].sort();

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !q || (log.entity_name ?? "").toLowerCase().includes(q) || log.entity_type.toLowerCase().includes(q) || (log.details ?? "").toLowerCase().includes(q);
    const matchAction = filterAction === "all" || log.action === filterAction;
    const matchType   = filterType === "all" || log.entity_type === filterType;
    return matchSearch && matchAction && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary flex items-center gap-2">
          <History className="h-8 w-8 text-primary" />
          سجل العمليات
        </h1>
        <p className="text-muted-foreground mt-1">سجل كامل بجميع العمليات التي تمت داخل النظام</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(ACTION_CONFIG).map(([action, cfg]) => {
          const count = logs.filter(l => l.action === action).length;
          const Icon = cfg.icon;
          return (
            <Card key={action} className={`border cursor-pointer transition-all hover:shadow-sm ${filterAction === action ? "ring-2 ring-primary" : "border-gold-500/20"}`} onClick={() => handleFilterChange(setFilterAction)(filterAction === action ? "all" : action)}>
              <CardContent className="pt-3 pb-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.color}`} />
                <div className={`text-xl font-bold ${cfg.color}`}>{count}</div>
                <div className="text-xs text-muted-foreground">{cfg.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-gold-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم العنصر أو التفاصيل..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pr-9"
              />
            </div>
            <Select value={filterAction} onValueChange={handleFilterChange(setFilterAction)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العمليات</SelectItem>
                {Object.entries(ACTION_CONFIG).map(([action, cfg]) => (
                  <SelectItem key={action} value={action}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={handleFilterChange(setFilterType)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع العنصر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30 animate-spin" />
              <p>جارٍ تحميل السجل...</p>
            </div>
          ) : !paginated.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>لا توجد عمليات مسجلة</p>
              {(search || filterAction !== "all" || filterType !== "all") && (
                <p className="text-sm mt-1">جرب تعديل معايير البحث أو الفلترة</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-muted-foreground bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tr-lg">العملية</th>
                    <th className="px-4 py-3">نوع العنصر</th>
                    <th className="px-4 py-3">اسم العنصر</th>
                    <th className="px-4 py-3">التفاصيل</th>
                    <th className="px-4 py-3 rounded-tl-lg text-left">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(log => {
                    const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, color: "text-muted-foreground", bgColor: "bg-muted", icon: History };
                    const Icon = cfg.icon;
                    return (
                      <tr key={log.id} className="border-b border-muted/60 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bgColor} ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{log.entity_name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-48 truncate">{log.details ?? "—"}</td>
                        <td className="px-4 py-3 text-left text-muted-foreground text-xs" dir="ltr">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} من {filtered.length} سجل
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحة {page} من {totalPages}
            </span>
            <Button
              size="sm" variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
