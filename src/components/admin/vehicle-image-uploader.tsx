"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  GripVertical,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import {
  VEHICLE_IMAGE_ACCEPT,
  VEHICLE_IMAGE_MAX_FILE_SIZE_BYTES,
  validateVehicleImageFile,
} from "@/lib/cloudinary-images";
import {
  MAX_VEHICLE_IMAGES,
  type VehicleImageApiRecord,
  type VehicleImageDeleteResponse,
  type VehicleImagesResponse,
} from "@/lib/vehicle-records";

type VehicleImageUploaderProps = {
  vehicleId: string;
  vehicleName: string;
  initialImages: VehicleImageApiRecord[];
};

type PendingPreview = {
  name: string;
  url: string;
};

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export function VehicleImageUploader({
  vehicleId,
  vehicleName,
  initialImages,
}: VehicleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  const [images, setImages] = useState(initialImages);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [deletingImageIds, setDeletingImageIds] = useState<string[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dropTargetImageId, setDropTargetImageId] = useState<string | null>(null);
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(
    null
  );
  const [pendingDropTargetIndex, setPendingDropTargetIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [pendingPreviews]);

  const availableSlots = MAX_VEHICLE_IMAGES - images.length;
  const remainingPendingSlots = MAX_VEHICLE_IMAGES - images.length - selectedFiles.length;
  const canSelectMoreFiles =
    remainingPendingSlots > 0 && !isUploading && !isReordering;
  const deletingImageIdSet = new Set(deletingImageIds);

  function replacePendingFiles(nextFiles: File[]) {
    setPendingPreviews((current) => {
      current.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });

      return nextFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
    });

    setSelectedFiles(nextFiles);
  }

  function clearPendingFiles() {
    replacePendingFiles([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function getFileSignature(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  function processSelectedFiles(nextFiles: File[]) {
    setErrorMessage("");
    setSuccessMessage("");

    if (availableSlots <= 0) {
      clearPendingFiles();
      setErrorMessage(
        `Este vehiculo ya alcanzo el maximo de ${MAX_VEHICLE_IMAGES} imagenes.`
      );
      return;
    }

    if (remainingPendingSlots <= 0) {
      setErrorMessage(
        "Ya preparaste el maximo de imagenes para esta unidad. Subi las pendientes o quita alguna."
      );
      return;
    }

    if (nextFiles.length === 0) {
      return;
    }

    const invalidFileMessage = nextFiles
      .map((file) => validateVehicleImageFile(file))
      .find((message): message is string => Boolean(message));

    if (invalidFileMessage) {
      setErrorMessage(invalidFileMessage);
      return;
    }

    const existingSignatures = new Set(selectedFiles.map(getFileSignature));
    const deduplicatedFiles = nextFiles.filter((file) => {
      const signature = getFileSignature(file);

      if (existingSignatures.has(signature)) {
        return false;
      }

      existingSignatures.add(signature);
      return true;
    });

    if (deduplicatedFiles.length === 0) {
      setErrorMessage("Esas imagenes ya estaban preparadas para subir.");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    const nextPendingFiles =
      deduplicatedFiles.length > remainingPendingSlots
        ? [...selectedFiles, ...deduplicatedFiles.slice(0, remainingPendingSlots)]
        : [...selectedFiles, ...deduplicatedFiles];

    replacePendingFiles(nextPendingFiles);

    if (deduplicatedFiles.length > remainingPendingSlots) {
      setErrorMessage(
        `Podes preparar ${remainingPendingSlots} imagenes mas para esta unidad.`
      );
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleRemovePendingFile(indexToRemove: number) {
    setErrorMessage("");
    setSuccessMessage("");

    replacePendingFiles(
      selectedFiles.filter((_, index) => index !== indexToRemove)
    );
  }

  function reorderPendingFiles(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }

    const nextFiles = [...selectedFiles];
    const [movedFile] = nextFiles.splice(fromIndex, 1);

    if (!movedFile) {
      return;
    }

    nextFiles.splice(toIndex, 0, movedFile);
    replacePendingFiles(nextFiles);
  }

  function reorderImageList(
    currentImages: VehicleImageApiRecord[],
    fromImageId: string,
    toImageId: string
  ) {
    const fromIndex = currentImages.findIndex(
      (image) => image.id === fromImageId
    );
    const toIndex = currentImages.findIndex((image) => image.id === toImageId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return currentImages;
    }

    const nextImages = [...currentImages];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    return nextImages;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    processSelectedFiles(Array.from(event.target.files ?? []));
  }

  async function handleUpload() {
    if (selectedFiles.length === 0 || isUploading || isReordering) {
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("vehicleId", vehicleId);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/vehicle-images", {
        method: "POST",
        body: formData,
      });

      const result = (await response
        .json()
        .catch(() => null)) as VehicleImagesResponse | null;

      if (!response.ok || !result || !result.success) {
        setErrorMessage(
          result?.message ??
            "No pudimos subir las imagenes en este momento. Intenta nuevamente."
        );
        return;
      }

      setImages(result.images);
      clearPendingFiles();
      setSuccessMessage(
        result.message ?? "Las imagenes se cargaron correctamente."
      );
    } catch {
      setErrorMessage(
        "No pudimos subir las imagenes en este momento. Intenta nuevamente."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function toggleSelectedImage(imageId: string) {
    setSelectedImageIds((current) =>
      current.includes(imageId)
        ? current.filter((currentImageId) => currentImageId !== imageId)
        : [...current, imageId]
    );
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function deleteImages(imageIds: string[]) {
    const uniqueImageIds = Array.from(new Set(imageIds));

    if (uniqueImageIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      uniqueImageIds.length === 1
        ? "Vas a quitar esta imagen de la unidad. El cambio queda en historial y puede restaurarse durante 7 dias."
        : `Vas a quitar ${uniqueImageIds.length} imagenes de la unidad en un solo cambio reversible.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingImageIds(uniqueImageIds);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/vehicle-images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId,
          imageIds: uniqueImageIds,
        }),
      });

      const result = (await response
        .json()
        .catch(() => null)) as VehicleImageDeleteResponse | null;

      if (!response.ok || !result || !result.success) {
        setErrorMessage(
          result?.message ??
            "No pudimos eliminar la imagen en este momento. Intenta nuevamente."
        );
        return;
      }

      setImages(result.images);
      setSelectedImageIds((current) =>
        current.filter((imageId) => !uniqueImageIds.includes(imageId))
      );
      setSuccessMessage(
        result.message ?? "La imagen se elimino correctamente."
      );
    } catch {
      setErrorMessage(
        "No pudimos eliminar la imagen en este momento. Intenta nuevamente."
      );
    } finally {
      setDeletingImageIds([]);
    }
  }

  async function handleDelete(imageId: string) {
    await deleteImages([imageId]);
  }

  async function handleDeleteSelected() {
    await deleteImages(selectedImageIds);
  }

  async function persistImageOrder(nextImages: VehicleImageApiRecord[]) {
    setIsReordering(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/vehicle-images", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId,
          orderedImageIds: nextImages.map((image) => image.id),
        }),
      });

      const result = (await response
        .json()
        .catch(() => null)) as VehicleImagesResponse | null;

      if (!response.ok || !result || !result.success) {
        throw new Error(
          result?.message ??
            "No pudimos actualizar el orden de las imagenes en este momento."
        );
      }

      setImages(result.images);
      setSuccessMessage(
        result.message ?? "Orden de imagenes actualizado correctamente."
      );
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error(
            "No pudimos actualizar el orden de las imagenes en este momento."
          );
    } finally {
      setIsReordering(false);
    }
  }

  function handleImageDragStart(imageId: string) {
    if (isUploading || isReordering || deletingImageIds.length > 0) {
      return;
    }

    setDraggedImageId(imageId);
    setDropTargetImageId(imageId);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleImageDragOver(
    event: React.DragEvent<HTMLElement>,
    imageId: string
  ) {
    if (!draggedImageId || draggedImageId === imageId) {
      return;
    }

    event.preventDefault();
    setDropTargetImageId(imageId);
  }

  async function handleImageDrop(targetImageId: string) {
    if (
      !draggedImageId ||
      draggedImageId === targetImageId ||
      isUploading ||
      isReordering ||
      deletingImageIds.length > 0
    ) {
      setDraggedImageId(null);
      setDropTargetImageId(null);
      return;
    }

    const previousImages = images;
    const nextImages = reorderImageList(images, draggedImageId, targetImageId);

    if (nextImages === images) {
      setDraggedImageId(null);
      setDropTargetImageId(null);
      return;
    }

    setImages(nextImages);
    setDraggedImageId(null);
    setDropTargetImageId(null);

    try {
      await persistImageOrder(nextImages);
    } catch (error) {
      setImages(previousImages);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar el orden de las imagenes en este momento."
      );
    }
  }

  function handleDropzoneDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDropzoneActive(true);
  }

  function handleDropzoneDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDropzoneDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);

    if (dragCounterRef.current === 0) {
      setIsDropzoneActive(false);
    }
  }

  function handleDropzoneDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDropzoneActive(false);
    processSelectedFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function handlePendingDragStart(index: number) {
    if (isUploading || isReordering) {
      return;
    }

    setDraggedPendingIndex(index);
    setPendingDropTargetIndex(index);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handlePendingDragOver(
    event: React.DragEvent<HTMLElement>,
    index: number
  ) {
    if (draggedPendingIndex === null || draggedPendingIndex === index) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setPendingDropTargetIndex(index);
  }

  function handlePendingDrop(event: React.DragEvent<HTMLElement>, index: number) {
    if (
      draggedPendingIndex === null ||
      draggedPendingIndex === index ||
      isUploading ||
      isReordering
    ) {
      setDraggedPendingIndex(null);
      setPendingDropTargetIndex(null);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reorderPendingFiles(draggedPendingIndex, index);
    setDraggedPendingIndex(null);
    setPendingDropTargetIndex(null);
  }

  const pendingItems = pendingPreviews.map((preview, index) => ({
    file: selectedFiles[index],
    preview,
    signature: selectedFiles[index]
      ? getFileSignature(selectedFiles[index])
      : `${preview.name}-${index}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.28em] text-zinc-500 uppercase">
            Galeria de imagenes
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Fotos de {vehicleName}
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            Subi hasta {MAX_VEHICLE_IMAGES} fotos. La primera se muestra como
            principal.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
          {images.length}/{MAX_VEHICLE_IMAGES} imagenes
        </div>
      </div>

      <div
        onDragEnter={handleDropzoneDragEnter}
        onDragOver={handleDropzoneDragOver}
        onDragLeave={handleDropzoneDragLeave}
        onDrop={handleDropzoneDrop}
        className={`rounded-[1.75rem] border p-5 transition ${
          isDropzoneActive
            ? "border-zinc-950 bg-zinc-100"
            : "border-zinc-200 bg-zinc-50"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-700">
              Carga fotos desde tu equipo o arrastralas aqui.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Acepta JPG, PNG, WebP o AVIF, hasta{" "}
              {formatMegabytes(VEHICLE_IMAGE_MAX_FILE_SIZE_BYTES)} por archivo.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={inputRef}
              type="file"
              accept={VEHICLE_IMAGE_ACCEPT}
              multiple
              onChange={handleFileChange}
              disabled={!canSelectMoreFiles}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-3 file:font-medium file:text-zinc-900 hover:file:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button
              type="button"
              onClick={handleUpload}
              disabled={
                selectedFiles.length === 0 || isUploading || isReordering
              }
              className="h-12 rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" />
                  {selectedFiles.length > 1
                    ? `Subir ${selectedFiles.length} imagenes`
                    : "Subir imagen"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className={`mt-4 rounded-[1.5rem] border border-dashed transition ${
            isDropzoneActive
              ? "border-zinc-950 bg-white"
              : "border-zinc-300 bg-white/80"
          }`}
        >
          {pendingItems.length > 0 ? (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-zinc-700 uppercase">
                    Imagenes pendientes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Ordenalas antes de subirlas. La primera queda como
                    principal.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={!canSelectMoreFiles}
                  className="h-11 rounded-full border-zinc-300 bg-white px-5 text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed"
                >
                  <ImagePlus className="size-4" />
                  Agregar mas fotos
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pendingItems.map((item, index) => (
                  <article
                    key={item.signature}
                    draggable={
                      pendingItems.length > 1 && !isUploading && !isReordering
                    }
                    onDragStart={() => handlePendingDragStart(index)}
                    onDragOver={(event) => handlePendingDragOver(event, index)}
                    onDrop={(event) => handlePendingDrop(event, index)}
                    onDragEnd={() => {
                      setDraggedPendingIndex(null);
                      setPendingDropTargetIndex(null);
                    }}
                    className={`overflow-hidden rounded-[1.4rem] border bg-white shadow-[0_20px_50px_rgba(24,24,27,0.05)] transition ${
                      pendingDropTargetIndex === index &&
                      draggedPendingIndex !== index
                        ? "border-zinc-950 shadow-[0_20px_50px_rgba(24,24,27,0.12)]"
                        : "border-zinc-200"
                    } ${
                      draggedPendingIndex === index ? "opacity-70" : ""
                    } ${
                      pendingItems.length > 1 && !isUploading && !isReordering
                        ? "cursor-grab active:cursor-grabbing"
                        : ""
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-zinc-100">
                      <Image
                        src={item.preview.url}
                        alt={item.preview.name}
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute left-4 top-4 inline-flex rounded-full bg-white/92 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-700 uppercase shadow-sm">
                        {index === 0 ? "Principal al subir" : `Pendiente ${index + 1}`}
                      </div>
                      {pendingItems.length > 1 ? (
                        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-zinc-700 uppercase shadow-sm">
                          <GripVertical className="size-3.5" />
                          Reordenar
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-4 px-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-700">
                          {item.preview.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Lista para subir
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePendingFile(index)}
                        className="h-10 rounded-full px-4 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <X className="size-4" />
                        Quitar
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                Podes sumar mas fotos antes de subir la tanda.
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!canSelectMoreFiles}
              className={`flex w-full flex-col items-center justify-center px-6 py-10 text-center transition ${
                isDropzoneActive ? "bg-white" : "hover:bg-white/90"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="rounded-full bg-zinc-950 p-3 text-white shadow-sm">
                <ImagePlus className="size-5" />
              </div>
              <p className="mt-4 text-base font-medium text-zinc-900">
                {isDropzoneActive
                  ? "Suelta las imagenes para prepararlas"
                  : "Arrastra y suelta imagenes aqui"}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Tambien podes hacer clic para elegir varias fotos juntas.
              </p>
            </button>
          )}
        </div>
      </div>

      <div>
        {images.length > 0 ? (
          <>
            <div className="mb-4 flex flex-col gap-3 rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                {selectedImageIds.length > 0
                  ? `${selectedImageIds.length} imagen${
                      selectedImageIds.length === 1 ? "" : "es"
                    } seleccionada${
                      selectedImageIds.length === 1 ? "" : "s"
                    } para eliminar en un solo movimiento.`
                  : "Selecciona una o varias fotos para eliminarlas en un solo cambio."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedImageIds.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedImageIds([])}
                    disabled={deletingImageIds.length > 0}
                    className="h-10 rounded-full border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100"
                  >
                    Limpiar seleccion
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={() => void handleDeleteSelected()}
                  disabled={
                    selectedImageIds.length === 0 ||
                    deletingImageIds.length > 0 ||
                    isReordering
                  }
                  className="h-10 rounded-full bg-red-600 px-4 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {deletingImageIds.length > 1 ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      Eliminar seleccionadas
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <article
                key={image.id}
                draggable={
                  images.length > 1 &&
                  !isUploading &&
                  !isReordering &&
                  deletingImageIds.length === 0
                }
                onDragStart={() => handleImageDragStart(image.id)}
                onDragOver={(event) => handleImageDragOver(event, image.id)}
                onDrop={() => void handleImageDrop(image.id)}
                onDragEnd={() => {
                  setDraggedImageId(null);
                  setDropTargetImageId(null);
                }}
                className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_20px_50px_rgba(24,24,27,0.05)] transition ${
                  dropTargetImageId === image.id && draggedImageId !== image.id
                    ? "border-zinc-950 shadow-[0_20px_50px_rgba(24,24,27,0.12)]"
                    : "border-zinc-200"
                } ${
                  draggedImageId === image.id ? "opacity-70" : ""
                } ${
                  images.length > 1 &&
                  !isReordering &&
                  deletingImageIds.length === 0
                    ? "cursor-grab active:cursor-grabbing"
                    : ""
                }`}
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  <CloudinaryVehicleImage
                    publicId={image.publicId}
                    format={image.format}
                    alt={image.alt ?? vehicleName}
                    variant="adminPreview"
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute left-4 top-4 inline-flex rounded-full bg-white/92 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-700 uppercase shadow-sm">
                    {index === 0 ? "Principal" : `Foto ${index + 1}`}
                  </div>
                  <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-zinc-700 uppercase shadow-sm">
                    <GripVertical className="size-3.5" />
                    Arrastrar
                  </div>
                  <label className="absolute bottom-4 left-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-zinc-700 uppercase shadow-sm">
                    <input
                      type="checkbox"
                      checked={selectedImageIds.includes(image.id)}
                      onChange={() => toggleSelectedImage(image.id)}
                      disabled={deletingImageIds.length > 0 || isReordering}
                      className="size-3.5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-300"
                    />
                    Seleccionar
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      {image.alt ?? vehicleName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Orden visual: {index + 1}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      deletingImageIdSet.has(image.id) ||
                      deletingImageIds.length > 0 ||
                      isReordering
                    }
                    onClick={() => handleDelete(image.id)}
                    className="h-10 rounded-full px-4 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed"
                  >
                    {deletingImageIdSet.has(image.id) ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Borrando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-4" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </div>
              </article>
            ))}
            </div>
          </>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <h4 className="text-xl font-semibold text-zinc-950">
              Aun no cargaste imagenes
            </h4>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              La primera foto queda como principal.
            </p>
          </div>
        )}
      </div>

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
          (isReordering
            ? "Guardando el nuevo orden visual de las imagenes..."
            : `Fotos cargadas: ${images.length}. Pendientes: ${selectedFiles.length}. Espacio disponible: ${remainingPendingSlots}.`)}
      </p>
    </div>
  );
}
