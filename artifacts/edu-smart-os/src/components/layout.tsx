import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Users, GraduationCap, CircleDot, CalendarDays,
  Wallet, Bell, Trophy, BookOpen, Medal, Shield, BarChart3, FileText,
  Volume2, VolumeX, Trash2, History,
} from "lucide-react";
import { BackupPanel } from "@/components/backup-panel";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isPrayerReminderEnabled, setPrayerReminderEnabled } from "@/components/audio-manager";

function PrayerToggle() {
  const [enabled, setEnabled] = useState(isPrayerReminderEnabled);
  const toggle = () => {
    const next = !enabled;
    setPrayerReminderEnabled(next);
    setEnabled(next);
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gold-500/70 hover:text-gold-500 hover:bg-sidebar-accent/30 text-xs"
          onClick={toggle}
        >
          {enabled
            ? <Volume2 className="h-4 w-4 text-blue-400" />
            : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          {enabled ? "تنبيه الصلاة: مفعّل" : "تنبيه الصلاة: معطّل"}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">تشغيل / إيقاف تنبيه الصلاة كل 5 دقائق</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const [backupOpen, setBackupOpen] = useState(false);

  const mainNav = [
    { name: "لوحة التحكم", path: "/", icon: LayoutDashboard },
    { name: "الطلاب", path: "/students", icon: Users },
    { name: "المعلمون", path: "/teachers", icon: GraduationCap },
    { name: "الحلقات", path: "/circles", icon: CircleDot },
    { name: "الحصص", path: "/sessions", icon: CalendarDays },
    { name: "الدورات", path: "/courses", icon: BookOpen },
    { name: "المسابقات", path: "/competitions", icon: Medal },
    { name: "الشؤون المالية", path: "/finance", icon: Wallet },
    { name: "الإشعارات", path: "/notifications", icon: Bell },
    { name: "لوحة الصدارة", path: "/leaderboard", icon: Trophy },
    { name: "صدارة المسابقات", path: "/competition-leaderboard", icon: Trophy },
    { name: "التقارير والتحليلات", path: "/reports", icon: BarChart3 },
    { name: "التقارير الشهرية", path: "/monthly-reports", icon: FileText },
  ];

  const systemNav = [
    { name: "سلة المحذوفات", path: "/trash", icon: Trash2 },
    { name: "سجل العمليات", path: "/activity-log", icon: History },
  ];

  const navItem = (item: { name: string; path: string; icon: React.ElementType }) => (
    <SidebarMenuItem key={item.path}>
      <SidebarMenuButton
        asChild
        isActive={location === item.path || (item.path !== "/" && location.startsWith(item.path))}
      >
        <Link href={item.path} className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar className="border-l border-sidebar-border" side="right">
        <div className="flex h-20 items-center px-5 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground flex-col justify-center gap-0.5">
          <h1 className="text-base font-bold tracking-tight text-gold-500 leading-tight text-center">مكتب الفرقان</h1>
          <p className="text-xs text-gold-500/70 text-center">لتحفيظ القرآن الكريم</p>
        </div>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map(navItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>إدارة النظام</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemNav.map(navItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <PrayerToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-gold-500/70 hover:text-gold-500 hover:bg-sidebar-accent/30 text-xs"
                onClick={() => setBackupOpen(true)}
              >
                <Shield className="h-4 w-4 text-green-400" />
                النسخ الاحتياطية
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">إدارة النسخ الاحتياطية وسلامة البيانات</TooltipContent>
          </Tooltip>
          <p className="text-xs text-center text-gold-500/50">نظام إدارة متكامل</p>
        </div>
      </Sidebar>
      <BackupPanel open={backupOpen} onClose={() => setBackupOpen(false)} />
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-background/95 relative z-10">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/arabesque.png')]" />
          <div className="p-6 md:p-8 lg:p-10 relative z-20 flex-1 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
