"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type ContactInquiryPayload,
  type InquiryResponse,
  validateContactInquiry,
} from "@/lib/inquiry-payloads";
import { submitContactInquiry } from "@/lib/supabase-data";

type ContactFormErrors = Partial<Record<keyof ContactInquiryPayload, string>>;

const initialValues: ContactInquiryPayload = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-zinc-950/15 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-ring-soft)]";

const textareaClassName =
  "min-h-32 w-full rounded-2xl border border-zinc-950/15 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-ring-soft)]";

export function ContactForm() {
  const [values, setValues] = useState<ContactInquiryPayload>(initialValues);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ContactInquiryPayload>(
    field: K,
    value: ContactInquiryPayload[K]
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

    const nextErrors = validateContactInquiry(values);
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
      const result = (await submitContactInquiry(values)) as InquiryResponse<
        keyof ContactInquiryPayload
      >;

      if (!result.success) {
        setErrors(result.fieldErrors ?? {});
        setErrorMessage(
          result?.message ??
            "No pudimos enviar tu consulta en este momento. Intenta nuevamente."
        );
        return;
      }

      setSuccessMessage(result.message);
      setValues(initialValues);
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
          placeholder="Contanos que estas buscando."
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
          className="h-12 rounded-full bg-[var(--brand-primary)] px-6 text-zinc-950 hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isSubmitting ? "Enviando..." : "Enviar consulta"}
        </Button>
      </div>
    </form>
  );
}
