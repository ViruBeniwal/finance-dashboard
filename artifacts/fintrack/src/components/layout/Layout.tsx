import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetSummary, useDeleteAllTransactions } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  TrendingUp,
  BarChart3,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const queryClient = useQueryClient();
  const { data: summary } = useGetSummary();
  const deleteMutation = useDeleteAllTransactions();

  const isSampleData = summary?.isSampleData ?? false;
  const showBanner = isSampleData && !bannerDismissed;

  const handleClearSampleData = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setBannerDismissed(true);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border">
        <div className="flex p-6 border-b border-border">
          <span className="font-bold text-2xl text-primary tracking-tight">
            Fintrack
          </span>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center px-4 h-14 bg-card border-b border-border">
        <span className="font-bold text-lg text-primary tracking-tight">
          Fintrack
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {showBanner && (
          <div className="bg-primary/5 border-b border-primary/20 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-primary font-medium">
              You're viewing sample data.
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearSampleData}
                disabled={deleteMutation.isPending}
              >
                Clear all sample data
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss"
              >
                <XCircle size={16} />
              </Button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
