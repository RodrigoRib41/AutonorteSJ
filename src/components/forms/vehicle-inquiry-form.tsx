"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type InquiryResponse,
  type VehicleInquiryPayload,
  getInitialVehicleInquiryMessage,
  validateVehicleInquiry,
} from "@/lib/inquiry-payloads";

type VehicleInquiryFormProps = {
  vehicleId: string;
  vehicleName: string;
};

type VehicleInquiryErrors = Partial<Record<keyof VehicleInquiryPayload, string>>;

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-950/15 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-[#f2c400] focus:ring-4 focus:ring-yellow-300/30";

const textareaClassName =
  "min-h-32 w-full rounded-2xl border border-zinc-950/15 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[#f2c400] focus:ring-4 focus:ring-yellow-300/30";

export function VehicleInquiryForm({
  vehicleId,
  vehicleName,
}: VehicleInquiryFormProps) {
  const [values, setValues] = useState<VehicleInquiryPayload>({
    vehicleId,
    vehicleName,
    name: "",
    email: "",
    phone: "",
    message: getInitialVehicleInquiryMessage(vehicleName),
  });
  const [errors, setErrors] = useState<VehicleInquiryErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof VehicleInquiryPayload>(
    field: K,
    value: VehicleInquiryPayload[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateVehicleInquiry(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage("Revisa los campos obligatorios e intenta nuevamente.");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/vehicle-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response
        .json()
        .catch(() => null)) as InquiryResponse<
        keyof VehicleInquiryPayload
      > | null;

      if (!response.ok || !result || !result.success) {
        setErrors(result && !result.success ? result.fieldErrors ?? {} : {});
        setErrorMessage(
          result?.message ??
            "No pudimos enviar tu consulta en este momento. Intenta nuevamente."
        );
        return;
      }

      setSuccessMessage(result.message);
      setValues({
        vehicleId,
        vehicleName,
        name: "",
        email: "",
        phone: "",
        message: getInitialVehicleInquiryMessage(vehicleName),
      });
      setErrors({});
    } catch {
      setErrorMessage(
        "No pudimos enviar tu consulta en este momento. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Nombre</span>
          <input
            type="text"
            name="name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClassName}
            placeholder="Tu nombre"
            required
          />
          {errors.name ? (
            <p className="text-sm text-red-600">{errors.name}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClassName}
            placeholder="tu@email.com"
            required
          />
          {errors.email ? (
            <p className="text-sm text-red-600">{errors.email}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Telefono</span>
        <input
          type="tel"
          name="phone"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          className={inputClassName}
          placeholder="+54 11 4000 0000"
          required
        />
        {errors.phone ? (
          <p className="text-sm text-red-600">{errors.phone}</p>
        ) : null}
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Mensaje</span>
        <textarea
          name="message"
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          className={textareaClassName}
          required
        />
        {errors.message ? (
          <p className="text-sm text-red-600">{errors.message}</p>
        ) : null}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={
            errorMessage
              ? "text-sm text-red-600"
              : "text-sm text-zinc-600"
          }
        >
          {errorMessage || successMessage}
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 rounded-full bg-[#f2c400] px-6 text-zinc-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isSubmitting ? "Enviando..." : "Enviar consulta"}
        </Button>
      </div>
    </form>
  );
}
