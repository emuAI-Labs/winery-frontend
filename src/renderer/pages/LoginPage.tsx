import { useState, FormEvent } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import describeAuthError from '@/lib/authErrors';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const lastError = useAuthStore((s) => s.lastError);
  const offline = useAuthStore((s) => s.offline);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password || submitting) return;
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Winery POS</CardTitle>
          <CardDescription>Sign in to start your shift</CardDescription>
        </CardHeader>
        <CardContent>
          {offline && (
            <Alert variant="warning" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Offline — showing your last signed-in session.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {lastError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {describeAuthError(lastError)}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !username || !password}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
