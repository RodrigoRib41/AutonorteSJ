"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminUserDeleteResponse } from "@/lib/admin-users";
import { deleteAdminUser } from "@/lib/supabase-data";

type DeleteAdminUserButtonProps = {
  userId: string;
  userUsername: string;
  userName: string;
  onDeleted?: (userId: string) => void;
};

export function DeleteAdminUserButton({
  userId,
  userUsername,
  userName,
  onDeleted,
}: DeleteAdminUserButtonProps) {
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
      const result = (await deleteAdminUser(userId)) as AdminUserDeleteResponse;

      if (!result?.success) {
        window.alert(
          result?.message ??
            "No pudimos eliminar el usuario gestor en este momento."
        );
        return;
      }

      onDeleted?.(userId);
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
