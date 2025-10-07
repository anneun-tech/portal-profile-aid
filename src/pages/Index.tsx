import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import heroBanner from "@/assets/ncc-hero-banner.jpg";
import nccLogo from "@/assets/ncc-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      checkAdmin();
    }
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={isAdmin} />

      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center text-white z-10 px-4">
          <img src={nccLogo} alt="NCC Logo" className="h-24 w-24 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">NCC Air Wing</h1>
          <p className="text-2xl mb-8">Student Information Portal</p>
          {!user && (
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8"
            >
              Sign In to Continue
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="shadow-elegant transition-all hover:scale-105">
            <CardHeader>
              <CardTitle className="text-primary">Student Portal</CardTitle>
              <CardDescription>Manage your profile and details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access and update your personal information, NCC details, and experience records.
              </p>
              {user && (
                // In Index.tsx, update all instances of navigate("/student-portal")
                <Button onClick={() => navigate("/profile")} className="w-full">
                  My Profile
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant transition-all hover:scale-105">
            <CardHeader>
              <CardTitle className="text-primary">NCC Details</CardTitle>
              <CardDescription>Track your NCC journey</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Record your NCC wing, regimental number, ranks, and enrollment information.
              </p>
              {user && (
                <Button onClick={() => navigate("/student-portal")} variant="secondary" className="w-full">
                  Update Details
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant transition-all hover:scale-105">
            <CardHeader>
              <CardTitle className="text-primary">Experience</CardTitle>
              <CardDescription>Document your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Add and manage your internship and placement records for future reference.
              </p>
              {user && (
                <Button onClick={() => navigate("/student-portal")} variant="secondary" className="w-full">
                  Add Experience
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {user && (
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Welcome, {user.email}</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Your student portal is ready. Keep your information up to date!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
