'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, PlusCircle, BellRing, Eye, Trash2, Edit, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';


// --- Datos de ejemplo para las reglas de notificación (para SuperAdmin) ---
const mockNotificationRules = [
  {
    id: "rule-1",
    name: "Alerta de Bajo Rendimiento",
    description: "Notificar a un partner si sus ventas semanales caen por debajo de $500.",
    type: "Rendimiento",
    status: "active",
  },
  {
    id: "rule-2",
    name: "Felicitación por Hito de Ventas",
    description: "Enviar un mensaje de felicitación cuando un partner alcanza los $10,000 en ventas totales.",
    type: "Hito",
    status: "active",
  },
  {
    id: "rule-3",
    name: "Recordatorio de Inactividad",
    description: "Enviar un recordatorio si un partner no ha registrado actividad en los últimos 30 días.",
    type: "Inactividad",
    status: "inactive",
  },
];

const getStatusBadgeVariant = (status) => {
  return status === 'active' ? 'default' : 'secondary';
};

// ======================= VISTA PARA SUPERADMIN =======================
const SuperAdminNotificationsView = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [rules, setRules] = React.useState(mockNotificationRules);
    
    // Estados para diálogos y menús
    const [isRuleDialogOpen, setRuleDialogOpen] = React.useState(false);
    const [isIndividualDialogOpen, setIndividualDialogOpen] = React.useState(false);
    const [isAlertOpen, setAlertOpen] = React.useState(false);
    const [currentRule, setCurrentRule] = React.useState(null);
    const [ruleToDelete, setRuleToDelete] = React.useState(null);
    const [openMenuId, setOpenMenuId] = React.useState(null);

    // Estados para el formulario de notificación individual
    const [selectedPartnerId, setSelectedPartnerId] = React.useState("");
    const [notificationTitle, setNotificationTitle] = React.useState("");
    const [notificationMessage, setNotificationMessage] = React.useState("");
    const [isSending, setIsSending] = React.useState(false);

    // Obtener partners para el selector
    const partnersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'partners') : null, [firestore]);
    const { data: partners, isLoading: isLoadingPartners } = useCollection(partnersCollection);


    const handleStatusChange = (ruleId) => {
        setRules(prevRules =>
            prevRules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
                    : rule
            )
        );
        toast({ title: "Estado de la regla actualizado." });
    };

    const openNewRuleDialog = () => {
        setCurrentRule(null);
        setRuleDialogOpen(true);
    };

    const openEditDialog = (rule) => {
        setCurrentRule(rule);
        setRuleDialogOpen(true);
        setOpenMenuId(null);
    };

    const openDeleteAlert = (rule) => {
        setRuleToDelete(rule);
        setAlertOpen(true);
        setOpenMenuId(null);
    };

    const handleSaveRule = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const ruleData = {
            name: formData.get('name'),
            type: formData.get('type'),
            description: formData.get('description'),
        };

        if (currentRule) {
            setRules(rules.map(r => r.id === currentRule.id ? { ...currentRule, ...ruleData } : r));
            toast({ title: "Regla Actualizada", description: "La regla de notificación ha sido modificada." });
        } else {
            const newRule = { ...ruleData, id: `rule-${Date.now()}`, status: 'inactive' };
            setRules([...rules, newRule]);
            toast({ title: "Regla Creada", description: "La nueva regla de notificación ha sido añadida." });
        }
        setRuleDialogOpen(false);
        setCurrentRule(null);
    };
    
    const handleDeleteRule = () => {
        if (!ruleToDelete) return;
        setRules(rules.filter(r => r.id !== ruleToDelete.id));
        toast({ title: "Regla Eliminada", description: "La regla ha sido eliminada.", variant: "destructive" });
        setAlertOpen(false);
        setRuleToDelete(null);
    };

    const handleSendIndividualNotification = async (e) => {
        e.preventDefault();
        if (!firestore || !selectedPartnerId || !notificationTitle || !notificationMessage) {
            toast({ variant: "destructive", title: "Error", description: "Por favor, completa todos los campos." });
            return;
        }

        setIsSending(true);
        try {
            const notificationRef = collection(firestore, 'partners', selectedPartnerId, 'notifications');
            await addDoc(notificationRef, {
                partnerId: selectedPartnerId,
                type: 'Individual',
                title: notificationTitle,
                message: notificationMessage,
                timestamp: new Date().toISOString(),
                isRead: false,
            });

            toast({ title: "Notificación Enviada", description: "El mensaje ha sido enviado al partner." });
            setIndividualDialogOpen(false);
            // Resetear formulario
            setSelectedPartnerId("");
            setNotificationTitle("");
            setNotificationMessage("");

        } catch (error) {
            console.error("Error al enviar notificación individual:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la notificación." });
        } finally {
            setIsSending(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold">Centro de Comunicaciones y Alertas</CardTitle>
                        <CardDescription className="text-base mt-1">
                           Administra la interacción con tus socios. Automatiza notificaciones por hitos 
                           o envía mensajes directos y alertas manuales de forma individual.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                         <Button variant="outline" onClick={() => setIndividualDialogOpen(true)} className="border-primary text-primary hover:bg-primary/10">
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Alerta Manual
                        </Button>
                        
                        <Button onClick={openNewRuleDialog} className="bg-primary hover:bg-primary/90">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Regla Automática
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Regla de Notificación</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[100px]">Activada</TableHead>
                            <TableHead>
                                <span className="sr-only">Acciones</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.map((rule) => (
                            <TableRow key={rule.id}>
                                <TableCell>
                                    <div className="font-medium">{rule.name}</div>
                                    <div className="text-sm text-muted-foreground">{rule.description}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{rule.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(rule.status)}>
                                        {rule.status === 'active' ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={rule.status === 'active'}
                                        onCheckedChange={() => handleStatusChange(rule.id)}
                                        aria-label={`Activar o desactivar la regla ${rule.name}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu open={openMenuId === rule.id} onOpenChange={(isOpen) => setOpenMenuId(isOpen ? rule.id : null)}>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => openEditDialog(rule)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteAlert(rule)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {rules.length === 0 && (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-secondary mt-4">
                        <p className="text-muted-foreground">No hay reglas de notificación configuradas.</p>
                    </div>
                )}
            </CardContent>

            {/* Diálogo para Crear/Editar Reglas */}
            <Dialog open={isRuleDialogOpen} onOpenChange={setRuleDialogOpen}>
                 <form onSubmit={handleSaveRule}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{currentRule ? 'Editar Regla' : 'Crear Nueva Regla'}</DialogTitle>
                            <DialogDescription>
                                Completa los detalles de la regla de notificación.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" name="name" defaultValue={currentRule?.name} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Input id="description" name="description" defaultValue={currentRule?.description} required />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Input id="type" name="type" defaultValue={currentRule?.type} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setRuleDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Dialog>

            {/* MODAL DE ENVÍO INDIVIDUAL MEJORADO */}
            <Dialog open={isIndividualDialogOpen} onOpenChange={setIndividualDialogOpen}>
                <form onSubmit={handleSendIndividualNotification}>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <BellRing className="h-5 w-5 text-primary" />
                                Comunicación Directa con Partner
                            </DialogTitle>
                            <DialogDescription>
                                Selecciona un socio de la lista para enviarle una alerta o mensaje privado que aparecerá en su panel principal.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                              <Label className="font-semibold">Seleccionar Socio Destinatario</Label>
                              <div className="border rounded-md p-2 bg-slate-50">
                                <Command className="rounded-lg border shadow-md">
                                  {/* 1. EL BUSCADOR: Ahora es directo, no necesita Popover */}
                                  <CommandInput 
                                    placeholder="Escribe el nombre del socio..." 
                                    className="h-9"
                                    // Forzamos que el foco funcione dentro del Dialog
                                    onFocus={(e) => e.currentTarget.select()}
                                  />
                                  <CommandList className="max-h-[200px] overflow-y-auto">
                                    <CommandEmpty>No se encontraron socios con ese nombre.</CommandEmpty>
                                    <CommandGroup heading="Socios disponibles">
                                      {partners?.map((partner) => (
                                        <CommandItem
                                          key={partner.id}
                                          // Importante: usamos el nombre para que el buscador funcione
                                          value={partner.name}
                                          onSelect={() => {
                                            console.log("ID seleccionado:", partner.id);
                                            setSelectedPartnerId(partner.id);
                                          }}
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <div className="flex items-center">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedPartnerId === partner.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <span>{partner.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">({partner.email})</span>
                                          </div>
                                          {selectedPartnerId === partner.id && (
                                            <Badge variant="outline" className="bg-primary/10 text-primary text-[10px]">Seleccionado</Badge>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </div>
                              {selectedPartnerId && (
                                <p className="text-xs text-green-600 font-medium">
                                  Socio seleccionado correctamente.
                                </p>
                              )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="title" className="font-semibold">Asunto / Título de la Alerta</Label>
                                <Input 
                                    id="title" 
                                    placeholder="Ej: Actualización de comisiones o Alerta de cuenta"
                                    value={notificationTitle} 
                                    onChange={(e) => setNotificationTitle(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="message" className="font-semibold">Contenido del Mensaje</Label>
                                <Textarea 
                                    id="message" 
                                    placeholder="Redacta aquí el mensaje detallado para el socio..."
                                    value={notificationMessage} 
                                    onChange={(e) => setNotificationMessage(e.target.value)} 
                                    required 
                                    rows={5}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIndividualDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSending} className="min-w-[120px]">
                                {isSending ? (
                                    "Procesando..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Enviar Ahora
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Dialog>

            {/* Alerta para Eliminar */}
            <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es permanente y no se puede deshacer. La regla "{ruleToDelete?.name}" será eliminada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRule}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};


// ======================= VISTA PARA ADMIN (PARTNER) =======================
const AdminNotificationsView = () => {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsCollection = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, `partners/${user.uid}/notifications`);
    }, [firestore, user]);
    
    const { data: notifications, isLoading } = useCollection(notificationsCollection);

    const [displayedNotifications, setDisplayedNotifications] = React.useState([]);

     React.useEffect(() => {
        if (notifications) {
            // Ordenar por timestamp descendente
            const sorted = [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setDisplayedNotifications(sorted);
        }
    }, [notifications]);


    const handleMarkAsRead = (notifId) => {
        // En una implementación real, esto actualizaría el documento en Firestore
        setDisplayedNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    };

     const handleMarkAllAsRead = () => {
        // En una implementación real, esto actualizaría todos los documentos en Firestore
        setDisplayedNotifications(prev => prev.map(n => ({...n, isRead: true })));
    };

    const handleDeleteAll = () => {
         // En una implementación real, esto eliminaría los documentos en Firestore
        setDisplayedNotifications([]);
    };
    
    return (
         <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Bandeja de Entrada de Notificaciones</CardTitle>
                        <CardDescription>
                            Aquí encontrarás todas las alertas, hitos y actualizaciones importantes sobre tu cuenta.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                            <Eye className="mr-2 h-4 w-4" />
                            Marcar todo como leído
                        </Button>
                         <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Limpiar bandeja
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                 {isLoading ? (
                    <p>Cargando notificaciones...</p>
                 ) : displayedNotifications.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
                        <BellRing className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Tu bandeja de entrada está vacía.</p>
                    </div>
                 ) : (
                    displayedNotifications.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-lg flex items-start gap-4 transition-colors ${notif.isRead ? 'bg-secondary' : 'bg-card border'}`}>
                            {!notif.isRead && <div className="h-2 w-2 mt-1.5 rounded-full bg-primary animate-pulse" />}
                            <div className={`flex-grow ${!notif.isRead ? 'ml-2' : 'ml-4'}`}>
                                <p className={`font-semibold ${notif.isRead ? 'text-muted-foreground' : ''}`}>{notif.title}</p>
                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                             {!notif.isRead && (
                                <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                                    Marcar como leído
                                </Button>
                            )}
                        </div>
                    ))
                 )}
                </div>
            </CardContent>
        </Card>
    );
};

// ======================= COMPONENTE PRINCIPAL DE LA PÁGINA =======================
export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  if (isLoading) {
    return <p>Cargando notificaciones...</p>;
  }

  // Renderiza la vista correcta según el rol del usuario
  if (userData?.role === 'superadmin') {
    return <SuperAdminNotificationsView />;
  }
  
  // Por defecto, o si es 'admin', muestra la vista del partner
  return <AdminNotificationsView />;
}
