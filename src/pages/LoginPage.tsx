import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import SpecterBrand from "@/components/specter/SpecterBrand";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const messageFor = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

const LoginPage = () => {
  const {
    user,
    loading,
    demoMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signingIn, setSigningIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSigningIn(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast({ title: "Account created", description: "Check your email if confirmation is enabled." });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      toast({
        title: isSignUp ? "Sign-up failed" : "Sign-in failed",
        description: messageFor(error),
        variant: "destructive",
      });
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: messageFor(error),
        variant: "destructive",
      });
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
        <div className="mt-8 border border-border bg-card p-8">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Create an investigator account" : "Sign in to Specter"}
          </p>
          <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <Button type="submit" disabled={signingIn} className="h-11 w-full">
              {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? "Sign up" : "Sign in"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setIsSignUp((value) => !value)}
            className="mt-4 text-sm font-medium hover:underline"
          >
            {isSignUp ? "Already have an account?" : "Create an account"}
          </button>
          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            variant="outline"
            className="h-11 w-full gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
