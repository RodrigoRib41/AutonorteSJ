import { LogOut } from "lucide-react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="h-11 rounded-full border-white/20 bg-white/10 px-5 text-sm text-white hover:bg-white/15"
      >
        <LogOut className="size-4" />
        Cerrar sesion
      </Button>
    </form>
  );
}
