import { notFound } from "next/navigation";

import { VehicleForm } from "@/components/admin/vehicle-form";
import { VehicleImageUploader } from "@/components/admin/vehicle-image-uploader";
import { requireAdminPageAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { getAdminDisplayName } from "@/lib/admin-users";
import { getFeaturedVehicleReplacementOptions } from "@/lib/vehicle-featured";
import { getVehicleById } from "@/lib/vehicle-queries";
import { serializeVehicleImage } from "@/lib/vehicle-records";

type EditVehiclePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string | string[] | undefined }>;
};

export default async function EditVehiclePage({
  params,
  searchParams,
}: EditVehiclePageProps) {
  await requireAdminPageAccess(vehicleManagerRoles);

  const { id } = await params;
  const createdParam = (await searchParams).created;
  const wasJustCreated = Array.isArray(createdParam)
    ? createdParam.includes("1")
    : createdParam === "1";
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const featuredVehicles = await getFeaturedVehicleReplacementOptions(
    vehicle.id
  );

  const auditItems = [
    {
      label: "Creado por",
      value: vehicle.createdBy
        ? getAdminDisplayName(vehicle.createdBy)
        : "Sin registro",
    },
    {
      label: "Ultima gestion",
      value: vehicle.updatedBy
        ? getAdminDisplayName(vehicle.updatedBy)
        : "Sin registro",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
          Edicion de vehiculo
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          {vehicle.marca} {vehicle.modelo}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
          Edita los datos, fotos y precio de la unidad.
        </p>
        {wasJustCreated ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-900">
            La unidad ya se creo correctamente. Ahora podes cargar las fotos y,
            cuando termines, pasar directo a la siguiente.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {auditItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-4"
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-zinc-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <VehicleForm
          mode="edit"
          vehicle={vehicle}
          featuredVehicles={featuredVehicles}
        />
      </section>

      <section
        id="imagenes"
        className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10"
      >
        <VehicleImageUploader
          key={`${vehicle.id}-${vehicle.updatedAt.toISOString()}`}
          vehicleId={vehicle.id}
          vehicleName={`${vehicle.marca} ${vehicle.modelo}`}
          initialImages={vehicle.images.map(serializeVehicleImage)}
          showCreateAnotherAction={wasJustCreated}
        />
      </section>
    </div>
  );
}
