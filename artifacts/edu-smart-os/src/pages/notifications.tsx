import { useNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, AlertCircle, ShieldAlert, DollarSign, Star, Info, Trophy, BookOpen, Medal, GraduationCap, Trash2, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const TYPE_FILTERS = ["الكل", "غياب", "مالي", "رواتب", "إنجاز", "أداء", "دورات", "مسابقات", "system"];

export default function Notifications() {
  const { notifications, loading } = useNotifications();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("الكل");

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast({ title: "تم تحديد جميع الإشعارات كمقروءة" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "غياب":    return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "مالي":    return <DollarSign className="h-5 w-5 text-destructive" />;
      case "رواتب":   return <GraduationCap className="h-5 w-5 text-blue-500" />;
      case "إنجاز":   return <Star className="h-5 w-5 text-accent" />;
      case "system":  return <ShieldAlert className="h-5 w-5 text-primary" />;
      case "أداء":    return <Info className="h-5 w-5 text-blue-500" />;
      case "دورات":   return <BookOpen className="h-5 w-5 text-violet-500" />;
      case "مسابقات": return <Medal className="h-5 w-5 text-amber-600" />;
      default:         return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "غياب":    return "bg-amber-100 text-amber-700 border-amber-300";
      case "مالي":    return "bg-red-100 text-red-700 border-red-300";
      case "رواتب":   return "bg-blue-100 text-blue-700 border-blue-300";
      case "إنجاز":   return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "دورات":   return "bg-violet-100 text-violet-700 border-violet-300";
      case "مسابقات": return "bg-orange-100 text-orange-700 border-orange-300";
      case "system":  return "bg-green-100 text-green-700 border-green-300";
      case "أداء":    return "bg-cyan-100 text-cyan-700 border-cyan-300";
      default:         return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string | null | undefined) =>
    priority === "عاجل" ? "text-destructive border-destructive bg-destructive/5" :
    priority === "مهم" ? "text-amber-600 border-amber-400 bg-amber-50" :
    "text-muted-foreground border-muted";

  const filtered = typeFilter === "الكل" ? notifications : notifications.filter(n => n.type === typeFilter);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Count per type
  const typeCounts: Record<string, number> = {};
  for (const n of notifications) {
    typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 ml-2" />
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(type => {
          const count = type === "الكل" ? notifications.length : typeCounts[type] ?? 0;
          if (count === 0 && type !== "الكل") return null;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                typeFilter === type
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card border-border/60 text-muted-foreground hover:border-primary/30 hover:text-secondary"
              )}
            >
              {type === "الكل" ? <Bell className="h-3 w-3" /> : getIcon(type)}
              {type}
              <span className={cn("text-xs rounded-full px-1 min-w-[1.1rem] text-center", typeFilter === type ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">لا توجد إشعارات</p>
            <p className="text-sm mt-1">ستظهر الإشعارات هنا عند وجودها</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => (
            <Card
              key={notif.id}
              className={cn(
                "border transition-all hover:shadow-sm",
                !notif.is_read
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border/60 bg-card"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0 mt-0.5",
                    !notif.is_read ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn("font-bold text-base", !notif.is_read ? "text-secondary" : "text-muted-foreground")}>{notif.title}</h3>
                        <Badge variant="outline" className={cn("text-xs", getTypeBadgeColor(notif.type))}>{notif.type}</Badge>
                        {notif.priority && notif.priority !== "عادي" && (
                          <Badge variant="outline" className={cn("text-xs border", getPriorityColor(notif.priority))}>{notif.priority}</Badge>
                        )}
                        {!notif.is_read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(notif.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className={cn("text-sm mt-1", !notif.is_read ? "text-secondary/80" : "text-muted-foreground")}>{notif.message}</p>

                    {(notif.student_name || notif.teacher_name) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.student_name ? `الطالب: ${notif.student_name}` : `المعلم: ${notif.teacher_name}`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.is_read && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary hover:bg-primary/10 rounded-full" onClick={() => handleMarkRead(notif.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDelete(notif.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
