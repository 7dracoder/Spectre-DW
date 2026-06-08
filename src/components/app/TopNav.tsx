import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, Plus, Settings as SettingsIcon, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SpecterBrand from "@/components/specter/SpecterBrand";
import { useToast } from "@/hooks/use-toast";

const TopNav = () => {
  const { signOut, user, demoMode } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <SpecterBrand to="/dashboard" size="md" />

        <div className="hidden items-center gap-2 md:flex">
          <Button
            asChild
            size="sm"
            variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
            className="h-8 text-xs"
          >
            <Link to="/dashboard">Dossiers</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={location.pathname === "/settings" ? "secondary" : "ghost"}
            className="h-8 text-xs"
          >
            <Link to="/settings">Configuration</Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs">
            <Link to="/investigate">
              <Plus className="mr-1 h-3 w-3" />
              New
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <UserRound className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="border-b border-border px-2 py-2">
                <p className="truncate text-sm font-medium">
                  {demoMode
                    ? "Demo Investigator"
                    : user?.user_metadata?.display_name || "Investigator"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/settings">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configuration
                </Link>
              </DropdownMenuItem>
              {!demoMode && (
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="border-border bg-background pt-12">
              <div className="flex flex-col gap-2">
                <SheetClose asChild>
                  <Link to="/dashboard" className="flex min-h-[44px] items-center text-sm">
                    Dossiers
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/investigate" className="flex min-h-[44px] items-center text-sm">
                    New investigation
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/settings" className="flex min-h-[44px] items-center text-sm">
                    Configuration
                  </Link>
                </SheetClose>
                {!demoMode && (
                  <button
                    onClick={handleSignOut}
                    className="flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;

