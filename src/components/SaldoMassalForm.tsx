import { useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "./ui/separator";
import { showError } from "@/utils/toast";

type SaldoUpdateData = {
  nis: string;
  jumlah: number;
};

type SaldoMassalFormProps = {
  onSubmit: (data: {
    updates: SaldoUpdateData[];
    tipe: "DEPOSIT" | "PENARIKAN";
    keterangan: string;
    tanggal_transaksi: Date;
  }) => void;
  isSubmitting: boolean;
};

const EXPECTED_HEADERS = ["nis", "jumlah"];

export const SaldoMassalForm = ({ onSubmit, isSubmitting }: SaldoMassalFormProps) => {
  const [parsedData, setParsedData] = useState<SaldoUpdateData[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tipe, setTipe] = useState<"DEPOSIT" | "PENARIKAN">("DEPOSIT");
  const [keterangan, setKeterangan] = useState("");
  const [tanggalTransaksi, setTanggalTransaksi] = useState<Date | undefined>(new Date());

  const handleDownloadTemplate = () => {
    const headers = ["nis", "jumlah"];
    const sampleData = [
      { nis: "1001", jumlah: 50000 },
      { nis: "1002", jumlah: 100000 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    worksheet['!cols'] = [{ wch: 15 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Saldo");
    XLSX.writeFile(workbook, "template_update_saldo.xlsx");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (json.length === 0) {
          setError("File Excel kosong atau format tidak didukung.");
          return;
        }

        const headers = Object.keys(json[0]);
        const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            setError(`Header kolom tidak sesuai. Pastikan file memiliki kolom: ${EXPECTED_HEADERS.join(", ")}. Kolom yang hilang: ${missingHeaders.join(", ")}.`);
            return;
        }

        const formattedData = json.map((row, index) => {
          const nis = String(row.nis || "").trim();
          const jumlah = Number(row.jumlah || 0);

          if (!nis) {
            throw new Error(`Data tidak lengkap pada baris ${index + 2}. Kolom 'nis' wajib diisi.`);
          }
          if (isNaN(jumlah) || jumlah <= 0) {
            throw new Error(`Jumlah tidak valid pada baris ${index + 2}. Jumlah harus berupa angka positif.`);
          }

          return { nis, jumlah };
        });

        setParsedData(formattedData);
      } catch (err: any) {
        setError(err.message || "Gagal memproses file. Pastikan formatnya benar.");
        showError(err.message || "Gagal memproses file.");
      }
    };
    reader.onerror = () => {
        setError("Gagal membaca file.");
        showError("Gagal membaca file.");
    }
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = () => {
    if (parsedData.length === 0) {
      showError("Tidak ada data untuk diimpor. Silakan pilih file yang valid.");
      return;
    }
    if (!keterangan.trim()) {
      showError("Keterangan wajib diisi.");
      return;
    }
    if (!tanggalTransaksi) {
      showError("Tanggal transaksi wajib diisi.");
      return;
    }
    onSubmit({ updates: parsedData, tipe, keterangan, tanggal_transaksi: tanggalTransaksi });
  };

  const totalJumlah = parsedData.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Langkah 1: Unduh Template</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Gunakan template ini untuk memastikan format data Anda benar sebelum mengunggah.
        </p>
        <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Unduh Template Excel
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-lg">Langkah 2: Tentukan Detail Transaksi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
            <div className="space-y-4">
                <div>
                    <Label className="font-medium">Jenis Transaksi</Label>
                    <RadioGroup defaultValue="DEPOSIT" value={tipe} onValueChange={(value: "DEPOSIT" | "PENARIKAN") => setTipe(value)} className="mt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="DEPOSIT" id="r1" />
                            <Label htmlFor="r1">Tambah Saldo (Deposit)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PENARIKAN" id="r2" />
                            <Label htmlFor="r2">Tarik Saldo (Penarikan)</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div>
                    <Label htmlFor="tanggal_transaksi" className="font-medium">Tanggal Transaksi</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal mt-2",
                                    !tanggalTransaksi && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tanggalTransaksi ? format(tanggalTransaksi, "PPP") : <span>Pilih tanggal</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={tanggalTransaksi}
                                onSelect={setTanggalTransaksi}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div>
                <Label htmlFor="keterangan" className="font-medium">Keterangan</Label>
                <Textarea
                    id="keterangan"
                    placeholder="Contoh: Bantuan Kuota Belajar, Pembayaran SPP, dll."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="mt-2 h-32"
                />
            </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-lg">Langkah 3: Unggah File</h3>
        <Input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="mt-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {fileName && <p className="text-sm text-muted-foreground mt-2">File dipilih: {fileName}</p>}
        {error && <p className="text-sm font-medium text-destructive mt-2">{error}</p>}
      </div>
      
      {parsedData.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg">Langkah 4: Pratinjau Data</h3>
          <div className="mt-3 border rounded-md max-h-60 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.nis}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.jumlah)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-right font-bold">
            <p>Total Siswa: {parsedData.length}</p>
            <p>Total Jumlah: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalJumlah)}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button onClick={handleSubmit} disabled={parsedData.length === 0 || !!error || !keterangan.trim() || !tanggalTransaksi || isSubmitting}>
          {isSubmitting ? "Memproses..." : `Proses ${parsedData.length} Transaksi`}
        </Button>
      </div>
    </div>
  );
};