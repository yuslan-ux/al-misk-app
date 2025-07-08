import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const LoginPage = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Tampilkan halaman kosong selagi memeriksa sesi
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AL MISK</CardTitle>
          <CardDescription>Silakan masuk untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Alamat Email',
                  password_label: 'Kata Sandi',
                  button_label: 'Masuk',
                  link_text: 'Sudah punya akun? Masuk',
                },
                sign_up: {
                  email_label: 'Alamat Email',
                  password_label: 'Kata Sandi',
                  button_label: 'Daftar',
                  link_text: 'Belum punya akun? Daftar',
                },
                forgotten_password: {
                    email_label: 'Alamat Email',
                    button_label: 'Kirim Instruksi Reset',
                    link_text: 'Lupa kata sandi?',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;