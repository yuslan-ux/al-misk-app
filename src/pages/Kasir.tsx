import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Siswa } from "@/types/siswa";
import { Produk } from "@/types/produk";
import { CartItem } from "@/types/transaksi";
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle, MinusCircle, ShoppingCart, Package, Barcode as BarcodeIcon, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const KasirPage = () => {
  const queryClient = useQueryClient();
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isSiswaPopoverOpen, setIsSiswaPopoverOpen] = useState(false);

  const { data: siswaList, isLoading: isLoadingSiswa } = useQuery<Siswa[]>({
    queryKey: ["siswa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("siswa").select("*").order("nama");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: produkList, isLoading: isLoadingProduk } = useQuery<Produk[]>({
    queryKey: ["produk"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produk").select("*").order("nama");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ siswaId, items }: { siswaId: string; items: { produk_id: string; quantity: number }[] }) => {
      const { data, error } = await supabase.rpc('create_new_transaction', {
        p_siswa_id: siswaId,
        p_items: items,
      });

      if (error) throw new Error(`Database error: ${error.message}`);
      if (data && !data.success) throw new Error(data.message);
      
      return data;
    },
    onSuccess: () => {
      showSuccess("Transaksi berhasil!");
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      queryClient.invalidateQueries({ queryKey: ["transaksi"] });
      setCart([]);
      setSelectedSiswaId(null);
    },
    onError: (error: Error) => {
      showError(error.message);
    }
  });

  const selectedSiswa = useMemo(() => siswaList?.find((s) => s.id === selectedSiswaId), [selectedSiswaId, siswaList]);
  const totalBelanja = useMemo(() => cart.reduce((sum, item) => sum + item.harga * item.quantity, 0), [cart]);

  const addToCart = (produk: Produk) => {
    if (produk.stok === 0) {
      showError("Stok produk habis.");
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === produk.id);
      if (existingItem) {
        if (existingItem.quantity >= produk.stok) {
          showError("Stok tidak mencukupi.");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === produk.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...produk, quantity: 1 }];
    });
  };

  const updateQuantity = (produkId: string, newQuantity: number) => {
    const produk = produkList?.find(p => p.id === produkId);
    if (produk && newQuantity > produk.stok) {
      showError("Stok tidak mencukupi.");
      return;
    }
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== produkId));
    } else {
      setCart((prev) => prev.map((item) => (item.id === produkId ? { ...item, quantity: newQuantity } : item)));
    }
  };

  const handleCheckout = () => {
    if (!selectedSiswa) {
      showError("Silakan pilih siswa terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      showError("Keranjang belanja kosong.");
      return;
    }
    if (selectedSiswa.saldo < totalBelanja) {
      showError("Saldo siswa tidak mencukupi.");
      return;
    }

    const itemsToSubmit = cart.map(item => ({
      produk_id: item.id,
      quantity: item.quantity,
    }));

    checkoutMutation.mutate({ siswaId: selectedSiswa.id, items: itemsToSubmit });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || !produkList) return;

    const product = produkList.find(p => p.barcode === barcode.trim());

    if (product) {
      addToCart(product);
    } else {
      showError(`Produk dengan barcode "${barcode}" tidak ditemukan.`);
    }

    setBarcode("");
  };

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]); // Re-focus after cart changes for continuous scanning

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Kasir (Point of Sale)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Siswa & Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleBarcodeSubmit}>
                <div className="relative">
                  <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    ref={barcodeInputRef}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan barcode di sini atau pilih produk di bawah"
                    className="pl-10 text-base"
                    autoFocus
                  />
                </div>
              </form>
              
              <Popover open={isSiswaPopoverOpen} onOpenChange={setIsSiswaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSiswaPopoverOpen}
                    className="w-full justify-between"
                    disabled={isLoadingSiswa}
                  >
                    {selectedSiswa
                      ? `${selectedSiswa.nama} (${selectedSiswa.nis})`
                      : isLoadingSiswa ? "Memuat data siswa..." : "Pilih atau cari siswa..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Cari nama atau NIS siswa..." />
                    <CommandList>
                      <CommandEmpty>Siswa tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {siswaList?.map((siswa) => (
                          <CommandItem
                            key={siswa.id}
                            value={`${siswa.nama} ${siswa.nis}`}
                            onSelect={() => {
                              setSelectedSiswaId(siswa.id === selectedSiswaId ? null : siswa.id);
                              setIsSiswaPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSiswaId === siswa.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p>{siswa.nama} ({siswa.nis})</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(siswa.saldo)}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[50vh] overflow-y-auto p-2">
                {isLoadingProduk ? (
                  Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
                ) : (
                  produkList?.map((produk) => (
                    <Card key={produk.id} className="flex flex-col overflow-hidden group">
                      <div className="relative">
                        {produk.gambar_url ? (
                          <img src={produk.gambar_url} alt={produk.nama} className="h-24 w-full object-cover" />
                        ) : (
                          <div className="h-24 w-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-3 flex-grow">
                        <CardTitle className="text-sm font-semibold">{produk.nama}</CardTitle>
                        <p className="text-xs text-muted-foreground">Stok: {produk.stok}</p>
                      </CardHeader>
                      <CardContent className="p-3">
                        <p className="font-bold text-sm">{formatCurrency(produk.harga)}</p>
                      </CardContent>
                      <CardFooter className="p-2">
                        <Button onClick={() => addToCart(produk)} disabled={produk.stok === 0} className="w-full">
                          Tambah
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Keranjang</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSiswa && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-800">{selectedSiswa.nama}</p>
                  <p className="text-sm text-blue-700">Saldo: {formatCurrency(selectedSiswa.saldo)}</p>
                </div>
              )}
              <div className="h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.length > 0 ? (
                      cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">{item.nama}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                              <span>{item.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.harga * item.quantity)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">Keranjang kosong</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Belanja:</span>
                  <span>{formatCurrency(totalBelanja)}</span>
                </div>
                {selectedSiswa && (
                  <div className={`flex justify-between font-semibold ${selectedSiswa.saldo - totalBelanja < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    <span>Sisa Saldo:</span>
                    <span>{formatCurrency(selectedSiswa.saldo - totalBelanja)}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={!selectedSiswa || cart.length === 0 || (selectedSiswa && selectedSiswa.saldo < totalBelanja) || checkoutMutation.isPending}>
                {checkoutMutation.isPending ? "Memproses..." : "Selesaikan Transaksi"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KasirPage;