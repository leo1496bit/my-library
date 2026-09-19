"use client";

import Link from "next/link";
import { LogOut, Upload, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export function UserMenu({ email }: { email: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border bg-card text-foreground"
            aria-label="Compte"
          />
        }
      >
        <UserIcon className="size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {email && (
          <>
            {/* Base UI exige un <Menu.Group> autour de GroupLabel, même
                sans radio group / regroupement fonctionnel derrière. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem render={<Link href="/import" />}>
          <Upload className="size-4" />
          Importer un CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            render={<button type="submit" className="w-full cursor-pointer text-left" />}
          >
            <LogOut className="size-4" />
            Se déconnecter
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
