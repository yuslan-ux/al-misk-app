import { Produk } from './produk';

// Tipe ini digunakan untuk item di dalam keranjang belanja pada halaman Kasir.
export type CartItem = Produk & {
  quantity: number;
};

// Tipe-tipe berikut digunakan untuk merepresentasikan data riwayat transaksi dari Supabase.

// Merepresentasikan data siswa yang terkait dengan sebuah transaksi.
export type TransaksiSiswa = {
  id: string;
  nis: string;
  nama: string;
};

// Merepresentasikan satu item di dalam sebuah transaksi yang sudah tercatat.
export type TransaksiItem = {
  quantity: number;
  harga_saat_transaksi: number;
  produk: {
    nama: string;
  };
};

// Merepresentasikan satu catatan transaksi lengkap yang diambil dari database.
export type Transaksi = {
  id: string;
  tanggal: string; // String tanggal ISO dari database
  total: number;
  siswa: TransaksiSiswa | null; // Siswa bisa saja null jika datanya terhapus
  transaksi_items: TransaksiItem[];
};