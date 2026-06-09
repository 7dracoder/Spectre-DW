import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpecterBrand from "@/components/specter/SpecterBrand";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const { user, loading, demoMode, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
      navigate("/dashboard", { replace: true });
    } catch {
      toast({
        title: "Could not open workspace",
        description: "The workspace is temporarily unavailable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSigningIn(false);
    }
  };

  if (loading || demoMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <SpecterBrand to="/" size="lg" className="justify-center" />
        <div className="mt-8 border border-border bg-card p-8 md:p-10">
          <LockKeyhole className="mx-auto h-6 w-6 text-primary" />
          <h1 className="mt-5 text-3xl font-medium tracking-[-0.025em]">
            Enter your review workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Continue to your private dossier workspace. Your session remains tied
            to this browser until you sign out.
          </p>
          <Button
            onClick={handleSignIn}
            disabled={signingIn}
            className="mt-6 h-11 w-full"
          >
            {signingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
