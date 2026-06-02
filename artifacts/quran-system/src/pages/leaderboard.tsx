import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة الشرف</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            أفضل الطلاب هذا الشهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : leaderboard?.length ? (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.student_id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index === 0 ? 'bg-yellow-50/50 border-yellow-200' : 
                    index === 1 ? 'bg-gray-50/50 border-gray-200' :
                    index === 2 ? 'bg-orange-50/50 border-orange-200' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 font-bold text-lg text-muted-foreground">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.photo_url || undefined} />
                      <AvatarFallback>{entry.student_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {entry.student_name}
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                        {index === 2 && <Award className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.circle_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">{entry.points} نقطة</div>
                    {entry.badge && (
                      <div className="text-xs text-muted-foreground">{entry.badge}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد بيانات لوحة الشرف حالياً</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
