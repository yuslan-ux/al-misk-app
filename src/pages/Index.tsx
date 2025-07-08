import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShoppingCart, Package, History, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    to: "/kasir",
    icon: ShoppingCart,
    title: "Kasir (POS)",
    description: "Lakukan transaksi penjualan untuk siswa dengan cepat.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    to: "/siswa",
    icon: Users,
    title: "Manajemen Siswa",
    description: "Kelola data siswa, termasuk informasi pribadi dan saldo.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    to: "/produk",
    icon: Package,
    title: "Manajemen Produk",
    description: "Kelola daftar produk yang dijual di kantin atau koperasi.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    to: "/riwayat",
    icon: History,
    title: "Riwayat Transaksi",
    description: "Lihat semua transaksi penjualan yang telah tercatat.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Selamat Datang, {user?.email?.split('@')[0] || 'Pengguna'}!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Ini adalah pusat kendali Anda. Apa yang ingin Anda lakukan hari ini?
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.title} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-full ${item.bg}`}>
                <item.icon className={`h-7 w-7 ${item.color}`} />
              </div>
              <div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="mt-1">{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-end text-blue-600">
                <Link to={item.to}>
                  Buka Menu <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Butuh Bantuan?</CardTitle>
            <CardDescription className="text-white/80">
              Jika Anda mengalami kesulitan, jangan ragu untuk melihat dokumentasi atau menghubungi dukungan teknis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary">Hubungi Dukungan</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;