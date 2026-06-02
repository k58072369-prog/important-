import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BookOpen, Users, GraduationCap, Calendar, LineChart, Trophy, DollarSign, LayoutDashboard, HardDrive } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "لوحة التحكم", href: "/", icon: LayoutDashboard },
    { name: "الطلاب", href: "/students", icon: Users },
    { name: "المعلمون", href: "/teachers", icon: GraduationCap },
    { name: "الحلقات", href: "/circles", icon: BookOpen },
    { name: "الحصص", href: "/sessions", icon: Calendar },
    { name: "المالية", href: "/finance", icon: DollarSign },
    { name: "التقارير", href: "/reports", icon: LineChart },
    { name: "لوحة الشرف", href: "/leaderboard", icon: Trophy },
    { name: "إدارة التخزين", href: "/storage", icon: HardDrive },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      <Sidebar side="right">
        <SidebarHeader className="border-b px-6 py-4">
          <h1 className="text-xl font-bold text-primary">نظام إدارة الحلقات</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location === item.href}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
