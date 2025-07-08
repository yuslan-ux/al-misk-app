import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SaldoMassalForm } from "@/components/SaldoMassalForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type SaldoUpdateData = {
  nis: string;
  jumlah: number;
};

type BulkUpdatePayload = {
  updates: SaldoUpdateData[];
  tipe: "DEPOSIT" | "PENARIKAN";
  keterangan: string;
  tanggal_transaksi: Date;
};

const SaldoMassalPage = () => {
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async (payload: BulkUpdatePayload) => {
      const { data, error } = await supabase.functions.invoke("update-saldo-massal", {
        body: {
          ...payload,
          tanggal_transaksi: payload.tanggal_transaksi.toISOString(),
        },
      });

      if (error) {
        // Re-throw the error so it can be caught by onError,
        // which has access to the detailed error context.
        throw error;
      }
      
      // This part is only reached on a 2xx status (full success)
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      queryClient.invalidateQueries({ queryKey: ["mutasi_saldo"] });
      showSuccess(data.message || "Update saldo massal berhasil!");
    },
    onError: (error: any) => {
      let message = "Terjadi kesalahan pada server.";

      // error.context contains the body of the non-2xx response
      const responseBody = error.context;

      if (responseBody && responseBody.message) {
        // This handles partial success/failure from our RPC
        message = `${responseBody.message}\nBerhasil: ${responseBody.success_count}, Gagal: ${responseBody.error_count}.`;
        if (responseBody.errors && Array.isArray(responseBody.errors)) {
            const errorDetails = responseBody.errors.map((e: any) => `NIS ${e.nis}: ${e.reason}`).join('\n');
            message += `\n\nDetail Kesalahan:\n${errorDetails}`;
        }
      } else if (responseBody && responseBody.error) {
        // This handles generic errors from the edge function's catch block
        message = responseBody.error;
      } else if (error.message) {
        message = error.message;
      }
      
      showError(message);
    },
  });

  const handleFormSubmit = (data: BulkUpdatePayload) => {
    const { updates, tipe, keterangan, tanggal_transaksi } = data;
    const totalJumlah = updates.reduce((sum, item) => sum + item.jumlah, 0);
    const formattedJumlah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalJumlah);
    const actionText = tipe === 'DEPOSIT' ? 'menambahkan' : 'menarik';
    const formattedDate = format(tanggal_transaksi, "PPP", { locale: id });

    if (window.confirm(`Anda akan ${actionText} total ${formattedJumlah} untuk ${updates.length} siswa pada tanggal ${formattedDate} dengan keterangan "${keterangan}".\n\nApakah Anda yakin ingin melanjutkan?`)) {
      bulkUpdateMutation.mutate(data);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Update Saldo Massal</CardTitle>
            <CardDescription>
              Tambah atau tarik saldo untuk banyak siswa sekaligus menggunakan file Excel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Perhatian!</AlertTitle>
              <AlertDescription>
                Fitur ini akan mengubah saldo banyak siswa secara permanen. Pastikan data yang Anda unggah sudah benar.
                Setiap transaksi akan tercatat di riwayat mutasi masing-masing siswa.
              </AlertDescription>
            </Alert>
            <SaldoMassalForm
              onSubmit={handleFormSubmit}
              isSubmitting={bulkUpdateMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SaldoMassalPage;