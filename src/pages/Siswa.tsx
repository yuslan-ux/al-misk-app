import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription as CardDesc,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Siswa } from "@/types/siswa";
import { SiswaForm } from "@/components/SiswaForm";
import { SiswaBulkForm } from "@/components/SiswaBulkForm";
import { SiswaMutasiDialog } from "@/components/SiswaMutasiDialog";
import { Trash2, Upload, Search } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const SiswaPage = () => {
  const queryClient = useQueryClient();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | undefined>(undefined);
  const [viewingHistorySiswa, setViewingHistorySiswa] = useState<Siswa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: siswaList, isLoading, isError } = useQuery<Siswa[]>({
    queryKey: ["siswa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siswa")
        .select("*")
        .order("nama", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const filteredSiswa = useMemo(() => {
    if (!siswaList) return [];
    return siswaList.filter(
      (siswa) =>
        siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        siswa.nis.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [siswaList, searchTerm]);

  const createSiswaMutation = useMutation({
    mutationFn: async (newSiswa: Omit<Siswa, "id" | "created_at">) => {
      const { error } = await supabase.from("siswa").insert(newSiswa);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      showSuccess("Siswa baru berhasil ditambahkan!");
      setIsFormDialogOpen(false);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const createBulkSiswaMutation = useMutation({
    mutationFn: async (newSiswaList: Omit<Siswa, "id" | "created_at">[]) => {
      const { error } = await supabase.from("siswa").insert(newSiswaList);
      if (error) {
        if (error.code === '23505') {
          throw new Error("Gagal: Terdapat duplikasi NIS. Pastikan semua NIS unik dan belum terdaftar.");
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      showSuccess("Semua data siswa berhasil diimpor!");
      setIsBulkDialogOpen(false);
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });

  const updateSiswaMutation = useMutation({
    mutationFn: async (updatedSiswa: Omit<Siswa, "created_at" | "saldo">) => {
      const { id, ...dataToUpdate } = updatedSiswa;
      const { error } = await supabase.from("siswa").update(dataToUpdate).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      showSuccess("Data siswa berhasil diperbarui!");
      setIsFormDialogOpen(false);
      setEditingSiswa(undefined);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const deleteSiswaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("siswa").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      showSuccess("Data siswa berhasil dihapus.");
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const handleFormSubmit = (data: Omit<Siswa, "id" | "created_at">) => {
    if (editingSiswa) {
      const { saldo, ...rest } = data; // Exclude saldo from update
      updateSiswaMutation.mutate({ ...rest, id: editingSiswa.id });
    } else {
      createSiswaMutation.mutate(data);
    }
  };

  const handleBulkFormSubmit = (data: Omit<Siswa, "id" | "created_at">[]) => {
    createBulkSiswaMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data siswa ini?")) {
      deleteSiswaMutation.mutate(id);
    }
  };

  const openNewSiswaDialog = () => {
    setEditingSiswa(undefined);
    setIsFormDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Manajemen Siswa</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <CardTitle>Daftar Siswa</CardTitle>
              <CardDesc className="mt-1">
                Cari, tambah, edit, dan lihat riwayat siswa.
              </CardDesc>
            </div>
            <div className="flex gap-2">
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Impor
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Impor Siswa Massal</DialogTitle>
                    <DialogDescription>
                      Unggah file .xlsx atau .csv. Pastikan file memiliki kolom: nis, nama, kelas, saldo.
                    </DialogDescription>
                  </DialogHeader>
                  <SiswaBulkForm
                    onBulkSubmit={handleBulkFormSubmit}
                    onClose={() => setIsBulkDialogOpen(false)}
                    isSubmitting={createBulkSiswaMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewSiswaDialog}>Tambah Siswa</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingSiswa ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
                  </DialogHeader>
                  <SiswaForm
                    onSubmit={handleFormSubmit}
                    initialData={editingSiswa}
                    onClose={() => setIsFormDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-28 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-red-500">
                      Gagal memuat data siswa.
                    </TableCell>
                  </TableRow>
                ) : filteredSiswa.length > 0 ? (
                  filteredSiswa.map((siswa, index) => (
                    <TableRow key={siswa.id} className={index % 2 !== 0 ? 'bg-muted' : ''}>
                      <TableCell>{siswa.nis}</TableCell>
                      <TableCell className="font-medium">{siswa.nama}</TableCell>
                      <TableCell>{siswa.kelas}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(siswa.saldo)}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button size="sm" onClick={() => setViewingHistorySiswa(siswa)}>
                          RIWAYAT
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(siswa.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Tidak ada data siswa yang cocok dengan pencarian Anda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {viewingHistorySiswa && (
        <SiswaMutasiDialog
          isOpen={!!viewingHistorySiswa}
          onClose={() => setViewingHistorySiswa(null)}
          siswaId={viewingHistorySiswa.id}
          siswaName={viewingHistorySiswa.nama}
        />
      )}
    </div>
  );
};

export default SiswaPage;