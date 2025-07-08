import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription as CardDesc,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Produk } from "@/types/produk";
import { ProdukForm, ProdukFormValues } from "@/components/ProdukForm";
import { ProdukBulkForm } from "@/components/ProdukBulkForm";
import { Pencil, Trash2, Upload, Package } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const ProdukPage = () => {
  const queryClient = useQueryClient();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState<Produk | undefined>(undefined);

  const { data: produkList, isLoading, isError } = useQuery({
    queryKey: ["produk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produk")
        .select("*")
        .order("nama", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Gagal mengunggah gambar: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
    if (!urlData.publicUrl) throw new Error("Gagal mendapatkan URL publik untuk gambar.");
    
    return urlData.publicUrl;
  };

  const formSubmitMutation = useMutation({
    mutationFn: async (data: ProdukFormValues) => {
      let imageUrl = editingProduk?.gambar_url || null;

      if (data.gambar_file) {
        if (editingProduk?.gambar_url) {
          const oldPath = new URL(editingProduk.gambar_url).pathname.split('/product-images/')[1];
          if (oldPath) await supabase.storage.from('product-images').remove([oldPath]);
        }
        imageUrl = await uploadImage(data.gambar_file);
      }

      const produkData = {
        nama: data.nama,
        harga: data.harga,
        stok: data.stok,
        barcode: data.barcode,
        gambar_url: imageUrl,
      };

      if (editingProduk) {
        const { error } = await supabase.from("produk").update(produkData).eq("id", editingProduk.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produk").insert([produkData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      showSuccess(editingProduk ? "Produk berhasil diperbarui!" : "Produk berhasil ditambahkan!");
      setIsFormDialogOpen(false);
      setEditingProduk(undefined);
    },
    onError: (error: any) => showError(error.message),
  });

  const createBulkProdukMutation = useMutation({
    mutationFn: async (newProdukList: Omit<Produk, "id" | "created_at" | "gambar_url">[]) => {
      const { error } = await supabase.from("produk").insert(newProdukList);
      if (error) {
        if (error.code === '23505') throw new Error("Gagal: Terdapat duplikasi barcode.");
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      showSuccess("Semua data produk berhasil diimpor!");
      setIsBulkDialogOpen(false);
    },
    onError: (error: Error) => showError(error.message),
  });

  const deleteProdukMutation = useMutation({
    mutationFn: async (produk: Produk) => {
      if (produk.gambar_url) {
        const path = new URL(produk.gambar_url).pathname.split('/product-images/')[1];
        if (path) await supabase.storage.from('product-images').remove([path]);
      }
      const { error } = await supabase.from("produk").delete().eq("id", produk.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      showSuccess("Data produk berhasil dihapus.");
    },
    onError: (error) => showError(error.message),
  });

  const handleFormSubmit = (data: ProdukFormValues) => formSubmitMutation.mutate(data);
  const handleBulkFormSubmit = (data: Omit<Produk, "id" | "created_at" | "gambar_url">[]) => createBulkProdukMutation.mutate(data);
  const handleEdit = (produk: Produk) => {
    setEditingProduk(produk);
    setIsFormDialogOpen(true);
  };
  const handleDelete = (produk: Produk) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini? Gambar terkait juga akan dihapus.")) {
      deleteProdukMutation.mutate(produk);
    }
  };
  const openNewProdukDialog = () => {
    setEditingProduk(undefined);
    setIsFormDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Manajemen Produk</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <div>
              <CardTitle>Daftar Produk</CardTitle>
              <CardDesc className="mt-1">
                Kelola semua produk yang tersedia, termasuk stok dan harga.
              </CardDesc>
            </div>
            <div className="flex gap-2">
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />Impor</Button></DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Impor Produk Massal</DialogTitle>
                    <DialogDescription>Unggah file .xlsx atau .csv. Pastikan file memiliki kolom: nama, harga, stok. Kolom 'barcode' bersifat opsional.</DialogDescription>
                  </DialogHeader>
                  <ProdukBulkForm onBulkSubmit={handleBulkFormSubmit} onClose={() => setIsBulkDialogOpen(false)} isSubmitting={createBulkProdukMutation.isPending} />
                </DialogContent>
              </Dialog>
              <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild><Button onClick={openNewProdukDialog}>Tambah Produk</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>{editingProduk ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle></DialogHeader>
                  <ProdukForm onSubmit={handleFormSubmit} initialData={editingProduk} onClose={() => setIsFormDialogOpen(false)} isSubmitting={formSubmitMutation.isPending} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Gambar</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-red-500">Gagal memuat data produk.</TableCell></TableRow>
                ) : produkList && produkList.length > 0 ? (
                  produkList.map((produk, index) => (
                    <TableRow key={produk.id} className={index % 2 !== 0 ? 'bg-muted' : ''}>
                      <TableCell>
                        {produk.gambar_url ? (
                          <img src={produk.gambar_url} alt={produk.nama} className="h-12 w-12 object-cover rounded-md border" />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center border"><Package className="h-6 w-6 text-gray-400" /></div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{produk.nama}</TableCell>
                      <TableCell>{produk.barcode || "-"}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(produk.harga)}</TableCell>
                      <TableCell className="text-right">{produk.stok}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(produk)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(produk)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Tidak ada data produk.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdukPage;