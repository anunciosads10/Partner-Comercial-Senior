"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Upload } from "lucide-react";
import { Input } from "./ui/input";
import { useAuth } from "@/firebase";
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useToast } from "@/hooks/use-toast";


export function Header({ userData }) { // Recibe userData como prop
  const auth = useAuth();
  const { toast } = useToast();
  const { user } = useAuth() || {};
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
    const file = e.target.files[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      toast({
        title: "Imagen Seleccionada",
        description: `${file.name}`,
      });
      // Aquí iría la lógica para subir y actualizar el avatar
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
                  <AvatarImage src="https://picsum.photos/seed/1/200" alt="Avatar" />
                  <AvatarFallback>
                    {user?.email?.[0].toUpperCase() || <User />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <div>
                  <div>{user?.email}</div>
                  {userData && (
                    <div className="text-xs text-muted-foreground capitalize">
                      Rol: {userData.role}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
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
              <DropdownMenuItem onSelect={handleLogout}>
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
