import type { Prisma } from "@prisma/client";

import {
  vehicleCategories,
  vehicleConditions,
  vehicleCurrencies,
  type VehicleCategory,
  type VehicleCondition,
  type VehicleCurrency,
} from "@/lib/vehicle-records";

export type VehicleSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type VehicleSortOption =
  | "updated-desc"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "kilometraje-asc";

export type VehicleBooleanFilter = "" | "true" | "false";

export type VehicleFilterValues = {
  q: string;
  marca: string;
  condition: VehicleCondition | "";
  category: VehicleCategory | "";
  currency: VehicleCurrency | "";
  anioMin: string;
  anioMax: string;
  kilometrajeMin: string;
  kilometrajeMax: string;
  destacado: VehicleBooleanFilter;
  hasImages: VehicleBooleanFilter;
  hasPromotion: VehicleBooleanFilter;
  sort: VehicleSortOption;
};

export const defaultVehicleSort: VehicleSortOption = "updated-desc";

export const vehicleSortOptions: Array<{
  label: string;
  value: VehicleSortOption;
}> = [
  { value: "updated-desc", label: "Más recientes" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "year-desc", label: "Año: más nuevos primero" },
  { value: "kilometraje-asc", label: "Kilometraje: menor a mayor" },
];

export const emptyVehicleFilters: VehicleFilterValues = {
  q: "",
  marca: "",
  condition: "",
  category: "",
  currency: "",
  anioMin: "",
  anioMax: "",
  kilometrajeMin: "",
  kilometrajeMax: "",
  destacado: "",
  hasImages: "",
  hasPromotion: "",
  sort: defaultVehicleSort,
};

function getFirstParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function normalizeTextValue(value: string | string[] | undefined) {
  return getFirstParamValue(value).trim();
}

function normalizeDigits(value: string | string[] | undefined) {
  return getFirstParamValue(value).replace(/[^\d]/g, "");
}

function normalizeCurrency(
  value: string | string[] | undefined
): VehicleCurrency | "" {
  const normalized = getFirstParamValue(value).trim().toUpperCase();

  if (vehicleCurrencies.includes(normalized as VehicleCurrency)) {
    return normalized as VehicleCurrency;
  }

  return "";
}

function normalizeCondition(
  value: string | string[] | undefined
): VehicleCondition | "" {
  const normalized = getFirstParamValue(value).trim().toUpperCase();

  if (vehicleConditions.includes(normalized as VehicleCondition)) {
    return normalized as VehicleCondition;
  }

  return "";
}

function normalizeCategory(
  value: string | string[] | undefined
): VehicleCategory | "" {
  const normalized = getFirstParamValue(value).trim().toUpperCase();

  if (vehicleCategories.includes(normalized as VehicleCategory)) {
    return normalized as VehicleCategory;
  }

  return "";
}

function normalizeBooleanFilter(
  value: string | string[] | undefined
): VehicleBooleanFilter {
  const normalized = getFirstParamValue(value).trim().toLowerCase();

  if (normalized === "true" || normalized === "false") {
    return normalized;
  }

  return "";
}

function normalizeSort(value: string | string[] | undefined): VehicleSortOption {
  const normalized = getFirstParamValue(value).trim() as VehicleSortOption;

  if (vehicleSortOptions.some((option) => option.value === normalized)) {
    return normalized;
  }

  return defaultVehicleSort;
}

function parseInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRange(min: number | null, max: number | null) {
  if (min !== null && max !== null && min > max) {
    return [max, min] as const;
  }

  return [min, max] as const;
}

export function parseVehicleFilters(
  searchParams?: VehicleSearchParams
): VehicleFilterValues {
  if (!searchParams) {
    return emptyVehicleFilters;
  }

  return {
    q: normalizeTextValue(searchParams.q),
    marca: normalizeTextValue(searchParams.marca),
    condition: normalizeCondition(searchParams.condition),
    category: normalizeCategory(searchParams.category),
    currency: normalizeCurrency(searchParams.currency),
    anioMin: normalizeDigits(searchParams.anioMin),
    anioMax: normalizeDigits(searchParams.anioMax),
    kilometrajeMin: normalizeDigits(searchParams.kilometrajeMin),
    kilometrajeMax: normalizeDigits(searchParams.kilometrajeMax),
    destacado: normalizeBooleanFilter(searchParams.destacado),
    hasImages: normalizeBooleanFilter(searchParams.hasImages),
    hasPromotion: normalizeBooleanFilter(searchParams.hasPromotion),
    sort: normalizeSort(searchParams.sort),
  };
}

export function getVehicleWhereInput(
  filters: VehicleFilterValues
): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    deletedAt: null,
  };
  const [anioMin, anioMax] = normalizeRange(
    parseInteger(filters.anioMin),
    parseInteger(filters.anioMax)
  );
  const [kilometrajeMin, kilometrajeMax] = normalizeRange(
    parseInteger(filters.kilometrajeMin),
    parseInteger(filters.kilometrajeMax)
  );

  if (filters.q) {
    const queryAsYear = parseInteger(filters.q);

    where.OR = [
      {
        marca: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
      {
        modelo: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
      {
        descripcion: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
      ...(queryAsYear !== null && String(queryAsYear).length === 4
        ? [{ anio: queryAsYear }]
        : []),
    ];
  }

  if (filters.marca) {
    where.marca = {
      equals: filters.marca,
      mode: "insensitive",
    };
  }

  if (filters.condition) {
    where.condition = filters.condition;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.currency) {
    where.currency = filters.currency;
  }

  if (anioMin !== null || anioMax !== null) {
    where.anio = {
      ...(anioMin !== null ? { gte: anioMin } : {}),
      ...(anioMax !== null ? { lte: anioMax } : {}),
    };
  }

  if (kilometrajeMin !== null || kilometrajeMax !== null) {
    where.kilometraje = {
      ...(kilometrajeMin !== null ? { gte: kilometrajeMin } : {}),
      ...(kilometrajeMax !== null ? { lte: kilometrajeMax } : {}),
    };
  }

  if (filters.destacado === "true") {
    where.destacado = true;
  }

  if (filters.destacado === "false") {
    where.destacado = false;
  }

  if (filters.hasImages === "true") {
    where.images = {
      some: {},
    };
  }

  if (filters.hasImages === "false") {
    where.images = {
      none: {},
    };
  }

  if (filters.hasPromotion === "true") {
    where.promotionalPrice = {
      not: null,
    };
  }

  if (filters.hasPromotion === "false") {
    where.promotionalPrice = null;
  }

  return where;
}

export function getVehicleOrderBy(
  sort: VehicleSortOption
): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ precio: "asc" }, { updatedAt: "desc" }, { id: "asc" }];
    case "price-desc":
      return [{ precio: "desc" }, { updatedAt: "desc" }, { id: "asc" }];
    case "year-desc":
      return [{ anio: "desc" }, { updatedAt: "desc" }, { id: "asc" }];
    case "kilometraje-asc":
      return [{ kilometraje: "asc" }, { updatedAt: "desc" }, { id: "asc" }];
    case "updated-desc":
    default:
      return [{ destacado: "desc" }, { updatedAt: "desc" }, { id: "asc" }];
  }
}

export function countActiveVehicleFilters(
  filters: VehicleFilterValues,
  options?: { includeAdminFields?: boolean }
) {
  let count = 0;

  if (filters.q) count += 1;
  if (filters.marca) count += 1;
  if (filters.condition) count += 1;
  if (filters.category) count += 1;
  if (filters.currency) count += 1;
  if (filters.anioMin) count += 1;
  if (filters.anioMax) count += 1;
  if (filters.kilometrajeMin) count += 1;
  if (filters.kilometrajeMax) count += 1;
  if (filters.hasPromotion) count += 1;
  if (filters.sort !== defaultVehicleSort) count += 1;

  if (options?.includeAdminFields) {
    if (filters.destacado) count += 1;
    if (filters.hasImages) count += 1;
  }

  return count;
}

export function hasActiveVehicleFilters(
  filters: VehicleFilterValues,
  options?: { includeAdminFields?: boolean }
) {
  return countActiveVehicleFilters(filters, options) > 0;
}
