import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Shield, MapPin, Plus, User as UserIcon, LogOut } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SafetyNet</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Reports
              </Link>
              <Link
                to="/map"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/map') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Map View
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Button asChild size="sm">
                    <Link to="/report">
                      <Plus className="h-4 w-4 mr-2" />
                      Report Incident
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth?mode=signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-border">
            <nav className="flex justify-around py-2">
              <Link
                to="/"
                className={`flex flex-col items-center py-2 px-3 text-xs ${
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Shield className="h-5 w-5 mb-1" />
                Reports
              </Link>
              <Link
                to="/map"
                className={`flex flex-col items-center py-2 px-3 text-xs ${
                  isActive('/map') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <MapPin className="h-5 w-5 mb-1" />
                Map
              </Link>
              {user ? (
                <>
                  <Link
                    to="/report"
                    className={`flex flex-col items-center py-2 px-3 text-xs ${
                      isActive('/report') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Plus className="h-5 w-5 mb-1" />
                    Report
                  </Link>
                  <Link
                    to="/dashboard"
                    className={`flex flex-col items-center py-2 px-3 text-xs ${
                      isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <UserIcon className="h-5 w-5 mb-1" />
                    Profile
                  </Link>
                </>
              ) : (
                <Link
                  to="/auth"
                  className={`flex flex-col items-center py-2 px-3 text-xs ${
                    isActive('/auth') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <UserIcon className="h-5 w-5 mb-1" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}