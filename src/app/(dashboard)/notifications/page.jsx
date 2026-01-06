'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, PlusCircle, BellRing, Eye, Trash2, Edit } from "lucide-react";
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
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


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

// --- Datos de ejemplo para notificaciones recibidas (para Admin/Partner) ---
const mockReceivedNotifications = [
    {
        id: "notif-1",
        title: "¡Felicitaciones por alcanzar el nivel Oro!",
        message: "Tu arduo trabajo ha dado sus frutos. Has sido ascendido a Partner de nivel Oro, con acceso a comisiones más altas y soporte prioritario.",
        timestamp: "2024-07-15T10:00:00Z",
        isRead: false,
        type: "Hito",
    },
    {
        id: "notif-2",
        title: "Pago Procesado",
        message: "Tu pago de comisiones de $1,250.00 ha sido procesado y será depositado en tu cuenta en las próximas 48 horas.",
        timestamp: "2024-07-14T15:30:00Z",
        isRead: true,
        type: "Pagos",
    },
    {
        id: "notif-3",
        title: "Alerta de Rendimiento",
        message: "Hemos notado una disminución en tu actividad de ventas esta semana. Contáctanos si necesitas ayuda o recursos adicionales.",
        timestamp: "2024-07-12T09:00:00Z",
        isRead: true,
        type: "Rendimiento",
    }
];

const getStatusBadgeVariant = (status) => {
  return status === 'active' ? 'default' : 'secondary';
};

// ======================= VISTA PARA SUPERADMIN =======================
const SuperAdminNotificationsView = () => {
    const { toast } = useToast();
    const [rules, setRules] = React.useState(mockNotificationRules);
    const [isDialogOpen, setDialogOpen] = React.useState(false);
    const [isAlertOpen, setAlertOpen] = React.useState(false);
    const [currentRule, setCurrentRule] = React.useState(null);
    const [ruleToDelete, setRuleToDelete] = React.useState(null);
    const [openMenuId, setOpenMenuId] = React.useState(null);


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

    const openNewDialog = () => {
        setCurrentRule(null);
        setDialogOpen(true);
    };

    const openEditDialog = (rule) => {
        setCurrentRule(rule);
        setDialogOpen(true);
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
            // Editar
            setRules(rules.map(r => r.id === currentRule.id ? { ...currentRule, ...ruleData } : r));
            toast({ title: "Regla Actualizada", description: "La regla de notificación ha sido modificada." });
        } else {
            // Crear
            const newRule = { ...ruleData, id: `rule-${Date.now()}`, status: 'inactive' };
            setRules([...rules, newRule]);
            toast({ title: "Regla Creada", description: "La nueva regla de notificación ha sido añadida." });
        }
        setDialogOpen(false);
        setCurrentRule(null);
    };
    
    const handleDeleteRule = () => {
        if (!ruleToDelete) return;
        setRules(rules.filter(r => r.id !== ruleToDelete.id));
        toast({ title: "Regla Eliminada", description: "La regla ha sido eliminada.", variant: "destructive" });
        setAlertOpen(false);
        setRuleToDelete(null);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Notificaciones Automáticas</CardTitle>
                        <CardDescription>
                            Configura alertas y notificaciones automáticas para mantener a los partners informados y comprometidos.
                        </CardDescription>
                    </div>
                    <Button onClick={openNewDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Nueva Regla
                    </Button>
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

            {/* Diálogo para Crear/Editar */}
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSaveRule}>
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
                            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
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
    const [notifications, setNotifications] = React.useState(mockReceivedNotifications);

    const handleMarkAsRead = (notifId) => {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    };

     const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, isRead: true })));
    };

    const handleDeleteAll = () => {
        setNotifications([]);
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
                 {notifications.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
                        <BellRing className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Tu bandeja de entrada está vacía.</p>
                    </div>
                 ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-lg flex items-start gap-4 transition-colors ${notif.isRead ? 'bg-secondary' : 'bg-card border'}`}>
                            {!notif.isRead && <div className="h-2 w-2 mt-1.5 rounded-full bg-primary animate-pulse" />}
                            <div className="flex-grow ml-2">
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
