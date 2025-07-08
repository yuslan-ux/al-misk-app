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
import { Siswa } from "@/types/siswa";
import { useEffect } from "react";

const formSchema = z.object({
  nis: z.string().min(1, "NIS tidak boleh kosong"),
  nama: z.string().min(1, "Nama tidak boleh kosong"),
  kelas: z.string().min(1, "Kelas tidak boleh kosong"),
  saldo: z.coerce.number().min(0, "Saldo tidak boleh negatif"),
});

type SiswaFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  initialData?: Siswa;
  onClose: () => void;
};

export const SiswaForm = ({ onSubmit, initialData, onClose }: SiswaFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nis: "",
      nama: "",
      kelas: "",
      saldo: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({ nis: "", nama: "", kelas: "", saldo: 0 });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIS</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 1001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Budi Santoso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kelas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kelas</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 10A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!initialData && (
          <FormField
            control={form.control}
            name="saldo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Awal (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Contoh: 50000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Form>
  );
};