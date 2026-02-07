
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview Componente Header del dashboard.
 * Muestra el perfil del usuario, notificaciones y logout.
 */
export function Header({ userData }) {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "Imagen Seleccionada",
        description: `${file.name}`,
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-1 items-center justify-end gap-4">
        {!isClient ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid || '1'}/200`} alt="Avatar" />
                  <AvatarFallback>
                    {user?.email?.[0].toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{userData?.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-[10px] text-primary uppercase font-bold mt-1">
                  Rol: {userData?.role || 'Admin'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Cambiar Avatar
              </DropdownMenuItem>
              <Input 
                id="file-upload-header" 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
