"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getVehicleDisplayName } from "@/lib/vehicle-records";
import { deleteVehicle } from "@/lib/supabase-data";

type DeleteVehicleButtonProps = {
  vehicleId: string;
  marca: string;
  modelo: string;
  onDeleted?: (vehicleId: string) => void;
};

export function DeleteVehicleButton({
  vehicleId,
  marca,
  modelo,
  onDeleted,
}: DeleteVehicleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Vas a mover ${getVehicleDisplayName({ marca, modelo })} a la papelera. La unidad se oculta del sitio y puede restaurarse durante 7 dias.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteVehicle(vehicleId);

      if (!result?.success) {
        window.alert(
          result?.message ?? "No pudimos eliminar el vehiculo en este momento."
        );
        return;
      }

      onDeleted?.(vehicleId);
    } catch {
      window.alert("No pudimos eliminar el vehiculo en este momento.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
      className="h-9 rounded-full px-4 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed"
    >
      <Trash2 className="size-4" />
      {isDeleting ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}
