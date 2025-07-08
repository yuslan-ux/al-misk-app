export type Produk = {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  created_at?: string;
  barcode?: string | null;
  gambar_url?: string | null;
};