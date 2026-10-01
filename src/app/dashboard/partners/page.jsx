'use client';

import { PlatformDetailsDialog } from '@/components/dashboard/platform-details-dialog';
import Link from 'next/link';
import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { 
  Loader2, 
  ExternalLink, 
  Users as UsersIcon,
  MoreHorizontal,
  Info,
  ShieldAlert,
  X,
  UserPlus,
  Save,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function PartnerDetailsModal({ partner, open, onClose }) {
  if (!open || !partner) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
               <Info className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">Detalles del Socio</h2>
              <p className="text-sm text-gray-500">Ficha técnica administrativa del partner.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Correo Electrónico</span>
              <p className="text-sm font-semibold">{partner.email}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Nivel Actual</span>
              <div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">
                  {partner.tier || 'Silver'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Territorio</span>
              <p className="text-sm font-semibold">{partner.pais || 'Sin asignar'}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Fecha de Ingreso</span>
              <p className="text-sm font-semibold">
                {partner.joinDate || 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 p-4 rounded-xl flex items-center justify-between border">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado del Sistema</span>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${partner.status === 'Active' ? 'bg-green-500' : 'bg-destructive'}`}></div>
                <span className="text-sm font-black uppercase">{partner.status}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">ID Interno</span>
              <p className="text-[10px] font-mono text-muted-foreground opacity-60">{partner.id}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose}>Cerrar Ventana</Button>
          <Button onClick={onClose}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
}

function CreatePartnerModal({ open, onClose, firestore }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    tier: 'Silver',
    pais: '',
    status: 'Active'
  });

  if (!open) return null;

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Nombre y email son obligatorios." });
      return;
    }

    setIsSaving(true);
    const partnersCol = collection(firestore, 'partners');
    const newPartner = {
      ...formData,
      id: formData.email.replace(/[^a-zA-Z0-9]/g, '-'),
      joinDate: new Date().toISOString()
    };

    addDocumentNonBlocking(partnersCol, newPartner);
    toast({ title: "Socio Registrado", description: `${formData.name} ha sido añadido a la red.` });
    setIsSaving(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-tight">Nuevo Socio Comercial</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted rounded-full p-2">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej. Alexander Jiménez" />
          </div>
          <div className="space-y-2">
            <Label>Email Corporativo</Label>
            <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="m@ejemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={formData.pais} onChange={(e) => setFormData({...formData, pais: e.target.value})} placeholder="Ej. Colombia" />
            </div>
            <div className="space-y-2">
              <Label>Nivel (Tier)</Label>
              <Select value={formData.tier} onValueChange={(val) => setFormData({...formData, tier: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]">
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Partner
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminPartnersView({ userData }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedPlatform, setSelectedPlatform] = React.useState(null);
  const [generatedLink, setGeneratedLink] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [detailPlatform, setDetailPlatform] = React.useState(null);

  // Obtener datos del socio (referralCode y plataformas afiliadas)
  const partnerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'partners', user.uid);
  }, [firestore, user?.uid]);

  const { data: partnerData } = useDoc(partnerDocRef);
  const partnerCode = partnerData?.referralCode || user?.uid?.substring(0, 8).toUpperCase() || 'PARTNER';

  // Catálogo de plataformas SaaS
  const platformsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'saasPlatforms');
  }, [firestore, user?.uid]);

  const { data: platforms, isLoading } = useCollection(platformsRef);

  // Gestión de múltiples plataformas afiliadas por socio
  const affiliatedPlatforms = React.useMemo(() => {
    if (partnerData?.affiliatedPlatforms && Array.isArray(partnerData.affiliatedPlatforms)) {
      return partnerData.affiliatedPlatforms;
    }
    return platforms?.map(p => p.id) || [];
  }, [partnerData, platforms]);

  const handleToggleAffiliation = (platformId, platformName) => {
    if (!partnerDocRef) return;
    const isAffiliated = affiliatedPlatforms.includes(platformId);
    const updated = isAffiliated 
      ? affiliatedPlatforms.filter(id => id !== platformId)
      : [...affiliatedPlatforms, platformId];

    updateDocumentNonBlocking(partnerDocRef, {
      affiliatedPlatforms: updated
    });

    toast({
      title: isAffiliated ? "Afiliación Pausada" : "¡Plataforma Afiliada!",
      description: isAffiliated 
        ? `Has pausado tu afiliación a ${platformName}.` 
        : `Ya estás afiliado a ${platformName}. Tus comisiones recurrentes están activas.`,
    });
  };

  // Abrir modal "Tu Enlace de Afiliado" con URL única dinámica
  const handleOpenLinkModal = (platform) => {
    setSelectedPlatform(platform);
    setCopied(false);
    const cleanDomain = platform.domain
      ? platform.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
      : '';
    const host = cleanDomain || (platform.slug ? `${platform.slug}.app` : `${platform.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`) || 'menfy.app';
    const dynamicUrl = `https://${host}/aff/${partnerCode}`;
    setGeneratedLink(dynamicUrl);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: "¡Enlace Copiado!",
        description: "El enlace de seguimiento único ha sido guardado en el portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

    // Métricas reactivas y específicas según el SaaS seleccionado en el modal
  const pPlat = selectedPlatform?.name?.toUpperCase() || '';
  const pSlug = selectedPlatform?.slug?.toUpperCase() || '';
  const pId = selectedPlatform?.id || '';

  const pMetrics = selectedPlatform 
    ? (partnerData?.platformMetrics?.[pPlat] || 
       partnerData?.platformMetrics?.[pId] || 
       partnerData?.platformMetrics?.[pSlug] || 
       partnerData?.platformMetrics?.[selectedPlatform?.name] || 
       null)
    : null;

  const isMenfy = pId === 'menfy' || pPlat.includes('MENFY');

  const platformClicks = pMetrics?.clicks ?? (isMenfy ? (partnerData?.clicks || 0) : 0);
  const platformSignups = pMetrics?.signups ?? (isMenfy ? (partnerData?.signupsFromLink || 0) : 0);

  const platformConversion = platformClicks > 0 
    ? ((platformSignups / platformClicks) * 100).toFixed(1) 
    : '0.0';

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Tarjeta Mi Estatus */}
        <Card className="md:col-span-1 border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mi Estatus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nivel:</span>
              <Badge variant="secondary" className="font-bold">{partnerData?.tier || userData?.tier || 'Silver'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Territorio:</span>
              <span className="text-sm font-bold">{partnerData?.pais || userData?.pais || 'Global'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-muted-foreground font-semibold">Código de Afiliado:</span>
              <span className="font-mono font-bold text-primary">{partnerCode}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta Plataformas Disponibles y Múltiple Afiliación */}
        <Card className="md:col-span-2 border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Plataformas Disponibles</CardTitle>
            <CardDescription>
              Selecciona y gestiona tus aplicaciones SaaS asociadas. Cada una cuenta con su propio porcentaje de comisión recurrente y enlace de seguimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SaaS</TableHead>
                  <TableHead>Comisión Recurrente</TableHead>
                  <TableHead>Afiliación</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms?.map((platform) => {
                  const isAffiliated = affiliatedPlatforms.includes(platform.id);
                  return (
                    <TableRow key={platform.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase">{platform.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{platform.slug || platform.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary font-bold text-sm">
                        {platform.baseCommission || 30}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={isAffiliated}
                            onCheckedChange={() => handleToggleAffiliation(platform.id, platform.name)}
                          />
                          <Badge 
                            variant={isAffiliated ? "default" : "outline"} 
                            className="text-[9px] uppercase font-bold"
                          >
                            {isAffiliated ? "Afiliado" : "Pausado"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 gap-1 text-xs"
                            onClick={() => setDetailPlatform(platform)}
                          >
                            <Info className="h-3.5 w-3.5" /> Ver detalles
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-primary hover:bg-primary/5 gap-1 text-xs"
                            onClick={() => handleOpenLinkModal(platform)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Ver Enlace
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <PlatformDetailsDialog platform={detailPlatform} open={!!detailPlatform} onOpenChange={(v) => !v && setDetailPlatform(null)} />

      {/* Modal: Tu Enlace de Afiliado */}
      {selectedPlatform && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
          onClick={() => setSelectedPlatform(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-primary">Tu Enlace de Afiliado</h2>
              </div>
              <button 
                onClick={() => setSelectedPlatform(null)} 
                className="text-muted-foreground hover:bg-muted rounded-full p-2 transition-colors"
              >
                <X className="h-4 w-4"/>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usa esta URL única para registrar clientes. Las ventas completadas a través de este enlace acumularán automáticamente comisiones del <span className="font-bold text-primary text-sm">{selectedPlatform.baseCommission || 30}%</span> en tu billetera.
              </p>

              {/* Métricas específicas del SaaS seleccionado */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-muted/20 p-2.5 rounded-xl border border-primary/10 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight block">Total Clics</span>
                  <span className="text-xl font-black text-primary mt-0.5 block">{platformClicks}</span>
                </div>
                <div className="bg-muted/20 p-2.5 rounded-xl border border-primary/10 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight block">Registros</span>
                  <span className="text-xl font-black text-emerald-600 mt-0.5 block">{platformSignups}</span>
                </div>
                <div className="bg-muted/20 p-2.5 rounded-xl border border-primary/10 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight block">Conversión</span>
                  <span className="text-xl font-black text-purple-600 mt-0.5 block">{platformConversion}%</span>
                </div>
              </div>
              
              <div className="p-3.5 bg-muted/20 rounded-xl border border-primary/10 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ecosistema SaaS Seleccionado</span>
                <p className="text-base font-black uppercase text-slate-800">{selectedPlatform.name}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enlace de Seguimiento para Compartir</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={generatedLink} 
                    className="font-mono text-xs bg-muted/30 select-all"
                  />
                  <Button onClick={handleCopyLink} className="font-bold shrink-0">
                    {copied ? "¡Copiado!" : "Copiar URL"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t bg-muted/10">
              <Button variant="outline" onClick={() => setSelectedPlatform(null)}>
                Cerrar Ventana
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuperAdminPartnersView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPartner, setSelectedPartner] = React.useState(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const partnersRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'partners');
  }, [firestore, user?.uid]);

  const { data: partners, isLoading } = useCollection(partnersRef);

  const filteredPartners = React.useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTier = tierFilter === 'all' || p.tier === tierFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [partners, searchQuery, tierFilter, statusFilter]);

  const handleToggleStatus = (partnerId, currentStatus) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const docRef = doc(firestore, 'partners', partnerId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
    toast({
      title: "Estado Sincronizado",
      description: `El socio ha sido ${newStatus === 'Active' ? 'activado' : 'desactivado'}.`,
    });
  };

  const handleSuspend = (partnerId) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'partners', partnerId);
    updateDocumentNonBlocking(docRef, { status: 'Suspended' });
    toast({
      variant: "destructive",
      title: "Cuenta Suspendida",
      description: "El socio ha sido revocado de forma inmediata.",
    });
  };

  const closeDetails = React.useCallback(() => {
    setSelectedPartner(null);
    setIsCreateOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-locked');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o email..." 
              className="pl-10 shadow-sm border-primary/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full md:w-[160px] shadow-sm">
                <Filter className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Niveles</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] shadow-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="Active">Activo</SelectItem>
                <SelectItem value="Inactive">Inactivo</SelectItem>
                <SelectItem value="Suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 font-bold shadow-lg w-full md:w-auto">
          <UserPlus className="h-4 w-4" /> Registrar Nuevo Partner
        </Button>
      </div>

      <Card className="border-primary/10 shadow-sm animate-in fade-in duration-500">
        <CardHeader className="bg-muted/5 border-b">
          <CardTitle className="uppercase font-black text-primary tracking-tight">Gestión Maestra de Partners</CardTitle>
          <CardDescription>Control de activación, suspensión y auditoría de la red ({filteredPartners.length} socios).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Socio</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Estado y Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tight">{partner.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{partner.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{partner.pais || 'Sin asignar'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-black border-primary/20 text-primary">
                        {partner.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={partner.status === 'Active'} 
                            onCheckedChange={() => handleToggleStatus(partner.id, partner.status)}
                          />
                          <Badge 
                            variant={partner.status === 'Active' ? 'default' : partner.status === 'Suspended' ? 'destructive' : 'secondary'} 
                            className="text-[10px] uppercase min-w-[75px] justify-center font-black"
                          >
                            {partner.status}
                          </Badge>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50">Auditoría</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer font-bold" onSelect={() => setSelectedPartner(partner)}>
                              <Info className="h-4 w-4 text-primary" /> Ver Ficha Técnica
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer font-bold" onSelect={() => router.push(`/partners/${partner.id}/public`)}>
                              <ExternalLink className="h-4 w-4 text-accent" /> Perfil Público
                            </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/affiliation?partner=${encodeURIComponent(partner?.email || partner?.id || '')}`}
                    className="flex items-center gap-2 cursor-pointer w-full text-slate-700 hover:text-blue-600 px-2 py-1.5 text-sm outline-none"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Ver rendimiento de afiliación</span>
                  </Link>
                </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-destructive font-black uppercase text-[10px]" onSelect={() => handleSuspend(partner.id)}>
                              <ShieldAlert className="h-4 w-4" /> Suspender
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                    No se encontraron socios que coincidan con los criterios de búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PartnerDetailsModal partner={selectedPartner} open={!!selectedPartner} onClose={closeDetails} />
      <CreatePartnerModal open={isCreateOpen} onClose={closeDetails} firestore={firestore} />
    </>
  );
}

export default function PartnersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const isSuperAdmin = userData?.role === 'superadmin';

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
            <UsersIcon className="h-8 w-8" /> Gestión de Partners
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Administración estratégica de la red de socios comerciales.</p>
        </div>
        {isSuperAdmin ? <SuperAdminPartnersView /> : <AdminPartnersView userData={userData} />}
      </div>
    </AuthenticatedLayout>
  );
}
