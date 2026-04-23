"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminUserDeleteResponse } from "@/lib/admin-users";

type DeleteAdminUserButtonProps = {
  userId: string;
  userUsername: string;
  userName: string;
};

export function DeleteAdminUserButton({
  userId,
  userUsername,
  userName,
}: DeleteAdminUserButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Vas a eliminar el acceso gestor de ${userName} (@${userUsername}). Esta accion no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const result = (await response
        .json()
        .catch(() => null)) as AdminUserDeleteResponse | null;

      if (!response.ok || !result?.success) {
        window.alert(
          result?.message ??
            "No pudimos eliminar el usuario gestor en este momento."
        );
        return;
      }

      router.refresh();
    } catch {
      window.alert(
        "No pudimos eliminar el usuario gestor en este momento."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
      className="h-9 rounded-full px-4 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed"
    >
      <Trash2 className="size-4" />
      {isDeleting ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}
