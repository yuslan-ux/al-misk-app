import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Package, ShoppingCart, History, LogOut, WalletCards, FileClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess } from '@/utils/toast';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/siswa', label: 'Siswa', icon: Users },
  { href: '/produk', label: 'Produk', icon: Package },
  { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { href: '/riwayat', label: 'Riwayat', icon: History },
  { href: '/saldo-massal', label: 'Saldo Massal', icon: WalletCards },
  { href: '/log-penghapusan', label: 'Log Hapus', icon: FileClock },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess('Anda telah berhasil keluar.');
    navigate('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-sky-600 to-indigo-800 text-white flex flex-col p-4">
      <div className="flex flex-col items-center text-center py-8 mb-4">
        <h1 className="text-3xl font-bold tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">AL MISK</h1>
        <p className="text-sm text-sky-200 mt-1">Bersama Menuju Surga</p>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 my-1 rounded-lg transition-all duration-200 ease-in-out',
                  location.pathname === item.href
                    ? 'bg-black/20 text-white font-semibold'
                    : 'text-indigo-100 hover:bg-black/20 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start gap-3 text-indigo-100 hover:bg-black/20 hover:text-white" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span>Keluar</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;