import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MutasiSaldo, MutasiTipe } from "@/types/mutasi";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { id } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar as CalendarIcon, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateString));

const RiwayatMutasiPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedTipes, setSelectedTipes] = useState<MutasiTipe[]>(['DEPOSIT', 'PENARIKAN', 'PEMBELIAN']);
  const [deletingMutation, setDeletingMutation] = useState<MutasiSaldo | null>(null);
  const [reason, setReason] = useState("");

  const { data: mutasiHistory, isLoading, isError } = useQuery<MutasiSaldo[]>({
    queryKey: ["mutasi_saldo", date, selectedTipes],
    queryFn: async () => {
      if (selectedTipes.length === 0) {
        return [];
      }

      let query = supabase
        .from('mutasi_saldo')
        .select(`
          *,
          siswa (nis, nama),
          transaksi (
            id,
            transaksi_items (
              quantity,
              harga_saat_transaksi,
              produk (nama)
            )
          )
        `)
        .order('tanggal_transaksi', { ascending: false });

      if (date?.from) {
        query = query.gte('tanggal_transaksi', date.from.toISOString());
      }
      if (date?.to) {
        const toDate = new Date(date.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('tanggal_transaksi', toDate.toISOString());
      }
      
      query = query.in('tipe', selectedTipes);
      
      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return (data as any) || [];
    }
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('delete_transaction_and_revert_changes', {
        p_transaksi_id: transactionId,
        p_reason: reason,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      showSuccess("Transaksi pembelian berhasil dihapus dan dibatalkan.");
      queryClient.invalidateQueries({ queryKey: ["mutasi_saldo"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_transactions_log"] });
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      setDeletingMutation(null);
      setReason("");
    },
    onError: (error: any) => {
      showError(error.message || "Gagal menghapus transaksi pembelian.");
    },
  });

  const deleteSimpleMutation = useMutation({
    mutationFn: async ({ mutation, reason }: { mutation: MutasiSaldo; reason: string }) => {
      const { error: logError } = await supabase.from('deleted_transactions_log').insert({
        deleted_by_user_id: user?.id,
        deleted_by_user_email: user?.email,
        reason: reason,
        original_transaction_data: mutation,
      });
      if (logError) throw new Error(`Gagal membuat log: ${logError.message}`);

      const { error: deleteError } = await supabase.from('mutasi_saldo').delete().eq('id', mutation.id);
      if (deleteError) throw new Error(`Gagal menghapus mutasi: ${deleteError.message}`);
    },
    onSuccess: () => {
      showSuccess("Transaksi berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["mutasi_saldo"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_transactions_log"] });
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      setDeletingMutation(null);
      setReason("");
    },
    onError: (error: any) => {
      showError(error.message || "Gagal menghapus transaksi.");
    },
  });

  const handleTipeChange = (tipe: MutasiTipe, checked: boolean | 'indeterminate') => {
    setSelectedTipes(prev => {
        if (checked) {
            return [...prev, tipe];
        } else {
            return prev.filter(t => t !== tipe);
        }
    });
  };

  const handleDelete = () => {
    if (!deletingMutation || !reason.trim()) {
      showError("Alasan penghapusan wajib diisi.");
      return;
    }

    if (deletingMutation.tipe === 'PEMBELIAN' && deletingMutation.transaksi?.id) {
      deletePurchaseMutation.mutate({ transactionId: deletingMutation.transaksi.id, reason });
    } else {
      deleteSimpleMutation.mutate({ mutation: deletingMutation, reason });
    }
  };

  const tipeOptions: { id: MutasiTipe, label: string }[] = [
    { id: 'DEPOSIT', label: 'Deposit' },
    { id: 'PENARIKAN', label: 'Penarikan' },
    { id: 'PEMBELIAN', label: 'Pembelian' },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Riwayat Saldo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Semua Mutasi Saldo</CardTitle>
          <CardDescription>Daftar semua aktivitas saldo. Gunakan filter untuk mencari data spesifik.</CardDescription>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y", { locale: id })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: id })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y", { locale: id })
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
              <Label className="font-semibold">Filter Tipe:</Label>
              {tipeOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedTipes.includes(option.id)}
                    onCheckedChange={(checked) => handleTipeChange(option.id, checked)}
                  />
                  <label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[65vh] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[180px]">Tanggal</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Deposit</TableHead>
                  <TableHead className="text-right">Penarikan</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-red-500">
                      Gagal memuat riwayat saldo.
                    </TableCell>
                  </TableRow>
                ) : mutasiHistory && mutasiHistory.length > 0 ? (
                  mutasiHistory.map((mutasi, index) => (
                    <TableRow key={mutasi.id} className={index % 2 !== 0 ? 'bg-muted' : ''}>
                      <TableCell className="text-sm">{formatDate(mutasi.tanggal_transaksi)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{mutasi.siswa?.nama || "Siswa Dihapus"}</div>
                        <div className="text-xs text-muted-foreground">{mutasi.siswa?.nis || "-"}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {mutasi.tipe === 'PEMBELIAN' && mutasi.transaksi && mutasi.transaksi.transaksi_items.length > 0 ? (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="link" className="p-0 h-auto text-sm -ml-1 flex items-center">
                                <span>Pembelian di kasir ({mutasi.transaksi.transaksi_items.length} item)</span>
                                <ChevronDown className="h-4 w-4 ml-1 transition-transform data-[state=open]:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <ul className="list-disc pl-5 mt-2 text-xs text-muted-foreground space-y-1">
                                {mutasi.transaksi.transaksi_items.map((item, index) => (
                                  <li key={index}>
                                    {item.quantity}x {item.produk.nama} @ {formatCurrency(item.harga_saat_transaksi)}
                                  </li>
                                ))}
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          mutasi.keterangan || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {mutasi.tipe === 'DEPOSIT' ? formatCurrency(mutasi.jumlah) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {mutasi.tipe !== 'DEPOSIT' ? formatCurrency(mutasi.jumlah) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => setDeletingMutation(mutasi)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada riwayat transaksi yang cocok dengan filter Anda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!deletingMutation} onOpenChange={(isOpen) => { if (!isOpen) setDeletingMutation(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi</DialogTitle>
            <DialogDescription>
              Anda akan menghapus transaksi ini secara permanen. Saldo siswa dan stok produk (jika ada) akan dikembalikan. Tindakan ini akan dicatat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Alasan Penghapusan (Wajib)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Salah input, permintaan pembatalan, dll."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMutation(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!reason.trim() || deletePurchaseMutation.isPending || deleteSimpleMutation.isPending}
            >
              {deletePurchaseMutation.isPending || deleteSimpleMutation.isPending ? "Menghapus..." : "Ya, Hapus Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiwayatMutasiPage;