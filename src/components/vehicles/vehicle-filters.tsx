import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  countActiveVehicleFilters,
  hasActiveVehicleFilters,
  type VehicleFilterValues,
  vehicleSortOptions,
} from "@/lib/vehicle-filters";
import { vehicleCategoryOptions } from "@/lib/vehicle-records";

type VehicleFiltersProps = {
  actionPath: string;
  brands: string[];
  filters: VehicleFilterValues;
  totalCount: number;
  visibleCount: number;
  variant: "public" | "admin";
};

const fieldClassName =
  "h-12 w-full rounded-xl border border-zinc-950/15 bg-white px-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-ring-soft)] sm:rounded-2xl sm:text-sm";

export function VehicleFilters({
  actionPath,
  brands,
  filters,
  totalCount,
  visibleCount,
  variant,
}: VehicleFiltersProps) {
  const includeAdminFields = variant === "admin";
  const hasFilters = hasActiveVehicleFilters(filters, {
    includeAdminFields,
  });
  const activeFilterCount = countActiveVehicleFilters(filters, {
    includeAdminFields,
  });

  return (
    <details className="group">
      <summary className="flex w-full list-none cursor-pointer items-center justify-center gap-3 rounded-full border border-zinc-950 bg-zinc-950 px-4 py-3 text-sm font-medium text-[var(--brand-primary)] shadow-sm transition hover:bg-zinc-900 sm:inline-flex sm:w-auto [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          {hasFilters
            ? `Filtros (${activeFilterCount} activo${activeFilterCount === 1 ? "" : "s"})`
            : "Expandir filtros"}
        </span>
        <ChevronDown className="size-4 transition group-open:rotate-180" />
      </summary>

      <div className="mt-4 rounded-[1.25rem] border border-zinc-950/15 bg-white p-4 shadow-[0_18px_44px_rgba(0,0,0,0.1)] sm:rounded-[1.5rem] sm:p-6 sm:shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">
              {hasFilters
                ? `${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}`
                : "Sin filtros activos"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {hasFilters
                ? `Mostrando ${visibleCount} de ${totalCount} unidades disponibles.`
                : `${totalCount} unidades disponibles para consultar.`}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-zinc-950/15 bg-[var(--brand-soft)] px-4 py-2 text-sm font-medium text-zinc-800">
            {visibleCount} {visibleCount === 1 ? "resultado" : "resultados"}
          </div>
        </div>

        <form action={actionPath} method="get" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Busqueda</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.q}
                  className={`${fieldClassName} pl-11`}
                  placeholder="Marca, modelo o año"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Marca</span>
              <select
                name="marca"
                defaultValue={filters.marca}
                className={fieldClassName}
              >
                <option value="">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Tipo de unidad
              </span>
              <select
                name="condition"
                defaultValue={filters.condition}
                className={fieldClassName}
              >
                <option value="">Todos</option>
                <option value="ZERO_KM">0 km</option>
                <option value="USED">Usados</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Categoria
              </span>
              <select
                name="category"
                defaultValue={filters.category}
                className={fieldClassName}
              >
                <option value="">Todas</option>
                {vehicleCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Moneda</span>
              <select
                name="currency"
                defaultValue={filters.currency}
                className={fieldClassName}
              >
                <option value="">Todas</option>
                <option value="USD">USD</option>
                <option value="ARS">Pesos</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Promocion</span>
              <select
                name="hasPromotion"
                defaultValue={filters.hasPromotion}
                className={fieldClassName}
              >
                <option value="">Todas</option>
                <option value="true">Solo con promocion</option>
                <option value="false">Solo sin promocion</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Año mínimo</span>
              <input
                type="number"
                name="anioMin"
                defaultValue={filters.anioMin}
                className={fieldClassName}
                placeholder="2019"
                inputMode="numeric"
                min={1900}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Año máximo</span>
              <input
                type="number"
                name="anioMax"
                defaultValue={filters.anioMax}
                className={fieldClassName}
                placeholder="2025"
                inputMode="numeric"
                min={1900}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Kilometraje minimo
              </span>
              <input
                type="number"
                name="kilometrajeMin"
                defaultValue={filters.kilometrajeMin}
                className={fieldClassName}
                placeholder="0"
                inputMode="numeric"
                min={0}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Kilometraje maximo
              </span>
              <input
                type="number"
                name="kilometrajeMax"
                defaultValue={filters.kilometrajeMax}
                className={fieldClassName}
                placeholder="50000"
                inputMode="numeric"
                min={0}
              />
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Ordenar por</span>
              <select
                name="sort"
                defaultValue={filters.sort}
                className={fieldClassName}
              >
                {vehicleSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {includeAdminFields ? (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-700">
                    Destacado
                  </span>
                  <select
                    name="destacado"
                    defaultValue={filters.destacado}
                    className={fieldClassName}
                  >
                    <option value="">Todos</option>
                    <option value="true">Solo destacados</option>
                    <option value="false">Solo no destacados</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-700">Fotos</span>
                  <select
                    name="hasImages"
                    defaultValue={filters.hasImages}
                    className={fieldClassName}
                  >
                    <option value="">Todas</option>
                    <option value="true">Con fotos</option>
                    <option value="false">Sin fotos</option>
                  </select>
                </label>
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full bg-[var(--brand-primary)] px-6 text-zinc-950 hover:bg-[var(--brand-primary-hover)] sm:w-auto"
            >
              Aplicar filtros
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-zinc-950 bg-white px-6 text-zinc-950 hover:bg-[var(--brand-soft)] sm:w-auto"
            >
              <Link href={actionPath}>Limpiar filtros</Link>
            </Button>
          </div>
        </form>
      </div>
    </details>
  );
}
