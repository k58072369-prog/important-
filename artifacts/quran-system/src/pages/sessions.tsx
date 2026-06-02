import { useState } from "react";
import { useListSessions, getListSessionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { SessionModal } from "@/components/modals/session-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "مكتملة": "bg-green-100 text-green-800",
    "جارية": "bg-blue-100 text-blue-800",
    "مؤجلة": "bg-yellow-100 text-yellow-800",
    "ملغاة": "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function Sessions() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: sessions, isLoading } = useListSessions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الحصص</h1>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          إنشاء حصة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل الحصص ({sessions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : sessions?.length ? (
            <div className="divide-y">
              {sessions.map(session => (
                <div key={session.id} className="py-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-base">{session.circle_name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {session.date} — {session.teacher_name ?? "بدون معلم"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      الحضور: {session.present_count ?? 0}/{session.student_count ?? 0}
                    </div>
                    <StatusBadge status={session.status ?? ""} />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/sessions/${session.id}`} className="flex items-center gap-1">
                        التفاصيل
                        <ChevronLeft className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد حصص مسجلة</p>
          )}
        </CardContent>
      </Card>

      <SessionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
