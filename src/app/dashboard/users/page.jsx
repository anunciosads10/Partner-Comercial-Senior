'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  UserCheck, 
  Users, 
  ShieldCheck, 
  Search, 
  Filter, 
  Mail, 
  Shield, 
  Loader2,
  MoreVertical,
  Eye,
  Power,
  Trash2,
  Printer,
  Download,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

/**
 * @fileOverview Gestión y Auditoría Maestra de Usuarios Registrados.
 * Permite a Administradores y SuperAdmins auditar, activar/desactivar, ver detalles, imprimir y exportar en PDF.
 */
export default function UsersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [activeMenuId, setActiveMenuId] = React.useState(null);

  // Estados de Modales
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [userToToggle, setUserToToggle] = React.useState(null);
  const [userToDelete, setUserToDelete] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Cerrar menús flotantes al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: currentUserData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUserData || !user?.uid) return null;
    if (currentUserData.role !== 'admin' && currentUserData.role !== 'superadmin') return null;
    return collection(firestore, 'users');
  }, [firestore, currentUserData, user?.uid]);

  const { data: rawUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  const isSuperAdmin = currentUserData?.role === 'superadmin';

  // Filtrado reactivo por texto y rol
  const filteredUsers = React.useMemo(() => {
    if (!rawUsers) return [];
    return rawUsers.filter(u => {
      const matchesSearch = !searchQuery ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        (u.role?.toLowerCase() === roleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [rawUsers, searchQuery, roleFilter]);

  const stats = React.useMemo(() => {
    const total = rawUsers?.length || 0;
    const admins = rawUsers?.filter(u => u.role === 'admin').length || 0;
    const superadmins = rawUsers?.filter(u => u.role === 'superadmin').length || 0;
    return { total, admins, superadmins };
  }, [rawUsers]);

  // 1. Exportar PDF Individual
  const handleExportSinglePDF = (targetUser) => {
    try {
      const docPDF = new jsPDF();
      docPDF.setFontSize(22);
      docPDF.setTextColor(40, 53, 147);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("PARTNERVERSE", 105, 20, { align: "center" });

      docPDF.setFontSize(10);
      docPDF.setTextColor(100);
      docPDF.setFont("helvetica", "normal");
      docPDF.text("EXPEDIENTE OFICIAL DE USUARIO", 105, 28, { align: "center" });
      docPDF.line(20, 34, 190, 34);

      docPDF.setFontSize(14);
      docPDF.setTextColor(30);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("DATOS DE LA CUENTA REGISTRADA", 20, 48);

      docPDF.setFontSize(10);
      docPDF.setFont("helvetica", "normal");
      docPDF.text(`Nombre Completo: ${targetUser.name || 'Sin nombre'}`, 20, 60);
      docPDF.text(`Correo Electrónico: ${targetUser.email || 'N/A'}`, 20, 70);
      docPDF.text(`Rol Asignado: ${(targetUser.role || 'admin').toUpperCase()}`, 20, 80);
      docPDF.text(`Identificador UID: ${targetUser.id || 'N/A'}`, 20, 90);
      docPDF.text(`Estado: ${targetUser.status === 'inactive' ? 'INACTIVO' : 'ACTIVO'}`, 20, 100);
      docPDF.text(`Fecha de Expedición: ${new Date().toLocaleDateString()}`, 20, 110);

      docPDF.setFillColor(245, 247, 249);
      docPDF.rect(20, 125, 170, 20, 'F');
      docPDF.setFontSize(9);
      docPDF.setTextColor(80);
      docPDF.text("Este documento certifica el registro del usuario en la base de datos de PartnerVerse.", 25, 137);

      docPDF.save(`usuario-${targetUser.name || targetUser.id}.pdf`);
      toast({ title: "PDF Generado", description: "Expediente descargado correctamente." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF individual." });
    }
  };

  // 2. Exportar Lista Completa en PDF
  const handleExportAllPDF = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay usuarios para exportar." });
      return;
    }

    try {
      const docPDF = new jsPDF();
      docPDF.setFontSize(20);
      docPDF.setTextColor(40, 53, 147);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("PARTNERVERSE - REPORTE DE USUARIOS", 14, 18);

      docPDF.setFontSize(9);
      docPDF.setTextColor(110);
      docPDF.setFont("helvetica", "normal");
      docPDF.text(`Emisión: ${new Date().toLocaleString()} | Total registros: ${filteredUsers.length}`, 14, 25);
      docPDF.line(14, 28, 196, 28);

      let y = 38;
      docPDF.setFontSize(9);
      docPDF.setFont("helvetica", "bold");
      docPDF.setTextColor(50);
      docPDF.text("NOMBRE", 14, y);
      docPDF.text("EMAIL", 65, y);
      docPDF.text("ROL", 135, y);
      docPDF.text("ESTADO", 170, y);

      docPDF.setDrawColor(220);
      docPDF.line(14, y + 2, 196, y + 2);
      y += 8;

      docPDF.setFont("helvetica", "normal");
      docPDF.setFontSize(8);
      docPDF.setTextColor(30);

      filteredUsers.forEach((u) => {
        if (y > 275) {
          docPDF.addPage();
          y = 20;
        }
        const name = (u.name || 'Sin nombre').substring(0, 26);
        const email = (u.email || '').substring(0, 36);
        const role = (u.role || 'admin').toUpperCase();
        const status = u.status === 'inactive' ? 'INACTIVO' : 'ACTIVO';

        docPDF.text(name, 14, y);
        docPDF.text(email, 65, y);
        docPDF.text(role, 135, y);
        docPDF.text(status, 170, y);
        y += 7;
      });

      docPDF.save(`reporte-usuarios-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "Lista Exportada", description: "Reporte general descargado en PDF." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo exportar la lista." });
    }
  };

  // 3. Activar / Desactivar Usuario
  const confirmToggleStatus = async () => {
    if (!userToToggle || !firestore) return;
    setIsProcessing(true);
    try {
      const newStatus = userToToggle.status === 'inactive' ? 'active' : 'inactive';
      await updateDoc(doc(firestore, 'users', userToToggle.id), { status: newStatus });
      toast({ 
        title: "Estado Actualizado", 
        description: `El usuario ahora está ${newStatus === 'active' ? 'ACTIVO' : 'INACTIVO'}.` 
      });
      setUserToToggle(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Error de permisos", description: "Solo SuperAdmins pueden actualizar estados." });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Eliminar Usuario
  const confirmDeleteUser = async () => {
    if (!userToDelete || !firestore) return;
    if (userToDelete.id === user?.uid) {
      toast({ variant: "destructive", title: "Acción no permitida", description: "No puedes eliminar tu propia cuenta en sesión activa." });
      setUserToDelete(null);
      return;
    }
    setIsProcessing(true);
    try {
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      toast({ title: "Usuario Eliminado", description: "El registro ha sido removido del sistema." });
      setUserToDelete(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Error de permisos", description: "Solo SuperAdmins pueden eliminar usuarios." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isRoleLoading || isUsersLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Cabecera con Botón de Exportación */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <UserCheck className="h-8 w-8" /> Usuarios Registrados
            </h1>
            <p className="text-muted-foreground text-sm">
              Control de cuentas y roles registrados desde la plataforma pública.
            </p>
          </div>
          <Button 
            onClick={handleExportAllPDF}
            variant="outline" 
            className="gap-2 font-bold shadow-sm border-primary/20 text-primary hover:bg-primary/10"
          >
            <Download className="h-4 w-4" /> Descargar Lista Completa (PDF)
          </Button>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Total Cuentas</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-primary">{stats.total}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Registrados en la plataforma</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-blue-600">{stats.admins}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Rol Admin activo</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Super Administradores</CardTitle>
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-purple-600">{stats.superadmins}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Acceso global total</p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, email o UID..." 
              className="pl-10 shadow-sm border-primary/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px] shadow-sm">
                <Filter className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="superadmin">Super Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla de Usuarios con Columna de Acciones */}
        <Card className="border-primary/10 shadow-sm overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg uppercase font-black tracking-tight">
              Listado de Usuarios ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>ID de Usuario (UID)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isInactive = u.status === 'inactive';
                    const isMenuOpen = activeMenuId === u.id;

                    return (
                      <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-sm">
                          {u.name || 'Sin nombre'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 opacity-60" />
                            <span>{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={u.role === 'superadmin' ? 'default' : 'secondary'}
                            className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5"
                          >
                            {u.role || 'admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-1 rounded">
                            {u.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] uppercase font-bold ${
                              isInactive 
                                ? 'text-rose-600 border-rose-300 bg-rose-50' 
                                : 'text-emerald-600 border-emerald-300 bg-emerald-50'
                            }`}
                          >
                            {isInactive ? 'Inactivo' : 'Activo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 relative">
                          <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-full"
                              onClick={() => setActiveMenuId(isMenuOpen ? null : u.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {/* Menú Desplegable Flotante */}
                            {isMenuOpen && (
                              <div className="absolute right-6 top-10 w-48 bg-white border border-primary/10 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in-50 zoom-in-95 text-left">
                                <button
                                  onClick={() => { setSelectedUser(u); setActiveMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Ver Detalles
                                </button>
                                
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => { setUserToToggle(u); setActiveMenuId(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                  >
                                    <Power className="h-3.5 w-3.5" /> {isInactive ? 'Activar Usuario' : 'Desactivar Usuario'}
                                  </button>
                                )}

                                <button
                                  onClick={() => { handleExportSinglePDF(u); setActiveMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" /> Descargar PDF
                                </button>

                                <button
                                  onClick={() => { setSelectedUser(u); setActiveMenuId(null); setTimeout(() => window.print(), 300); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                  <Printer className="h-3.5 w-3.5" /> Imprimir Ficha
                                </button>

                                {isSuperAdmin && (
                                  <>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                      onClick={() => { setUserToDelete(u); setActiveMenuId(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Eliminar Usuario
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 italic text-muted-foreground">
                      No se encontraron usuarios registrados con esos criterios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal: Ver Detalles e Imprimir */}
        {selectedUser && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
            onClick={() => setSelectedUser(null)}
          >
            <div 
              id="printable-user-detail"
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b bg-muted/10">
                <div className="flex items-center gap-3 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Expediente de Usuario</h2>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors print:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-primary/20 flex flex-col items-center">
                  <h3 className="text-lg font-black text-slate-800 uppercase">{selectedUser.name || 'Sin nombre registrado'}</h3>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground font-semibold">Identificador UID:</span>
                    <span className="font-mono font-bold text-slate-700">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground font-semibold">Rol Asignado:</span>
                    <Badge variant={selectedUser.role === 'superadmin' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                      {selectedUser.role || 'admin'}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground font-semibold">Estado de la Cuenta:</span>
                    <Badge variant="outline" className={selectedUser.status === 'inactive' ? 'text-rose-600 bg-rose-50 border-rose-300' : 'text-emerald-600 bg-emerald-50 border-emerald-300'}>
                      {selectedUser.status === 'inactive' ? 'INACTIVO' : 'ACTIVO'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t bg-muted/10 print:hidden">
                <Button variant="outline" className="gap-2 font-bold text-primary" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" className="gap-2 font-bold text-primary" onClick={() => handleExportSinglePDF(selectedUser)}>
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <Button onClick={() => setSelectedUser(null)} className="font-bold">Cerrar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmación de Activar / Desactivar */}
        {userToToggle && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
            onClick={() => setUserToToggle(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">
                  {userToToggle.status === 'inactive' ? 'Activar Usuario' : 'Desactivar Usuario'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                ¿Estás seguro de que deseas {userToToggle.status === 'inactive' ? 'activar' : 'desactivar'} la cuenta de <strong>{userToToggle.name || userToToggle.email}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUserToToggle(null)} disabled={isProcessing}>
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmToggleStatus} 
                  disabled={isProcessing}
                  className="font-bold gap-2"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmación Crítica de Eliminación */}
        {userToDelete && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
            onClick={() => setUserToDelete(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">
                  Eliminar Usuario
                </h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                ¿Estás seguro de que deseas eliminar permanentemente a <strong>{userToDelete.name || userToDelete.email}</strong>?
              </p>
              <p className="text-xs text-rose-500 font-semibold mb-6">
                Esta acción borrará el registro del usuario en Firestore de forma irreversible.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={isProcessing}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDeleteUser} 
                  disabled={isProcessing}
                  className="font-bold gap-2 bg-rose-600 hover:bg-rose-700"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Eliminar Definitivamente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
