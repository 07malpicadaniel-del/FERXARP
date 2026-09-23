import { useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface DonationFormProps {
  onDonationCreated: () => void;
}

export function DonationForm({ onDonationCreated }: DonationFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createDonation({
        title,
        description: description || undefined,
        quantity: Number(quantity),
      });
      setTitle("");
      setDescription("");
      onDonationCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Registrar Donación" subtitle="Publica excedentes de stock para ONGs" className="h-fit">
      {error && <div className="mb-3 text-xs text-rose-400 bg-rose-950/40 p-2 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título del lote"
          placeholder="Ej. Cajas de leche pasteurizada"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Descripción o requerimientos"
          placeholder="Ej. Lácteos sellados fecha prox. 15 días"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Cantidad de unidades"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Registrando..." : "Guardar en Supabase"}
        </Button>
      </form>
    </Card>
  );
}
