"use client";

import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { CloudinaryVehicleImage } from "@/components/vehicles/cloudinary-vehicle-image";
import { type VehicleImageApiRecord } from "@/lib/vehicle-records";

type VehicleGalleryProps = {
  vehicleName: string;
  images: VehicleImageApiRecord[];
};

type LightboxOffset = {
  x: number;
  y: number;
};

type LightboxDragState = {
  pointerId: number;
  startOffsetX: number;
  startOffsetY: number;
  startX: number;
  startY: number;
};

const DEFAULT_LIGHTBOX_OFFSET: LightboxOffset = { x: 0, y: 0 };
const LIGHTBOX_MIN_ZOOM = 1;
const LIGHTBOX_MAX_ZOOM = 3;
const LIGHTBOX_ZOOM_STEP = 0.5;

function clampLightboxZoom(value: number) {
  return Math.min(
    LIGHTBOX_MAX_ZOOM,
    Math.max(LIGHTBOX_MIN_ZOOM, Number(value.toFixed(2)))
  );
}

export function VehicleGallery({ vehicleName, images }: VehicleGalleryProps) {
  const lightboxImageRef = useRef<HTMLImageElement | null>(null);
  const lightboxStageRef = useRef<HTMLDivElement | null>(null);
  const lightboxDragStateRef = useRef<LightboxDragState | null>(null);

  const [activeImageId, setActiveImageId] = useState(images[0]?.id ?? "");
  const [isDraggingLightbox, setIsDraggingLightbox] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxOffset, setLightboxOffset] = useState<LightboxOffset>(
    DEFAULT_LIGHTBOX_OFFSET
  );
  const [lightboxZoom, setLightboxZoom] = useState(LIGHTBOX_MIN_ZOOM);

  const activeImage =
    images.find((image) => image.id === activeImageId) ?? images[0] ?? null;

  const getLightboxBounds = useCallback(
    (nextZoom = lightboxZoom) => {
      const imageElement = lightboxImageRef.current;
      const stageElement = lightboxStageRef.current;

      if (!imageElement || !stageElement) {
        return { maxX: 0, maxY: 0 };
      }

      const stageRect = stageElement.getBoundingClientRect();
      const scaledWidth = imageElement.offsetWidth * nextZoom;
      const scaledHeight = imageElement.offsetHeight * nextZoom;

      return {
        maxX: Math.max(0, (scaledWidth - stageRect.width) / 2),
        maxY: Math.max(0, (scaledHeight - stageRect.height) / 2),
      };
    },
    [lightboxZoom]
  );

  const clampLightboxOffset = useCallback(
    (nextOffset: LightboxOffset, nextZoom = lightboxZoom) => {
      const { maxX, maxY } = getLightboxBounds(nextZoom);

      return {
        x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
        y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
      };
    },
    [getLightboxBounds, lightboxZoom]
  );

  const resetLightboxView = useCallback(() => {
    lightboxDragStateRef.current = null;
    setIsDraggingLightbox(false);
    setLightboxOffset(DEFAULT_LIGHTBOX_OFFSET);
    setLightboxZoom(LIGHTBOX_MIN_ZOOM);
  }, []);

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
    resetLightboxView();
  }, [resetLightboxView]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    resetLightboxView();
  }, [resetLightboxView]);

  const updateLightboxZoom = useCallback(
    (nextZoom: number) => {
      const safeZoom = clampLightboxZoom(nextZoom);

      setLightboxZoom(safeZoom);
      setLightboxOffset((currentOffset) =>
        safeZoom === LIGHTBOX_MIN_ZOOM
          ? DEFAULT_LIGHTBOX_OFFSET
          : clampLightboxOffset(currentOffset, safeZoom)
      );

      if (safeZoom === LIGHTBOX_MIN_ZOOM) {
        lightboxDragStateRef.current = null;
        setIsDraggingLightbox(false);
      }
    },
    [clampLightboxOffset]
  );

  function handleLightboxPointerDown(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (lightboxZoom <= LIGHTBOX_MIN_ZOOM) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    lightboxDragStateRef.current = {
      pointerId: event.pointerId,
      startOffsetX: lightboxOffset.x,
      startOffsetY: lightboxOffset.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDraggingLightbox(true);
  }

  function handleLightboxPointerMove(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    const dragState = lightboxDragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const nextOffset = clampLightboxOffset({
      x: dragState.startOffsetX + (event.clientX - dragState.startX),
      y: dragState.startOffsetY + (event.clientY - dragState.startY),
    });

    setLightboxOffset(nextOffset);
  }

  function handleLightboxPointerEnd(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (lightboxDragStateRef.current?.pointerId === event.pointerId) {
      lightboxDragStateRef.current = null;
      setIsDraggingLightbox(false);
    }
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        updateLightboxZoom(lightboxZoom + LIGHTBOX_ZOOM_STEP);
        return;
      }

      if (event.key === "-") {
        updateLightboxZoom(lightboxZoom - LIGHTBOX_ZOOM_STEP);
        return;
      }

      if (event.key === "0") {
        resetLightboxView();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    closeLightbox,
    isLightboxOpen,
    lightboxZoom,
    resetLightboxView,
    updateLightboxZoom,
  ]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    resetLightboxView();
  }, [activeImageId, isLightboxOpen, resetLightboxView]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    function handleResize() {
      setLightboxOffset((currentOffset) =>
        clampLightboxOffset(currentOffset, lightboxZoom)
      );
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [clampLightboxOffset, isLightboxOpen, lightboxZoom]);

  if (!activeImage) {
    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-zinc-950/15 bg-[linear-gradient(135deg,var(--brand-primary)_0%,var(--brand-soft)_56%,#2b292d_56%,#2b292d_100%)] p-8">
        <div className="flex min-h-[20rem] flex-col justify-end rounded-[1.25rem] border border-white/70 bg-white/72 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase">
            Sin fotos cargadas
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            {vehicleName}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-8 text-zinc-600">
            Consultanos y te compartimos fotos de la unidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openLightbox}
        aria-haspopup="dialog"
        aria-label={`Ampliar imagen de ${vehicleName}`}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-[1.5rem] border border-zinc-950/15 bg-white text-left shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring-soft)]"
      >
        <CloudinaryVehicleImage
          publicId={activeImage.publicId}
          format={activeImage.format}
          alt={activeImage.alt ?? vehicleName}
          variant="lightbox"
          fill
          preload={activeImage.id === images[0]?.id}
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-contain"
        />
        <div className="absolute left-5 top-5 inline-flex rounded-full bg-[rgba(221,210,51,0.95)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-950 uppercase shadow-sm">
          {activeImage.sortOrder === 0
            ? "Imagen principal"
            : `Vista ${activeImage.sortOrder + 1}`}
        </div>
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-end">
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950/88 px-3 py-2 text-xs font-semibold tracking-[0.16em] text-white uppercase shadow-sm backdrop-blur transition group-hover:bg-zinc-950">
            <ZoomIn className="size-4" />
            Toca para ampliar
          </span>
        </div>
      </button>

      {images.length > 1 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => {
            const isActive = image.id === activeImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageId(image.id)}
                className={`relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border transition ${
                  isActive
                    ? "border-[var(--brand-primary)] shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                    : "border-zinc-950/15 hover:border-zinc-950/40"
                }`}
              >
                <CloudinaryVehicleImage
                  publicId={image.publicId}
                  format={image.format}
                  alt={image.alt ?? `${vehicleName} vista ${image.sortOrder + 1}`}
                  variant="thumbnail"
                  fill
                  sizes="(min-width: 640px) 20vw, 30vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/94 px-3 py-3 sm:px-6 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada de ${vehicleName}`}
          onClick={closeLightbox}
        >
          <div
            className="mx-auto flex h-full max-w-7xl min-h-0 flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white uppercase">
                {activeImage.sortOrder === 0
                  ? "Imagen principal"
                  : `Vista ${activeImage.sortOrder + 1}`}{" "}
                - Zoom {lightboxZoom.toFixed(1)}x
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateLightboxZoom(lightboxZoom - LIGHTBOX_ZOOM_STEP)
                  }
                  disabled={lightboxZoom <= LIGHTBOX_MIN_ZOOM}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ZoomOut className="size-4" />
                  Alejar
                </button>
                <button
                  type="button"
                  onClick={resetLightboxView}
                  disabled={lightboxZoom === LIGHTBOX_MIN_ZOOM}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateLightboxZoom(lightboxZoom + LIGHTBOX_ZOOM_STEP)
                  }
                  disabled={lightboxZoom >= LIGHTBOX_MAX_ZOOM}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ZoomIn className="size-4" />
                  Acercar
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14"
                >
                  <X className="size-4" />
                  Cerrar
                </button>
              </div>
            </div>

            <div
              ref={lightboxStageRef}
              className={`relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 ${
                lightboxZoom > LIGHTBOX_MIN_ZOOM
                  ? isDraggingLightbox
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-default"
              }`}
              onPointerDown={handleLightboxPointerDown}
              onPointerMove={handleLightboxPointerMove}
              onPointerUp={handleLightboxPointerEnd}
              onPointerCancel={handleLightboxPointerEnd}
              style={{
                touchAction:
                  lightboxZoom > LIGHTBOX_MIN_ZOOM ? "none" : "auto",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div
                  className="will-change-transform"
                  style={{
                    transform: `translate3d(${lightboxOffset.x}px, ${lightboxOffset.y}px, 0)`,
                  }}
                >
                  <CloudinaryVehicleImage
                    ref={lightboxImageRef}
                    publicId={activeImage.publicId}
                    format={activeImage.format}
                    alt={activeImage.alt ?? vehicleName}
                    variant="lightbox"
                    preload
                    sizes="100vw"
                    draggable={false}
                    onLoad={() => {
                      setLightboxOffset((currentOffset) =>
                        clampLightboxOffset(currentOffset, lightboxZoom)
                      );
                    }}
                    className="pointer-events-none block h-auto max-h-full w-auto max-w-full select-none rounded-[1.25rem] bg-zinc-100 object-contain shadow-[0_28px_80px_rgba(0,0,0,0.34)] will-change-transform"
                    style={{
                      transform: `scale(${lightboxZoom})`,
                      transformOrigin: "center center",
                    }}
                  />
                </div>
              </div>

              {lightboxZoom > LIGHTBOX_MIN_ZOOM ? (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950/78 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
                  Arrastra la imagen para recorrerla
                </div>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((image) => {
                  const isActive = image.id === activeImage.id;

                  return (
                    <button
                      key={`lightbox-${image.id}`}
                      type="button"
                      onClick={() => setActiveImageId(image.id)}
                      className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[1rem] border transition sm:w-28 ${
                        isActive
                          ? "border-[var(--brand-primary)] shadow-[0_10px_28px_rgba(0,0,0,0.2)]"
                          : "border-white/18 hover:border-white/40"
                      }`}
                    >
                      <CloudinaryVehicleImage
                        publicId={image.publicId}
                        format={image.format}
                        alt={
                          image.alt ??
                          `${vehicleName} vista ${image.sortOrder + 1}`
                        }
                        variant="thumbnail"
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
