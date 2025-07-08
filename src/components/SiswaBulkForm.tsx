import { useState } from "react";
import * as XLSX from "xlsx";
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
import { Siswa } from "@/types/siswa";
import { showError } from "@/utils/toast";
import { Download } from "lucide-react";
import { Separator } from "./ui/separator";

type SiswaBulkFormProps = {
  onBulkSubmit: (data: Omit<Siswa, "id" | "created_at">[]) => void;
  onClose: () => void;
  isSubmitting: boolean;
};

const EXPECTED_HEADERS = ["nis", "nama", "kelas", "saldo"];

export const SiswaBulkForm = ({ onBulkSubmit, onClose, isSubmitting }: SiswaBulkFormProps) => {
  const [parsedData, setParsedData] = useState<Omit<Siswa, "id" | "created_at">[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const headers = ["nis", "nama", "kelas", "saldo"];
    const sampleData = [
      { nis: "1001", nama: "Budi Santoso", kelas: "10A", saldo: 50000 },
      { nis: "1002", nama: "Citra Lestari", kelas: "11B", saldo: 75000 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Siswa");
    XLSX.writeFile(workbook, "template_import_siswa.xlsx");
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
            setError(`Header kolom tidak sesuai. Pastikan file Excel memiliki kolom: ${EXPECTED_HEADERS.join(", ")}. Kolom yang hilang: ${missingHeaders.join(", ")}.`);
            return;
        }

        const formattedData = json.map((row, index) => {
          const nis = String(row.nis || "").trim();
          const nama = String(row.nama || "").trim();
          const kelas = String(row.kelas || "").trim();
          const saldo = Number(row.saldo || 0);

          if (!nis || !nama || !kelas) {
            throw new Error(`Data tidak lengkap pada baris ${index + 2}. Kolom nis, nama, dan kelas wajib diisi.`);
          }
          if (isNaN(saldo) || saldo < 0) {
            throw new Error(`Saldo tidak valid pada baris ${index + 2}. Saldo harus berupa angka dan tidak boleh negatif.`);
          }

          return { nis, nama, kelas, saldo };
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
    if (parsedData.length > 0) {
      onBulkSubmit(parsedData);
    } else {
      showError("Tidak ada data untuk diimpor. Silakan pilih file yang valid.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium text-gray-800">Langkah 1: Unduh Template</p>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Gunakan template ini untuk memastikan format data Anda benar sebelum mengunggah.
        </p>
        <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Unduh Template
        </Button>
      </div>

      <Separator />

      <div>
        <p className="font-medium text-gray-800">Langkah 2: Unggah File Anda</p>
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
          <p className="font-medium text-gray-800">Langkah 3: Pratinjau Data</p>
          <div className="mt-3 border rounded-md max-h-60 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((siswa, index) => (
                  <TableRow key={index}>
                    <TableCell>{siswa.nis}</TableCell>
                    <TableCell>{siswa.nama}</TableCell>
                    <TableCell>{siswa.kelas}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(siswa.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={parsedData.length === 0 || !!error || isSubmitting}>
          {isSubmitting ? "Menyimpan..." : `Impor ${parsedData.length} Siswa`}
        </Button>
      </div>
    </div>
  );
};