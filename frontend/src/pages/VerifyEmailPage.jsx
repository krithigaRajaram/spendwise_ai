import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { useTheme } from "../contexts/ThemeContext";
import logoWhite from "../assets/svgs/SpendWiseLogoWhite.png";
import logoBlack from "../assets/svgs/SpendWiseLogoBlack.png";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function VerifyEmailPage({ onAuth }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSessionExpired(true);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setSessionExpired(true);
      }
    } catch {
      localStorage.removeItem("token");
      setSessionExpired(true);
    }
  }, []);

  const handleSessionExpired = () => {
    localStorage.removeItem("token");
    setSessionExpired(true);
  };

  const verify = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 404) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      onAuth();
      navigate("/dashboard");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 404) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }

      setSuccess("A new verification code has been sent to your email.");
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") verify();
  };

  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <img src={isDark ? logoWhite : logoBlack} alt="SpendWise Logo" width={40} height={40} />
            </div>
            <CardTitle className="text-2xl font-semibold">Session expired</CardTitle>
            <CardDescription>
              Your verification session has expired. Please sign up again to continue.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link to="/signup">
                Sign up again
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <img src={isDark ? logoWhite : logoBlack} alt="SpendWise Logo" width={40} height={40} />
          </div>
          <CardTitle className="text-2xl font-semibold">Verify your email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to your email. Enter it below to activate your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={verify} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                Verify Email
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={resend}
            disabled={resendLoading}>
            {resendLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Resend code
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default VerifyEmailPage;