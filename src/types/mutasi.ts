import { Siswa } from './siswa';

export type MutasiTipe = 'PEMBELIAN' | 'DEPOSIT' | 'PENARIKAN';

export type MutasiProduk = {
  nama: string;
};

export type MutasiTransaksiItem = {
  quantity: number;
  harga_saat_transaksi: number;
  produk: MutasiProduk;
};

export type MutasiTransaksi = {
  id: string;
  transaksi_items: MutasiTransaksiItem[];
};

export type MutasiSaldo = {
  id: string;
  tanggal_transaksi: string;
  tipe: MutasiTipe;
  jumlah: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  keterangan: string | null;
  siswa: Pick<Siswa, 'nis' | 'nama'> | null;
  transaksi: MutasiTransaksi | null; // Transaksi akan ada jika tipe 'PEMBELIAN'
};