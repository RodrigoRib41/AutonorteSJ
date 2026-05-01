"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CarFront, PencilLine, Trash2 } from "lucide-react";

import { DeleteVehicleButton } from "@/components/admin/delete-vehicle-button";
import { Button } from "@/components/ui/button";
import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import {
  type VehicleBulkDeleteResponse,
  type VehicleCategory,
  type VehicleCondition,
  type VehicleCurrency,
  formatKilometraje,
  formatPrecio,
  getVehicleCategoryLabel,
  getVehicleConditionLabel,
  getVehicleDisplayName,
  getVehicleDisplayPrice,
  hasVehiclePromotion,
} from "@/lib/vehicle-records";

export type AdminVehiclesTableItem = {
  id: string;
  marca: string;
  modelo: string;
  version: string | null;
  condition: VehicleCondition;
  category: VehicleCategory;
  anio: number;
  kilometraje: number;
  precio: number;
  promotionalPrice: number | null;
  currency: VehicleCurrency;
  destacado: boolean;
  imageCount: number;
  primaryImage: {
    publicId: string;
    format: string | null;
    alt: string | null;
  } | null;
  createdByLabel: string | null;
  updatedByLabel: string | null;
};

type AdminVehiclesTableProps = {
  vehicles: AdminVehiclesTableItem[];
};

export function AdminVehiclesTable({ vehicles }: AdminVehiclesTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const selectedCount = selectedIds.size;
  const allSelected = vehicles.length > 0 && selectedCount === vehicles.length;
  const visibleVehicleIds = useMemo(
    () => new Set(vehicles.map((vehicle) => vehicle.id)),
    [vehicles]
  );
  const selectedVehicles = useMemo(
    () => vehicles.filter((vehicle) => selectedIds.has(vehicle.id)),
    [selectedIds, vehicles]
  );

  useEffect(() => {
    setSelectedIds((current) => {
      let changed = false;
      const next = new Set<string>();

      for (const vehicleId of current) {
        if (visibleVehicleIds.has(vehicleId)) {
          next.add(vehicleId);
        } else {
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [visibleVehicleIds]);

  function setVehicleSelected(vehicleId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(vehicleId);
      } else {
        next.delete(vehicleId);
      }

      return next;
    });
  }

  function setAllSelected(checked: boolean) {
    setSelectedIds(
      checked ? new Set(vehicles.map((vehicle) => vehicle.id)) : new Set()
    );
  }

  async function handleBulkDelete() {
    if (selectedCount === 0 || isBulkDeleting) {
      return;
    }

    const sampleLabels = selectedVehicles
      .slice(0, 3)
      .map((vehicle) => getVehicleDisplayName(vehicle))
      .join(", ");
    const extraCount = Math.max(0, selectedCount - 3);
    const confirmed = window.confirm(
      `Vas a mover ${selectedCount} vehiculo${
        selectedCount === 1 ? "" : "s"
      } a la papelera: ${sampleLabels}${
        extraCount > 0 ? ` y ${extraCount} mas` : ""
      }. Se ocultan del sitio y pueden restaurarse durante 7 dias.`
    );

    if (!confirmed) {
      return;
    }

    setIsBulkDeleting(true);

    try {
      const response = await fetch("/api/admin/vehicles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | VehicleBulkDeleteResponse
        | null;

      if (!response.ok || !result?.success) {
        window.alert(
          result?.message ??
            "No pudimos eliminar los vehiculos seleccionados."
        );
        return;
      }

      setSelectedIds(new Set());
      router.refresh();
    } catch {
      window.alert("No pudimos eliminar los vehiculos seleccionados.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_60px_rgba(24,24,27,0.06)]">
      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-zinc-600">
          {selectedCount === 0
            ? "Sin vehiculos seleccionados"
            : `${selectedCount} vehiculo${
                selectedCount === 1 ? "" : "s"
              } seleccionado${selectedCount === 1 ? "" : "s"}`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllSelected(!allSelected)}
            className="h-9 rounded-full border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100"
          >
            {allSelected ? "Quitar seleccion" : "Seleccionar todos"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={selectedCount === 0 || isBulkDeleting}
            onClick={handleBulkDelete}
            className="h-9 rounded-full px-4 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            <Trash2 className="size-4" />
            {isBulkDeleting ? "Eliminando..." : "Eliminar seleccionados"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
              <th className="w-12 px-6 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => setAllSelected(event.target.checked)}
                  aria-label="Seleccionar todos los vehiculos visibles"
                  className="size-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950"
                />
              </th>
              <th className="px-6 py-4">Vehiculo</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Anio</th>
              <th className="px-6 py-4">Kilometraje</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4">Destacado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {vehicles.map((vehicle) => {
              const isSelected = selectedIds.has(vehicle.id);
              const hasPromotion = hasVehiclePromotion(vehicle);
              const displayPrice = getVehicleDisplayPrice(vehicle);

              return (
                <tr
                  key={vehicle.id}
                  className={`align-top transition-colors ${
                    isSelected ? "bg-yellow-50/70" : "bg-white"
                  }`}
                >
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) =>
                        setVehicleSelected(vehicle.id, event.target.checked)
                      }
                      aria-label={`Seleccionar ${getVehicleDisplayName(
                        vehicle
                      )}`}
                      className="size-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                        {vehicle.primaryImage ? (
                          <CloudinaryVehicleImage
                            publicId={vehicle.primaryImage.publicId}
                            format={vehicle.primaryImage.format}
                            alt={
                              vehicle.primaryImage.alt ??
                              getVehicleDisplayName(vehicle)
                            }
                            variant="adminThumbnail"
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-400">
                            <CarFront className="size-5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                          {vehicle.marca}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-zinc-950">
                          {vehicle.modelo}
                        </p>
                        {vehicle.version ? (
                          <p className="mt-1 text-sm font-semibold text-zinc-700">
                            {vehicle.version}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-zinc-500">
                          {getVehicleDisplayName(vehicle)} |{" "}
                          {vehicle.imageCount} fotos
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Categoria:{" "}
                          <span className="font-medium text-zinc-700">
                            {getVehicleCategoryLabel(vehicle.category)}
                          </span>
                        </p>
                        <div className="mt-3 space-y-1 text-sm text-zinc-500">
                          <p>
                            Alta:{" "}
                            <span className="font-medium text-zinc-700">
                              {vehicle.createdByLabel ?? "Sin registro"}
                            </span>
                          </p>
                          <p>
                            Ultima gestion:{" "}
                            <span className="font-medium text-zinc-700">
                              {vehicle.updatedByLabel ?? "Sin registro"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-700 uppercase">
                      {getVehicleConditionLabel(vehicle.condition)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-zinc-700">
                    {vehicle.anio}
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-zinc-700">
                    {formatKilometraje(vehicle.kilometraje)}
                  </td>
                  <td className="px-6 py-5">
                    {hasPromotion ? (
                      <div>
                        <p className="text-xs font-medium text-zinc-400 line-through">
                          {formatPrecio(vehicle.precio, vehicle.currency)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-950">
                          {formatPrecio(displayPrice, vehicle.currency)}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase">
                          Promocion
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-950">
                        {formatPrecio(vehicle.precio, vehicle.currency)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
                        vehicle.destacado
                          ? "bg-zinc-950 text-white"
                          : "border border-zinc-200 bg-zinc-50 text-zinc-500"
                      }`}
                    >
                      {vehicle.destacado ? "Si" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-full border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-50"
                      >
                        <Link
                          href={`/admin/vehiculos/${vehicle.id}/editar`}
                          prefetch={false}
                        >
                          <PencilLine className="size-4" />
                          Editar
                        </Link>
                      </Button>
                      <DeleteVehicleButton
                        vehicleId={vehicle.id}
                        marca={vehicle.marca}
                        modelo={vehicle.modelo}
                        version={vehicle.version}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
