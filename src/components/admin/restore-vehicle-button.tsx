"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VehicleRestoreResponse } from "@/lib/vehicle-restore-points";

type RestoreVehicleButtonProps = {
  restorePointId: string;
  action: "UPDATE" | "DELETE";
  vehicleLabel: string;
};

export function RestoreVehicleButton({
  restorePointId,
  action,
  vehicleLabel,
}: RestoreVehicleButtonProps) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);

  async function handleRestore() {
    const confirmed = window.confirm(
      action === "DELETE"
        ? `Vas a restaurar ${vehicleLabel} y volver a publicarlo en el sitio.`
        : `Vas a volver ${vehicleLabel} al estado anterior a esta modificacion.`
    );

    if (!confirmed) {
      return;
    }

    setIsRestoring(true);

    try {
      const response = await fetch(
        `/api/admin/vehicle-restore-points/${restorePointId}/restore`,
        {
          method: "POST",
        }
      );
      const result = (await response
        .json()
        .catch(() => null)) as VehicleRestoreResponse | null;

      if (!response.ok || !result?.success) {
        window.alert(
          result?.message ?? "No pudimos restaurar el vehiculo en este momento."
        );
        return;
      }

      router.refresh();
    } catch {
      window.alert("No pudimos restaurar el vehiculo en este momento.");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isRestoring}
      onClick={handleRestore}
      className="h-10 rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
    >
      {isRestoring ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Restaurando...
        </>
      ) : (
        <>
          <RotateCcw className="size-4" />
          Restaurar
        </>
      )}
    </Button>
  );
}
