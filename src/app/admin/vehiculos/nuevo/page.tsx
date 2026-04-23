import { VehicleForm } from "@/components/admin/vehicle-form";
import { requireAdminPageAccess, vehicleManagerRoles } from "@/lib/admin-auth";
import { getFeaturedVehicleReplacementOptions } from "@/lib/vehicle-featured";

export default async function NewVehiclePage() {
  await requireAdminPageAccess(vehicleManagerRoles);
  const featuredVehicles = await getFeaturedVehicleReplacementOptions();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
          Alta de vehiculo
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Cargar nueva unidad
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
          Carga los datos principales. Despues podes sumar hasta 5 fotos.
        </p>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)] sm:p-10">
        <VehicleForm mode="create" featuredVehicles={featuredVehicles} />
      </section>
    </div>
  );
}
