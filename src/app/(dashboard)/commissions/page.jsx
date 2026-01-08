'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { Input } from '@/components/ui/input';
import { Search, Download, MoreHorizontal, Eye, Bell, Info, Calendar, User, Tag, CircleDollarSign, CheckCircle, Edit, Trash2, Pencil, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


const CommissionDetailsDialog = ({ commission, isOpen, onOpenChange }) => {
    if (!commission) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary"/>
                        Detalle de la Transacción
                    </DialogTitle>
                    <DialogDescription>
                        ID: {commission.id}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4"/> Partner</Label>
                        <span className="col-span-2 font-medium">{commission.partnerName || 'N/A'}</span>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground flex items-center gap-1"><CircleDollarSign className="h-4 w-4"/> Monto</Label>
                        <span className="col-span-2 font-bold text-primary">${commission.amount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4"/> Fecha</Label>
                        <span className="col-span-2">{new Date(commission.paymentDate).toLocaleDateString()}</span>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground flex items-center gap-1"><Tag className="h-4 w-4"/> Estado</Label>
                        <div className="col-span-2">
                            <Badge variant={commission.status === 'Pagado' ? 'default' : 'secondary'}>{commission.status}</Badge>
                        </div>
                    </div>
                     {commission.status === 'Pagado' && commission.paidAt && (
                        <div className="grid grid-cols-3 items-center gap-4 text-green-600">
                           <Label className="flex items-center gap-1"><CheckCircle className="h-4 w-4"/> Pagado el</Label>
                           <span className="col-span-2 font-medium">{new Date(commission.paidAt).toLocaleString()}</span>
                        </div>
                     )}
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CommissionsTable = ({ commissions, onSelectDetail, onSelectEdit, onSelectDelete, onSelectNotify, openMenuId, setOpenMenuId }) => {

  if (!commissions || commissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
        <p className="text-muted-foreground">No hay datos de comisiones disponibles.</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Transacción</TableHead>
          <TableHead>Partner</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead><span className="sr-only">Acciones</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((commission) => (
          <TableRow key={commission.id}>
            <TableCell className="font-mono">{commission.id}</TableCell>
            <TableCell>{commission.partnerName || 'N/A'}</TableCell>
            <TableCell className="font-semibold text-primary">${commission.amount.toLocaleString()}</TableCell>
            <TableCell>{new Date(commission.paymentDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant={commission.status === 'Pagado' ? 'default' : 'secondary'}>{commission.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu open={openMenuId === commission.id} onOpenChange={(isOpen) => setOpenMenuId(isOpen ? commission.id : null)}>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => onSelectDetail(commission)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                        </DropdownMenuItem>
                         {commission.status !== 'Pagado' && (
                          <>
                            <DropdownMenuItem onSelect={() => onSelectEdit(commission)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onSelect={() => onSelectDelete(commission)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onSelectNotify(commission)}>
                          <Bell className="mr-2 h-4 w-4" /> Notificar Partner
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export default function CommissionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // State for dialogs and menus
  const [selectedCommission, setSelectedCommission] = React.useState(null);
  const [commissionToEdit, setCommissionToEdit] = React.useState(null);
  const [commissionToDelete, setCommissionToDelete] = React.useState(null);
  const [commissionToNotify, setCommissionToNotify] = React.useState(null);

  const [isDetailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [isNotifyDialogOpen, setNotifyDialogOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState(null);

  // State for notification modal
  const [notificationMessage, setNotificationMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const { role, uid } = userData || {};

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (role === 'superadmin') {
      return collection(firestore, 'payments');
    }
    if (role === 'admin' && uid) {
      return query(collection(firestore, 'payments'), where('partnerId', '==', uid));
    }
    return null;
  }, [firestore, role, uid]);

  const { data: allCommissions, isLoading: areCommissionsLoading } = useCollection(paymentsQuery);
    
  const filteredCommissions = React.useMemo(() => {
    if (!allCommissions) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allCommissions.filter(commission =>
      (commission.id || '').toLowerCase().includes(lowerCaseSearch) ||
      (commission.partnerName || '').toLowerCase().includes(lowerCaseSearch) ||
      (commission.status || '').toLowerCase().includes(lowerCaseSearch)
    );
  }, [allCommissions, searchTerm]);


  const totalEarnings = filteredCommissions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  const isLoading = isRoleLoading || areCommissionsLoading;

  const handleExport = () => {
    if (!filteredCommissions || filteredCommissions.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
      });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID Transaccion", "Partner", "Monto", "Fecha", "Estado"];
    csvContent += headers.join(",") + "\r\n";

    filteredCommissions.forEach(c => {
      const row = [
        c.id,
        c.partnerName || 'N/A',
        c.amount,
        new Date(c.paymentDate).toLocaleDateString(),
        c.status
      ];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_comisiones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

     toast({ title: "Reporte de Comisiones Generado" });
  };
  
  // Handlers for actions
  const handleSelectDetail = (commission) => {
    setSelectedCommission(commission);
    setDetailDialogOpen(true);
    setOpenMenuId(null);
  };

  const handleSelectEdit = (commission) => {
    setCommissionToEdit(commission);
    setEditDialogOpen(true);
    setOpenMenuId(null);
  };
  
  const handleSelectDelete = (commission) => {
    setCommissionToDelete(commission);
    setAlertOpen(true);
    setOpenMenuId(null);
  };

  const handleSelectNotify = (commission) => {
    setCommissionToNotify(commission);
    setNotificationMessage(""); // Reset message
    setNotifyDialogOpen(true);
    setOpenMenuId(null);
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    if (!firestore || !commissionToEdit) return;

    const commissionRef = doc(firestore, "payments", commissionToEdit.id);
    try {
      await updateDoc(commissionRef, {
        amount: Number(commissionToEdit.amount),
        partnerName: commissionToEdit.partnerName,
      });
      toast({ title: "Comisión Actualizada", description: "Los datos se han guardado." });
      setEditDialogOpen(false);
      setCommissionToEdit(null);
    } catch (error) {
      console.error("Error updating commission:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la comisión." });
    }
  };

  const handleDeleteCommission = async () => {
    if (!firestore || !commissionToDelete) return;

    const commissionRef = doc(firestore, "payments", commissionToDelete.id);
    try {
      await deleteDoc(commissionRef);
      toast({ title: "Comisión Eliminada", description: "El registro ha sido eliminado." });
      setAlertOpen(false);
      setCommissionToDelete(null);
    } catch (error) {
      console.error("Error deleting commission:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la comisión." });
    }
  };
  
  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
        toast({ variant: "destructive", title: "El mensaje no puede estar vacío" });
        return;
    }

    setIsSending(true);
    try {
        // En una app real, aquí se llamaría a Firebase para crear una notificación.
        // await addDoc(collection(firestore, `partners/${commissionToNotify.partnerId}/notifications`), { ... });
        console.log(`Enviando a ${commissionToNotify.partnerId}: ${notificationMessage}`);
        
        toast({ 
        title: "Notificación enviada", 
        description: `Se ha enviado el mensaje a ${commissionToNotify.partnerName || commissionToNotify.partnerId}` 
        });
        
        setNotifyDialogOpen(false); // Cierra el modal
    } catch (error) {
        console.error("Error enviando notificación:", error);
        toast({ variant: "destructive", title: "Error al enviar la notificación" });
    } finally {
        setIsSending(false);
    }
  };


  if (isLoading) {
    return <div>Cargando comisiones...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Tus Comisiones</CardTitle>
                <CardDescription>
                  {role === 'superadmin' 
                    ? "Un resumen operativo de todas las transacciones de comisiones." 
                    : "Aquí tienes un desglose detallado de tus ganancias."}
                </CardDescription>
            </div>
            {role === 'superadmin' && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Reporte
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
           <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, partner o estado..."
                className="w-full rounded-lg bg-secondary pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          <CommissionsTable 
            commissions={filteredCommissions} 
            onSelectDetail={handleSelectDetail}
            onSelectEdit={handleSelectEdit}
            onSelectDelete={handleSelectDelete}
            onSelectNotify={handleSelectNotify}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
          />
        </CardContent>
      </Card>
      <Card className="w-full md:w-1/3 self-end">
          <CardHeader className="pb-2">
              <CardDescription>Ganancias Totales (Filtradas)</CardDescription>
              <CardTitle className="text-4xl">${totalEarnings.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-xs text-muted-foreground">
                  Esta es la suma de las comisiones que coinciden con tu búsqueda.
              </div>
          </CardContent>
      </Card>

      <CommissionDetailsDialog
        commission={selectedCommission}
        isOpen={isDetailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
           {commissionToEdit && (
              <form onSubmit={handleUpdateCommission}>
                <DialogHeader>
                    <DialogTitle>Editar Comisión</DialogTitle>
                    <DialogDescription>ID: {commissionToEdit.id}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-partnerName">Partner</Label>
                        <Input
                          id="edit-partnerName"
                          value={commissionToEdit.partnerName}
                          onChange={(e) => setCommissionToEdit({ ...commissionToEdit, partnerName: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-amount">Monto</Label>
                        <Input
                          id="edit-amount"
                          type="number"
                          value={commissionToEdit.amount}
                          onChange={(e) => setCommissionToEdit({ ...commissionToEdit, amount: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Alert Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la comisión de 
              <span className="font-bold"> ${commissionToDelete?.amount.toLocaleString()}</span> para 
              <span className="font-bold"> {commissionToDelete?.partnerName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCommission}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notify Partner Dialog */}
        <Dialog open={isNotifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Notificar a {commissionToNotify?.partnerName || 'Partner'}</DialogTitle>
                <DialogDescription>
                    Escribe el mensaje que recibirá el partner sobre su comisión de ${commissionToNotify?.amount?.toLocaleString()}.
                </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                <Label htmlFor="message">Mensaje personalizado</Label>
                <Textarea 
                    id="message" 
                    placeholder="Ej: Tu comisión de este mes ya ha sido aprobada..." 
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={4}
                    className="mt-2"
                />
                </div>
                <DialogFooter>
                <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSendNotification} disabled={isSending}>
                    {isSending ? "Enviando..." : <><Send className="mr-2 h-4 w-4"/> Enviar Notificación</>}
                </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
