"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export function LogoutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="h-11 rounded-full border-white/20 bg-white/10 px-5 text-sm text-white hover:bg-white/15"
    >
      <LogOut className="size-4" />
      Cerrar sesion
    </Button>
  );
}
