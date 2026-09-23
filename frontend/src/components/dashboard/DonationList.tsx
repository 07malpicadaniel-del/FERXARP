import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StockScanner } from "@/components/scanner/StockScanner";

interface Donation {
  id: string;
  title: string;
  quantity: number;
  description?: string;
  status?: string | null;
}

interface DonationListProps {
  donations: Donation[];
  onSelectMatching: (id: string) => void;
  onRefreshList?: () => void;
}

export function DonationList({ donations, onSelectMatching, onRefreshList }: DonationListProps) {
  return (
    <Card title="Donaciones Registradas" subtitle="Lotes sincronizados con la base relacional">
      {donations.length === 0 ? (
        <p className="text-xs text-neutral-500 py-4">No hay lotes de donación registrados aún.</p>
      ) : (
        <div className="space-y-4 mt-4">
          {donations.map((d) => (
            <div
              key={d.id}
              className="border border-neutral-800 bg-neutral-950/60 p-4 rounded-lg flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{d.title}</p>
                  <p className="text-xs text-neutral-500">Cantidad: {d.quantity} unidades</p>
                  {d.description && <p className="text-xs text-neutral-400 mt-1">{d.description}</p>}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => onSelectMatching(d.id)}
                  className="text-xs whitespace-nowrap"
                >
                  Calcular Matching (IA)
                </Button>
              </div>

              {/* Módulo de escaneo y trazabilidad física */}
              <StockScanner
                donationId={d.id}
                currentStatus={d.status}
                onStatusUpdated={() => onRefreshList && onRefreshList()}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
