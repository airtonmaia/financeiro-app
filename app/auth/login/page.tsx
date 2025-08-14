// app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe } from 'lucide-react'; // Using a generic icon

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLogo = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('logo_url')
            .not('logo_url', 'is', null)
            .limit(1);

        if (error) {
            console.error('Erro ao buscar logo:', error);
            return;
        }

        if (data && data.length > 0 && data[0].logo_url) {
            setLogoUrl(data[0].logo_url);
        }
    };
    fetchLogo();
  }, [supabase]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      router.refresh();

    } catch (error: any) {
      setMessage(`Erro ao fazer login: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4 h-16">
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-24" />
            ) : (
                <Globe className="w-12 h-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
          <CardDescription>Faça login para acessar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu.email@exemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="********" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            {message && (
              <p className="text-center text-sm mt-4 p-3 rounded-lg bg-destructive text-destructive-foreground">
                {message}
              </p>
            )}
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Crie uma agora
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
