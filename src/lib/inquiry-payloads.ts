export type ContactInquiryPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type VehicleInquiryPayload = ContactInquiryPayload & {
  vehicleId: string;
  vehicleName: string;
};

export type ValidationErrors<T extends object> = Partial<
  Record<keyof T, string>
>;

export type InquiryResponse<TFields extends string = string> =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<TFields, string>>;
    };

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getInitialVehicleInquiryMessage(vehicleName: string) {
  return `Hola, quiero consultar por el vehiculo ${vehicleName}.`;
}

export function parseContactInquiryPayload(
  input: unknown
): ContactInquiryPayload {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    name: asString(data.name),
    email: asString(data.email),
    phone: asString(data.phone),
    message: asString(data.message),
  };
}

export function parseVehicleInquiryPayload(
  input: unknown
): VehicleInquiryPayload {
  const data =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    vehicleId: asString(data.vehicleId),
    vehicleName: asString(data.vehicleName),
    name: asString(data.name),
    email: asString(data.email),
    phone: asString(data.phone),
    message: asString(data.message),
  };
}

export function validateContactInquiry(
  payload: ContactInquiryPayload
): ValidationErrors<ContactInquiryPayload> {
  const errors: ValidationErrors<ContactInquiryPayload> = {};

  if (payload.name.length < 2) {
    errors.name = "Ingresa un nombre valido.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresa un email valido.";
  }

  if (payload.phone.length < 6) {
    errors.phone = "Ingresa un telefono valido.";
  }

  if (payload.message.length < 10) {
    errors.message = "Escribe un mensaje un poco mas detallado.";
  }

  return errors;
}

export function validateVehicleInquiry(
  payload: VehicleInquiryPayload
): ValidationErrors<VehicleInquiryPayload> {
  const errors: ValidationErrors<VehicleInquiryPayload> = {
    ...validateContactInquiry(payload),
  };

  if (!payload.vehicleId) {
    errors.vehicleId = "Falta la referencia del vehiculo.";
  }

  if (payload.vehicleName.length < 2) {
    errors.vehicleName = "Falta la informacion del vehiculo.";
  }

  return errors;
}
