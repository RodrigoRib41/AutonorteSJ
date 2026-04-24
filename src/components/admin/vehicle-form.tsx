"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createVehicle, updateVehicle } from "@/lib/supabase-data";
import {
  emptyVehicleFormValues,
  MAX_FEATURED_VEHICLES,
  type FeaturedVehicleOption,
  type VehicleCategory,
  type VehicleCondition,
  type VehicleCurrency,
  type VehicleFieldErrors,
  type VehicleFormValues,
  type VehicleItemResponse,
  type VehiclePreview,
  vehicleCategoryOptions,
  vehicleToFormValues,
} from "@/lib/vehicle-records";

type VehicleFormProps = {
  mode: "create" | "edit";
  vehicle?: VehiclePreview;
  featuredVehicles: FeaturedVehicleOption[];
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60";

const textareaClassName =
  "min-h-36 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60";

export function VehicleForm({
  mode,
  vehicle,
  featuredVehicles,
}: VehicleFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<VehicleFormValues>(
    vehicle ? vehicleToFormValues(vehicle) : emptyVehicleFormValues
  );
  const [featuredReplacementOptions, setFeaturedReplacementOptions] =
    useState(featuredVehicles);
  const [featuredReplacementVehicleId, setFeaturedReplacementVehicleId] =
    useState<string | null>(null);
  const [
    isFeaturedReplacementDialogOpen,
    setIsFeaturedReplacementDialogOpen,
  ] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<VehicleFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedFeaturedReplacement =
    featuredReplacementOptions.find(
      (featuredVehicle) => featuredVehicle.id === featuredReplacementVehicleId
    ) ?? null;
  const shouldAskForFeaturedReplacement =
    !vehicle?.destacado &&
    featuredReplacementOptions.length >= MAX_FEATURED_VEHICLES;

  function updateField<K extends keyof VehicleFormValues>(
    field: K,
    value: VehicleFormValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openFeaturedReplacementDialog() {
    setFeaturedReplacementVehicleId(
      (current) => current ?? featuredReplacementOptions[0]?.id ?? null
    );
    setIsFeaturedReplacementDialogOpen(true);
  }

  function cancelFeaturedReplacementDialog() {
    setFeaturedReplacementVehicleId(null);
    setIsFeaturedReplacementDialogOpen(false);
    updateField("destacado", false);
  }

  function confirmFeaturedReplacementDialog() {
    if (!featuredReplacementVehicleId) {
      setErrorMessage("Elegi un vehiculo destacado para reemplazar.");
      return;
    }

    setIsFeaturedReplacementDialogOpen(false);
    setErrorMessage("");
  }

  function handleFeaturedChange(checked: boolean) {
    if (!checked) {
      setFeaturedReplacementVehicleId(null);
      setIsFeaturedReplacementDialogOpen(false);
      updateField("destacado", false);
      return;
    }

    updateField("destacado", true);

    if (shouldAskForFeaturedReplacement) {
      openFeaturedReplacementDialog();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        marca: values.marca,
        modelo: values.modelo,
        condition: values.condition,
        category: values.category,
        anio: Number(values.anio),
        kilometraje: Number(values.kilometraje),
        precio: Number(values.precio),
        promotionalPrice: values.promotionalPrice
          ? Number(values.promotionalPrice)
          : null,
        currency: values.currency,
        descripcion: values.descripcion,
        destacado: values.destacado,
        featuredReplacementVehicleId: values.destacado
          ? featuredReplacementVehicleId
          : null,
      };
      const result =
        mode === "create"
          ? ((await createVehicle(payload)) as VehicleItemResponse)
          : ((await updateVehicle(vehicle?.id ?? "", payload)) as VehicleItemResponse);

      if (!result || !result.success) {
        if (
          result &&
          !result.success &&
          result.code === "FEATURED_LIMIT_REACHED" &&
          result.featuredVehicles?.length
        ) {
          setFieldErrors({});
          setFeaturedReplacementOptions(result.featuredVehicles);
          setFeaturedReplacementVehicleId(result.featuredVehicles[0]?.id ?? null);
          setIsFeaturedReplacementDialogOpen(true);
          setValues((current) => ({
            ...current,
            destacado: true,
          }));
          setErrorMessage(result.message);
          return;
        }

        setFieldErrors(result && !result.success ? result.fieldErrors ?? {} : {});
        setErrorMessage(
          result?.message ??
            "No pudimos guardar el vehiculo en este momento. Intenta nuevamente."
        );
        return;
      }

      if (mode === "create" && result.vehicle?.id) {
        router.push(
          `/admin/vehiculos/editar?id=${encodeURIComponent(
            result.vehicle.id
          )}&created=1#imagenes`
        );
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Datos guardados correctamente. Ahora podes administrar las fotos."
      );
    } catch {
      setErrorMessage(
        "No pudimos guardar el vehiculo en este momento. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Marca</span>
          <input
            type="text"
            value={values.marca}
            onChange={(event) => updateField("marca", event.target.value)}
            className={inputClassName}
            placeholder="Toyota"
            required
          />
          {fieldErrors.marca ? (
            <p className="text-sm text-red-600">{fieldErrors.marca}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Modelo</span>
          <input
            type="text"
            value={values.modelo}
            onChange={(event) => updateField("modelo", event.target.value)}
            className={inputClassName}
            placeholder="Corolla SEG CVT"
            required
          />
          {fieldErrors.modelo ? (
            <p className="text-sm text-red-600">{fieldErrors.modelo}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">
            Tipo de unidad
          </span>
          <select
            value={values.condition}
            onChange={(event) =>
              updateField("condition", event.target.value as VehicleCondition)
            }
            className={inputClassName}
            required
          >
            <option value="USED">Usado</option>
            <option value="ZERO_KM">0 km</option>
          </select>
          {fieldErrors.condition ? (
            <p className="text-sm text-red-600">{fieldErrors.condition}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Categoria</span>
          <select
            value={values.category}
            onChange={(event) =>
              updateField("category", event.target.value as VehicleCategory)
            }
            className={inputClassName}
            required
          >
            {vehicleCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.category ? (
            <p className="text-sm text-red-600">{fieldErrors.category}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Año</span>
          <input
            type="number"
            value={values.anio}
            onChange={(event) => updateField("anio", event.target.value)}
            className={inputClassName}
            placeholder="2024"
            min={1900}
            required
          />
          {fieldErrors.anio ? (
            <p className="text-sm text-red-600">{fieldErrors.anio}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Kilometraje</span>
          <input
            type="number"
            value={values.kilometraje}
            onChange={(event) => updateField("kilometraje", event.target.value)}
            className={inputClassName}
            placeholder={values.condition === "ZERO_KM" ? "0" : "38000"}
            min={0}
            required
          />
          {fieldErrors.kilometraje ? (
            <p className="text-sm text-red-600">{fieldErrors.kilometraje}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Precio de lista</span>
          <input
            type="number"
            value={values.precio}
            onChange={(event) => updateField("precio", event.target.value)}
            className={inputClassName}
            placeholder="28900"
            min={0}
            required
          />
          {fieldErrors.precio ? (
            <p className="text-sm text-red-600">{fieldErrors.precio}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">
            Precio promocional opcional
          </span>
          <input
            type="number"
            value={values.promotionalPrice}
            onChange={(event) =>
              updateField("promotionalPrice", event.target.value)
            }
            className={inputClassName}
            placeholder="24900"
            min={0}
          />
          {fieldErrors.promotionalPrice ? (
            <p className="text-sm text-red-600">
              {fieldErrors.promotionalPrice}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              Si lo completas, debe ser menor al precio de lista.
            </p>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Moneda</span>
          <select
            value={values.currency}
            onChange={(event) =>
              updateField("currency", event.target.value as VehicleCurrency)
            }
            className={inputClassName}
            required
          >
            <option value="USD">USD</option>
            <option value="ARS">Pesos</option>
          </select>
          {fieldErrors.currency ? (
            <p className="text-sm text-red-600">{fieldErrors.currency}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">
          Descripcion opcional
        </span>
        <textarea
          value={values.descripcion}
          onChange={(event) => updateField("descripcion", event.target.value)}
          className={textareaClassName}
          placeholder="Equipamiento, estado general o detalles importantes."
        />
        {fieldErrors.descripcion ? (
          <p className="text-sm text-red-600">{fieldErrors.descripcion}</p>
        ) : null}
      </label>

      <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.destacado}
            onChange={(event) => handleFeaturedChange(event.target.checked)}
            className="size-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-300"
          />
          <span className="text-sm font-medium text-zinc-700">
            Mostrar como vehiculo destacado en la home
          </span>
        </label>

        {values.destacado && selectedFeaturedReplacement ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            Al guardar, se quitara de destacados a{" "}
            <span className="font-semibold text-zinc-950">
              {selectedFeaturedReplacement.marca}{" "}
              {selectedFeaturedReplacement.modelo}
            </span>
            .
            <button
              type="button"
              onClick={openFeaturedReplacementDialog}
              className="ml-2 font-semibold text-zinc-950 underline underline-offset-4"
            >
              Cambiar
            </button>
          </div>
        ) : values.destacado && shouldAskForFeaturedReplacement ? (
          <button
            type="button"
            onClick={openFeaturedReplacementDialog}
            className="mt-4 text-sm font-semibold text-zinc-950 underline underline-offset-4"
          >
            Elegir destacado a reemplazar
          </button>
        ) : null}
      </div>

      <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm leading-7 text-zinc-600">
        Guarda la unidad y despues suma las fotos. Al terminar, podes pasar
        directo a cargar otro vehiculo.
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={
            errorMessage
              ? "text-sm text-red-600"
              : successMessage
                ? "text-sm text-emerald-700"
                : "text-sm text-zinc-500"
          }
        >
          {errorMessage ||
            successMessage ||
            (mode === "create"
              ? "Despues de guardar vas directo a la carga de fotos."
              : "Los cambios quedan disponibles en papelera durante 7 dias.")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-12 rounded-full border-zinc-300 bg-white px-6 text-zinc-900 hover:bg-zinc-50"
          >
            <Link href="/admin/vehiculos">Cancelar</Link>
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
          >
            {isSubmitting
              ? "Guardando..."
              : mode === "create"
                ? "Crear vehiculo"
                : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {isFeaturedReplacementDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="featured-replacement-title"
            aria-describedby="featured-replacement-description"
            className="w-full max-w-xl rounded-[1.5rem] bg-white p-6 shadow-2xl"
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Limite de destacados
            </p>
            <h3
              id="featured-replacement-title"
              className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950"
            >
              Ya hay {MAX_FEATURED_VEHICLES} vehiculos destacados
            </h3>
            <p
              id="featured-replacement-description"
              className="mt-3 text-sm leading-6 text-zinc-600"
            >
              Elegi cual dejar de destacar para guardar esta unidad como
              destacada.
            </p>

            <div className="mt-5 space-y-3">
              {featuredReplacementOptions.map((featuredVehicle) => {
                const isSelected =
                  featuredReplacementVehicleId === featuredVehicle.id;

                return (
                  <label
                    key={featuredVehicle.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="featuredReplacementVehicleId"
                      value={featuredVehicle.id}
                      checked={isSelected}
                      onChange={() =>
                        setFeaturedReplacementVehicleId(featuredVehicle.id)
                      }
                      className="size-4 border-zinc-300 text-zinc-950 focus:ring-zinc-300"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {featuredVehicle.marca} {featuredVehicle.modelo}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          isSelected ? "text-zinc-200" : "text-zinc-500"
                        }`}
                      >
                        Anio {featuredVehicle.anio}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={cancelFeaturedReplacementDialog}
                className="h-11 rounded-full border-zinc-300 bg-white px-5 text-zinc-900 hover:bg-zinc-50"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmFeaturedReplacementDialog}
                disabled={!featuredReplacementVehicleId}
                className="h-11 rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
              >
                Confirmar reemplazo
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
