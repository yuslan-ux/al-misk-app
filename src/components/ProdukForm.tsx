import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Produk } from "@/types/produk";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";

const formSchema = z.object({
  nama: z.string().min(1, "Nama produk tidak boleh kosong"),
  harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  stok: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
  barcode: z.string().optional().nullable(),
  gambar_url: z.string().url().optional().nullable(),
  gambar_file: z.instanceof(File).optional().nullable(),
});

export type ProdukFormValues = z.infer<typeof formSchema>;

type ProdukFormProps = {
  onSubmit: (data: ProdukFormValues) => void;
  initialData?: Produk;
  onClose: () => void;
  isSubmitting: boolean;
};

export const ProdukForm = ({ onSubmit, initialData, onClose, isSubmitting }: ProdukFormProps) => {
  const [preview, setPreview] = useState<string | null>(initialData?.gambar_url || null);

  const form = useForm<ProdukFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: initialData?.nama || "",
      harga: initialData?.harga || 0,
      stok: initialData?.stok || 0,
      barcode: initialData?.barcode || "",
      gambar_url: initialData?.gambar_url || "",
      gambar_file: undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nama: initialData.nama,
        harga: initialData.harga,
        stok: initialData.stok,
        barcode: initialData.barcode,
        gambar_url: initialData.gambar_url,
        gambar_file: undefined,
      });
      setPreview(initialData.gambar_url || null);
    } else {
      form.reset({ nama: "", harga: 0, stok: 0, barcode: "", gambar_url: "", gambar_file: undefined });
      setPreview(null);
    }
  }, [initialData, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.setValue("gambar_file", file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(initialData?.gambar_url || null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Produk</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Buku Tulis" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="harga"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Contoh: 5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stok"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stok</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Contoh: 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 89999995001" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Gambar Produk (Opsional)</FormLabel>
          <div className="flex items-center gap-4">
            {preview ? (
              <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
            ) : (
              <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center border">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <FormControl>
              <Input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Form>
  );
};