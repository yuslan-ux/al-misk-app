import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MutasiSaldo } from "@/types/mutasi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

type SiswaMutasiDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  siswaId: string;
  siswaName: string;
};

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

export const SiswaMutasiDialog = ({ isOpen, onClose, siswaId, siswaName }: SiswaMutasiDialogProps) => {
  const { data: mutasiHistory, isLoading, isError } = useQuery<MutasiSaldo[]>({
    queryKey: ["mutasi_saldo_detail", siswaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mutasi_saldo')
        .select(`
          *,
          transaksi (
            id,
            transaksi_items (
              quantity,
              harga_saat_transaksi,
              produk (nama)
            )
          )
        `)
        .eq('siswa_id', siswaId)
        .order('tanggal_transaksi', { ascending: false });
      
      if (error) throw new Error(error.message);
      return (data as any) || [];
    },
    enabled: isOpen, // Only fetch when the dialog is open
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Riwayat Saldo: {siswaName}</DialogTitle>
          <DialogDescription>
            Berikut adalah semua riwayat transaksi yang tercatat untuk siswa ini.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-[60vh] pr-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : isError ? (
              <div className="text-center text-red-500 py-10">
                <p>Gagal memuat riwayat.</p>
              </div>
            ) : mutasiHistory && mutasiHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Deposit</TableHead>
                    <TableHead className="text-right">Penarikan</TableHead>
                    <TableHead className="text-right">Saldo Akhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutasiHistory.map((mutasi, index) => (
                    <TableRow key={mutasi.id} className={index % 2 !== 0 ? 'bg-muted' : ''}>
                      <TableCell>{formatDate(mutasi.tanggal_transaksi)}</TableCell>
                      <TableCell>
                        {mutasi.tipe === 'PEMBELIAN' && mutasi.transaksi && mutasi.transaksi.transaksi_items.length > 0 ? (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="link" className="p-0 h-auto text-sm -ml-1 flex items-center text-left">
                                <span>Pembelian di kasir ({mutasi.transaksi.transaksi_items.length} item)</span>
                                <ChevronDown className="h-4 w-4 ml-1 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
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
                      <TableCell className="text-right font-medium">{formatCurrency(mutasi.saldo_sesudah)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Belum ada riwayat transaksi untuk siswa ini.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};