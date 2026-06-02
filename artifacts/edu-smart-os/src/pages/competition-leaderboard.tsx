import { useState } from "react";
import { useCompetitions, useCompetitionLeaderboard, useCompetitionResults, useCompetitionLevels } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, Award, Medal, Users, Target, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  "ممتاز": "bg-green-100 text-green-700 border-green-300",
  "جيد جداً": "bg-blue-100 text-blue-700 border-blue-300",
  "جيد": "bg-cyan-100 text-cyan-700 border-cyan-300",
  "مقبول": "bg-amber-100 text-amber-700 border-amber-300",
  "يحتاج تحسين": "bg-red-100 text-red-700 border-red-300",
};

export default function CompetitionLeaderboard() {
  const { competitions, loading: compsLoading } = useCompetitions();
  const [selectedCompId, setSelectedCompId] = useState<string>("all");
  const { leaderboard, loading } = useCompetitionLeaderboard(selectedCompId === "all" ? undefined : selectedCompId);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const selectedComp = competitions.find(c => c.id === selectedCompId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-2xl mb-1">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold text-secondary">لوحة صدارة المسابقات</h1>
        <p className="text-muted-foreground">أفضل المتسابقين وأعلى الدرجات — مكتب الفرقان لتحفيظ القرآن الكريم</p>

        {/* Competition Selector */}
        <div className="flex justify-center mt-4">
          <Select value={selectedCompId} onValueChange={setSelectedCompId}>
            <SelectTrigger className="w-64 bg-card border-border/60">
              <SelectValue placeholder="اختر مسابقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المسابقات</SelectItem>
              {competitions.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {leaderboard.length > 0 && (
          <div className="flex justify-center gap-6 pt-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{leaderboard.length} متسابق</span>
            </div>
            {selectedComp && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>{selectedComp.name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading || compsLoading ? (
        <div className="space-y-4 max-w-4xl mx-auto">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border max-w-4xl mx-auto">
          <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد نتائج بعد</p>
          <p className="text-sm mt-1">سيتم عرض المتسابقين بعد تسجيل النتائج في المسابقات</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top 3 Podium */}
          {top3.length >= 1 && (
            <div className="grid grid-cols-3 gap-4 mb-4 items-end">
              {/* 2nd Place */}
              {top3[1] ? (
                <div className="text-center space-y-2">
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 mx-2">
                    <Medal className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-gray-600">2</span>
                    </div>
                    <div className="font-bold text-secondary text-sm truncate">{top3[1].student_name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{top3[1].level_name}</div>
                    {top3[1].best_grade && (
                      <Badge variant="outline" className={cn("text-xs mt-1", GRADE_COLORS[top3[1].best_grade] ?? "")}>{top3[1].best_grade}</Badge>
                    )}
                    <div className="text-xl font-bold text-gray-600 mt-1">{top3[1].best_score}<span className="text-xs font-normal text-muted-foreground">/10</span></div>
                  </div>
                  <div className="bg-gray-200 rounded-t-lg h-14 mx-4" />
                </div>
              ) : <div />}

              {/* 1st Place */}
              <div className="text-center space-y-2">
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-lg shadow-amber-200">
                  <Crown className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-amber-700">1</span>
                  </div>
                  <div className="font-bold text-secondary truncate">{top3[0].student_name}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{top3[0].level_name}</div>
                  {top3[0].best_grade && (
                    <Badge className={cn("text-xs mt-1", GRADE_COLORS[top3[0].best_grade] ?? "bg-green-100 text-green-700")}>{top3[0].best_grade}</Badge>
                  )}
                  <div className="text-2xl font-bold text-amber-600 mt-1">{top3[0].best_score}<span className="text-sm font-normal text-muted-foreground">/10</span></div>
                  {top3[0].degree > 0 && <div className="text-xs text-muted-foreground">درجة: {top3[0].degree}</div>}
                </div>
                <div className="bg-amber-300 rounded-t-lg h-20 mx-4" />
              </div>

              {/* 3rd Place */}
              {top3[2] ? (
                <div className="text-center space-y-2">
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mx-2">
                    <Award className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-orange-600">3</span>
                    </div>
                    <div className="font-bold text-secondary text-sm truncate">{top3[2].student_name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{top3[2].level_name}</div>
                    {top3[2].best_grade && (
                      <Badge variant="outline" className={cn("text-xs mt-1", GRADE_COLORS[top3[2].best_grade] ?? "")}>{top3[2].best_grade}</Badge>
                    )}
                    <div className="text-xl font-bold text-orange-600 mt-1">{top3[2].best_score}<span className="text-xs font-normal text-muted-foreground">/10</span></div>
                  </div>
                  <div className="bg-orange-200 rounded-t-lg h-10 mx-4" />
                </div>
              ) : <div />}
            </div>
          )}

          {/* Rest of Leaderboard */}
          {rest.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  بقية المتسابقين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rest.map((entry, idx) => (
                  <div key={entry.student_id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                      {idx + 4}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary truncate">{entry.student_name}</p>
                      <p className="text-xs text-muted-foreground">{entry.level_name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {entry.best_grade && (
                        <Badge variant="outline" className={cn("text-xs hidden sm:flex", GRADE_COLORS[entry.best_grade] ?? "")}>{entry.best_grade}</Badge>
                      )}
                      {entry.degree > 0 && <span className="text-xs text-muted-foreground hidden sm:block">درجة: {entry.degree}</span>}
                      <div className="text-center">
                        <div className="text-lg font-bold text-secondary">{entry.best_score}</div>
                        <div className="text-xs text-muted-foreground">من 10</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "إجمالي المتسابقين", value: leaderboard.length, icon: Users, color: "text-primary bg-primary/10" },
              { label: "الحاصلون على ممتاز", value: leaderboard.filter(e => e.best_grade === "ممتاز").length, icon: Crown, color: "text-green-700 bg-green-100" },
              { label: "الحاصلون على جيد جداً", value: leaderboard.filter(e => e.best_grade === "جيد جداً").length, icon: Star, color: "text-blue-700 bg-blue-100" },
              { label: "متوسط التقييم", value: leaderboard.length > 0 ? (leaderboard.reduce((s, e) => s + e.best_score, 0) / leaderboard.length).toFixed(1) : "0", icon: Target, color: "text-amber-700 bg-amber-100" },
            ].map((stat, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="pt-4 pb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", stat.color.split(" ")[1])}>
                    <stat.icon className={cn("h-4 w-4", stat.color.split(" ")[0])} />
                  </div>
                  <div className="text-2xl font-bold text-secondary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
