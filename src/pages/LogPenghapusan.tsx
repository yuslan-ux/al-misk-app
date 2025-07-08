import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye } from "lucide-react";

type DeletedLog = {
  id: number;
  deleted_at: string;
  deleted_by_user_email: string;
  reason: string;
  original_transaction_id: string;
  original_transaction_data: any;
};

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(new Date(dateString));

const LogPenghapusanPage = () => {
  const [selectedLog, setSelectedLog] = useState<DeletedLog | null>(null);

  const { data: logs, isLoading, isError } = useQuery<DeletedLog[]>({
    queryKey: ["deleted_transactions_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deleted_transactions_log')
        .select('*')
        .order('deleted_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Log Penghapusan Transaksi</h1>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penghapusan</CardTitle>
          <CardDescription>Daftar semua transaksi pembelian yang telah dihapus dari sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[65vh] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Waktu Penghapusan</TableHead>
                  <TableHead>Dihapus Oleh</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead className="text-center">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-red-500">
                      Gagal memuat log penghapusan.
                    </TableCell>
                  </TableRow>
                ) : logs && logs.length > 0 ? (
                  logs.map((log, index) => (
                    <TableRow key={log.id} className={index % 2 !== 0 ? 'bg-muted' : ''}>
                      <TableCell>{formatDate(log.deleted_at)}</TableCell>
                      <TableCell>{log.deleted_by_user_email || "N/A"}</TableCell>
                      <TableCell>{log.reason}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Belum ada riwayat penghapusan transaksi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Transaksi yang Dihapus</DialogTitle>
            <DialogDescription>
              Ini adalah salinan data transaksi sebelum dihapus.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="mt-4 max-h-[60vh] bg-gray-900 text-white p-4 rounded-md">
              <pre>
                {JSON.stringify(selectedLog.original_transaction_data, null, 2)}
              </pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogPenghapusanPage;