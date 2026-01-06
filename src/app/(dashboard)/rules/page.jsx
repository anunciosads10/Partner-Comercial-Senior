'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Edit, FileText } from "lucide-react";
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
  DialogTrigger,
  DialogClose,
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
import { Textarea } from "@/components/ui/textarea";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ruleTypes = ["Anti-Fraude", "Términos de Servicio", "Política de Pagos", "Código de Conducta"];

// ======================= VISTA PARA SUPERADMIN =======================
const SuperAdminRulesView = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const rulesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rules') : null, [firestore]);
    const { data: rules, isLoading } = useCollection(rulesCollection);

    const [isDialogOpen, setDialogOpen] = React.useState(false);
    const [isAlertOpen, setAlertOpen] = React.useState(false);
    const [currentRule, setCurrentRule] = React.useState(null);
    const [ruleToDelete, setRuleToDelete] = React.useState(null);

    const openNewDialog = () => {
        setCurrentRule(null);
        setDialogOpen(true);
    };

    const openEditDialog = (rule) => {
        setCurrentRule(rule);
        setDialogOpen(true);
    };

    const openDeleteAlert = (rule) => {
        setRuleToDelete(rule);
        setAlertOpen(true);
    };
    
    const handleSaveRule = async (e) => {
        e.preventDefault();
        if (!firestore) return;

        const formData = new FormData(e.target);
        const ruleData = {
            name: formData.get('name'),
            type: formData.get('type'),
            description: formData.get('description'),
            content: formData.get('content'),
        };

        try {
            if (currentRule?.id) {
                // Actualizar regla existente
                const ruleRef = doc(firestore, 'rules', currentRule.id);
                await updateDoc(ruleRef, ruleData);
                toast({ title: "Regla Actualizada", description: "La regla ha sido modificada exitosamente." });
            } else {
                // Crear nueva regla
                await addDoc(collection(firestore, 'rules'), ruleData);
                toast({ title: "Regla Creada", description: "La nueva regla ha sido añadida." });
            }
            setDialogOpen(false);
            setCurrentRule(null);
        } catch (error) {
            console.error("Error al guardar la regla:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la regla." });
        }
    };
    
    const handleDeleteRule = async () => {
        if (!firestore || !ruleToDelete) return;
        try {
            await deleteDoc(doc(firestore, 'rules', ruleToDelete.id));
            toast({ title: "Regla Eliminada", description: "La regla ha sido eliminada permanentemente." });
        } catch (error) {
            console.error("Error al eliminar la regla:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la regla." });
        } finally {
            setAlertOpen(false);
            setRuleToDelete(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Reglas y Gobernanza</CardTitle>
                        <CardDescription>
                            Crea, edita y administra las políticas del programa.
                        </CardDescription>
                    </div>
                    <Button onClick={openNewDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Nueva Regla
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <p>Cargando reglas...</p> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre de la Regla</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules?.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <div className="font-medium">{rule.name}</div>
                                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{rule.type}</Badge></TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => openEditDialog(rule)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteAlert(rule)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!isLoading && rules?.length === 0 && (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No hay reglas configuradas. ¡Crea la primera!</p>
                    </div>
                )}
            </CardContent>

            {/* Diálogo para Crear/Editar Regla */}
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <form onSubmit={handleSaveRule}>
                        <DialogHeader>
                            <DialogTitle>{currentRule ? 'Editar Regla' : 'Crear Nueva Regla'}</DialogTitle>
                            <DialogDescription>
                                Completa los detalles de la política del programa.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre de la Regla</Label>
                                <Input id="name" name="name" defaultValue={currentRule?.name} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <select id="type" name="type" defaultValue={currentRule?.type || ruleTypes[0]} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    {ruleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción Corta</Label>
                                <Input id="description" name="description" defaultValue={currentRule?.description} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Contenido de la Regla (Texto Completo)</Label>
                                <Textarea id="content" name="content" defaultValue={currentRule?.content} required rows={6} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">Guardar Regla</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* Alerta para Eliminar */}
            <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar esta regla?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La regla "{ruleToDelete?.name}" será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRule}>Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </Card>
    );
};

// ======================= VISTA PARA ADMIN (PARTNER) =======================
const AdminRulesView = () => {
    const firestore = useFirestore();
    const rulesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rules') : null, [firestore]);
    const { data: rules, isLoading } = useCollection(rulesCollection);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reglas y Políticas del Programa</CardTitle>
                <CardDescription>
                    Consulta los términos, condiciones y políticas que rigen el programa de partners.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <p>Cargando reglas...</p> : (
                    rules && rules.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {rules.map(rule => (
                                <AccordionItem value={rule.id} key={rule.id}>
                                    <AccordionTrigger>
                                        <div className='flex items-center gap-4'>
                                          <Badge variant="outline">{rule.type}</Badge>
                                          <span className="font-semibold">{rule.name}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap px-2">
                                        {rule.content}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Aún no se han definido reglas para el programa.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
};

// ======================= COMPONENTE PRINCIPAL DE LA PÁGINA =======================
export default function RulesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userData, isLoading } = useDoc(userDocRef);

    if (isLoading) {
        return <p>Cargando...</p>;
    }

    if (userData?.role === 'superadmin') {
        return <SuperAdminRulesView />;
    }
    
    // Por defecto, o si es 'admin', muestra la vista de consulta
    return <AdminRulesView />;
}
