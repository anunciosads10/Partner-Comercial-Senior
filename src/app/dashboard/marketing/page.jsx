'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Megaphone, Plus, Copy, Check, ExternalLink, Trash2, Edit3, Loader2, 
  Sparkles, AlertCircle, Tag, Radio 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// 1. Opciones fijas base inmutables
const FIXED_TYPES = [
  { id: 'texto', label: 'Texto Listo', behavior: 'texto' },
  { id: 'guion', label: 'Guion', behavior: 'texto' },
  { id: 'archivo', label: 'Presentación / Archivo', behavior: 'enlace' },
  { id: 'video', label: 'Video / Demo', behavior: 'enlace' },
  { id: 'argumento', label: 'Argumento de Venta', behavior: 'texto' },
];

const FIXED_CHANNELS = [
  { id: 'general', label: 'General' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'correo', label: 'Correo Electrónico' },
  { id: 'llamada', label: 'Llamada' },
];

export default function MarketingPage() {
  const { user } = useUser();
  const { storage } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedPlatformId, setSelectedPlatformId] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('texto');
  const [copiedId, setCopiedId] = React.useState(null);

  // Estados de SuperAdmin: Diálogo Principal
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState(null);

  // Estados de SuperAdmin: Mini-diálogos "+"
  const [isAddTypeOpen, setIsAddTypeOpen] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState('');
  const [newTypeBehavior, setNewTypeBehavior] = React.useState('texto');
  const [isSavingType, setIsSavingType] = React.useState(false);

  const [isAddChannelOpen, setIsAddChannelOpen] = React.useState(false);
  const [newChannelName, setNewChannelName] = React.useState('');
  const [isSavingChannel, setIsSavingChannel] = React.useState(false);

  const [formData, setFormData] = React.useState({
    type: 'texto',
    channel: 'general',
    title: '',
    content: '',
    url: '',
    order: 0,
    active: true
  });

  // Rol del usuario
  const userDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'users', user.uid)), [firestore, user?.uid]);
  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);
  const isSuperAdmin = userData?.role === 'superadmin';

  // Datos del socio para reemplazar variables
  const partnerDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'partners', user.uid)), [firestore, user?.uid]);
  const { data: partnerData } = useDoc(partnerDocRef);
  const partnerCode = partnerData?.referralCode || user?.uid?.substring(0, 8).toUpperCase() || '';
  const partnerName = userData?.name || partnerData?.name || user?.displayName || '';

  // Plataformas SaaS activas
  const platformsRef = useMemoFirebase(() => (!firestore ? null : collection(firestore, 'saasPlatforms')), [firestore]);
  const { data: rawPlatforms, isLoading: isPlatformsLoading } = useCollection(platformsRef);
  
  const activePlatforms = React.useMemo(() => {
    if (!rawPlatforms) return [];
    return rawPlatforms.filter(p => p.status === 'Active' || !p.status);
  }, [rawPlatforms]);

  React.useEffect(() => {
    if (activePlatforms.length > 0 && !selectedPlatformId) {
      const menfy = activePlatforms.find(p => p.name?.toLowerCase().includes('menfy'));
      setSelectedPlatformId(menfy ? menfy.id : activePlatforms[0].id);
    }
  }, [activePlatforms, selectedPlatformId]);

  const currentPlatform = React.useMemo(() => {
    return activePlatforms.find(p => p.id === selectedPlatformId) || activePlatforms[0] || null;
  }, [activePlatforms, selectedPlatformId]);

  // Lectura de opciones personalizadas desde marketingSettings/options
  const settingsDocRef = useMemoFirebase(() => (!firestore ? null : doc(firestore, 'marketingSettings', 'options')), [firestore]);
  const { data: settingsData } = useDoc(settingsDocRef);

  const customTypes = React.useMemo(() => {
    return Array.isArray(settingsData?.customTypes) ? settingsData.customTypes : [];
  }, [settingsData]);

  const customChannels = React.useMemo(() => {
    return Array.isArray(settingsData?.customChannels) ? settingsData.customChannels : [];
  }, [settingsData]);

  // Listas efectivas (Fijas primero, personalizadas al final)
  const effectiveTypes = React.useMemo(() => {
    return [...FIXED_TYPES, ...customTypes];
  }, [customTypes]);

  const effectiveChannels = React.useMemo(() => {
    return [...FIXED_CHANNELS, ...customChannels];
  }, [customChannels]);

  const getBehaviorForType = React.useCallback((typeId) => {
    const found = effectiveTypes.find(t => t.id === typeId);
    return found?.behavior || 'texto';
  }, [effectiveTypes]);

  const getChannelLabel = React.useCallback((channelId) => {
    const found = effectiveChannels.find(c => c.id === channelId);
    return found?.label || channelId;
  }, [effectiveChannels]);

  // Normalizadores de texto e ID
  const normalizeText = (str) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const createIdFromText = (str) => {
    return normalizeText(str)
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // Construcción de enlace de afiliado
  const cleanDomain = currentPlatform?.domain 
    ? currentPlatform.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '') 
    : (currentPlatform?.slug ? (currentPlatform.slug + '.app') : 'menfy.app');
  const affiliateUrl = partnerCode ? ('https://' + cleanDomain + '/aff/' + partnerCode) : '';

  const isAffiliated = React.useMemo(() => {
    if (!currentPlatform || !partnerData) return true;
    if (!partnerData.affiliatedPlatforms) return true;
    return Array.isArray(partnerData.affiliatedPlatforms) && partnerData.affiliatedPlatforms.includes(currentPlatform.id);
  }, [currentPlatform, partnerData]);

  // Colección de recursos
  const assetsRef = useMemoFirebase(() => (!firestore ? null : collection(firestore, 'marketingAssets')), [firestore]);
  const { data: rawAssets, isLoading: isAssetsLoading } = useCollection(assetsRef);

  const filteredAssets = React.useMemo(() => {
    if (!rawAssets || !currentPlatform) return [];
    return rawAssets
      .filter(a => a.platformId === currentPlatform.id && (isSuperAdmin ? true : a.active === true))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }, [rawAssets, currentPlatform, isSuperAdmin]);

  const replaceVariables = (text) => {
    if (!text) return '';
    let result = text;
    if (affiliateUrl) result = result.replace(/\{\{enlace\}\}/g, affiliateUrl);
    if (partnerCode) result = result.replace(/\{\{codigo\}\}/g, partnerCode);
    if (partnerName) result = result.replace(/\{\{nombre_socio\}\}/g, partnerName);
    return result;
  };

  const handleCopyText = (id, textToCopy) => {
    const finalContent = replaceVariables(textToCopy);
    navigator.clipboard.writeText(finalContent);
    setCopiedId(id);
    toast({ title: "Copiado al Portapapeles", description: "El material de marketing está listo para compartir." });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // SuperAdmin: Abrir Diálogo Crear
  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormData({
      type: activeTab === 'mi_enlace' ? 'texto' : activeTab,
      channel: 'general',
      title: '',
      content: '',
      url: '',
      order: filteredAssets.length + 1,
      active: true
    });
    setUploadFile(null);
    setIsDialogOpen(true);
  };

  // SuperAdmin: Abrir Diálogo Editar
  const handleOpenEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      type: asset.type || 'texto',
      channel: asset.channel || 'general',
      title: asset.title || '',
      content: asset.content || '',
      url: asset.url || '',
      order: asset.order ?? 0,
      active: asset.active !== false
    });
    setUploadFile(null);
    setIsDialogOpen(true);
  };

  // SuperAdmin: Guardar Recurso
  const handleSaveAsset = async () => {
    if (!formData.title?.trim()) {
      toast({ variant: "destructive", title: "Título obligatorio", description: "Ingresa un título para el recurso." });
      return;
    }

    setIsSaving(true);
    try {
      let finalUrl = formData.url || '';

      if (uploadFile) {
        if (uploadFile.size > 10 * 1024 * 1024) {
          toast({ variant: "destructive", title: "Archivo muy pesado", description: "El archivo no puede exceder los 10 MB." });
          setIsSaving(false);
          return;
        }

        if (storage && currentPlatform) {
          const fileRef = ref(storage, 'marketing/' + currentPlatform.id + '/' + Date.now() + '_' + uploadFile.name);
          const snap = await uploadBytes(fileRef, uploadFile);
          finalUrl = await getDownloadURL(snap.ref);
        }
      }

      const payload = {
        platformId: currentPlatform.id,
        type: formData.type,
        channel: formData.channel || 'general',
        title: formData.title.trim(),
        content: formData.content || '',
        url: finalUrl,
        order: Number(formData.order || 0),
        active: formData.active !== false,
      };

      if (editingAsset) {
        await updateDoc(doc(firestore, 'marketingAssets', editingAsset.id), payload);
        toast({ title: "Recurso Actualizado", description: "Los cambios han sido guardados." });
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(firestore, 'marketingAssets'), payload);
        toast({ title: "Recurso Creado", description: "El material ya está disponible para los socios." });
      }

      setIsDialogOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el recurso." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (asset) => {
    if (!firestore || !isSuperAdmin) return;
    try {
      await updateDoc(doc(firestore, 'marketingAssets', asset.id), { active: !asset.active });
      toast({ title: "Estado Actualizado", description: asset.active ? "Recurso ocultado para socios." : "Recurso visible para socios." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar el estado." });
    }
  };

  const handleDeleteAsset = async (asset) => {
    if (!firestore || !isSuperAdmin) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente "' + asset.title + '"?')) return;
    try {
      await deleteDoc(doc(firestore, 'marketingAssets', asset.id));
      toast({ title: "Recurso Eliminado", description: "El material ha sido eliminado de la plataforma." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el recurso." });
    }
  };

  // Guardar Nuevo Tipo de Recurso (Mini-diálogo)
  const handleSaveNewType = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Ingresa el nombre del tipo de recurso." });
      return;
    }
    if (trimmed.length > 30) {
      toast({ variant: "destructive", title: "Nombre muy largo", description: "El nombre no puede exceder 30 caracteres." });
      return;
    }
    const norm = normalizeText(trimmed);
    const isDup = effectiveTypes.some(t => normalizeText(t.label) === norm || t.id === createIdFromText(trimmed));
    if (isDup) {
      toast({ variant: "destructive", title: "Tipo duplicado", description: "Ya existe un tipo de recurso con ese nombre." });
      return;
    }

    const newId = createIdFromText(trimmed);
    if (!newId) {
      toast({ variant: "destructive", title: "Nombre inválido", description: "Usa caracteres alfanuméricos válidos." });
      return;
    }

    const newItem = {
      id: newId,
      label: trimmed,
      behavior: newTypeBehavior === 'enlace' ? 'enlace' : 'texto'
    };

    setIsSavingType(true);
    try {
      const updated = [...customTypes, newItem];
      await setDoc(doc(firestore, 'marketingSettings', 'options'), {
        customTypes: updated
      }, { merge: true });

      toast({ title: "Tipo Agregado", description: '"' + trimmed + '" ya está disponible en las opciones y pestañas.' });
      setFormData(prev => ({ ...prev, type: newId }));
      setIsAddTypeOpen(false);
      setNewTypeName('');
      setNewTypeBehavior('texto');
    } catch (err) {
      if (err?.code === 'permission-denied') {
        toast({ variant: "destructive", title: "Error de permisos", description: "Sin permisos para guardar. Falta publicar la regla de marketingSettings." });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el nuevo tipo." });
      }
    } finally {
      setIsSavingType(false);
    }
  };

  // Guardar Nuevo Canal Sugerido (Mini-diálogo)
  const handleSaveNewChannel = async () => {
    const trimmed = newChannelName.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Ingresa el nombre del canal sugerido." });
      return;
    }
    if (trimmed.length > 30) {
      toast({ variant: "destructive", title: "Nombre muy largo", description: "El nombre no puede exceder 30 caracteres." });
      return;
    }
    const norm = normalizeText(trimmed);
    const isDup = effectiveChannels.some(c => normalizeText(c.label) === norm || c.id === createIdFromText(trimmed));
    if (isDup) {
      toast({ variant: "destructive", title: "Canal duplicado", description: "Ya existe un canal sugerido con ese nombre." });
      return;
    }

    const newId = createIdFromText(trimmed);
    if (!newId) {
      toast({ variant: "destructive", title: "Nombre inválido", description: "Usa caracteres alfanuméricos válidos." });
      return;
    }

    const newItem = {
      id: newId,
      label: trimmed
    };

    setIsSavingChannel(true);
    try {
      const updated = [...customChannels, newItem];
      await setDoc(doc(firestore, 'marketingSettings', 'options'), {
        customChannels: updated
      }, { merge: true });

      toast({ title: "Canal Agregado", description: '"' + trimmed + '" ya está disponible en las opciones.' });
      setFormData(prev => ({ ...prev, channel: newId }));
      setIsAddChannelOpen(false);
      setNewChannelName('');
    } catch (err) {
      if (err?.code === 'permission-denied') {
        toast({ variant: "destructive", title: "Error de permisos", description: "Sin permisos para guardar. Falta publicar la regla de marketingSettings." });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el nuevo canal." });
      }
    } finally {
      setIsSavingChannel(false);
    }
  };

  if (isUserLoading || isPlatformsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const currentTypeBehavior = getBehaviorForType(formData.type);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <Megaphone className="h-8 w-8" /> Marketing Profesional
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Herramientas para promocionar las plataformas SaaS.
            </p>
          </div>
          {isSuperAdmin && (
            <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-sm">
              <Plus className="h-4 w-4" /> Nuevo Recurso
            </Button>
          )}
        </div>

        {/* Selector de Plataforma SaaS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-primary/10 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Plataforma SaaS a Promocionar:</span>
            <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
              <SelectTrigger className="w-[200px] h-9 text-xs font-bold">
                <SelectValue placeholder="Selecciona plataforma..." />
              </SelectTrigger>
              <SelectContent>
                {activePlatforms.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentPlatform && (
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/20">
              Comisión: {currentPlatform.baseCommission || 30}% Recurrente
            </Badge>
          )}
        </div>

        {/* Pestañas (Fijas + Dinámicas por customType) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto p-1 bg-muted/40 gap-1">
            {effectiveTypes.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs font-bold px-3 py-1.5">
                {t.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="mi_enlace" className="text-xs font-bold px-3 py-1.5">
              Mi enlace
            </TabsTrigger>
          </TabsList>

          {/* Renderizado de categorías efectivas */}
          {effectiveTypes.map(typeItem => {
            const assetsInTab = filteredAssets.filter(a => a.type === typeItem.id);
            const isTextBehavior = typeItem.behavior === 'texto';

            return (
              <TabsContent key={typeItem.id} value={typeItem.id} className="space-y-4">
                {isAssetsLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : assetsInTab.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assetsInTab.map(asset => (
                      <Card key={asset.id} className="border-primary/10 shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-black uppercase text-slate-800 leading-tight">
                              {asset.title}
                            </CardTitle>
                            {asset.channel && (
                              <Badge variant="secondary" className="text-[9px] uppercase font-bold shrink-0">
                                {getChannelLabel(asset.channel)}
                              </Badge>
                            )}
                          </div>
                          {!asset.active && (
                            <Badge variant="destructive" className="w-fit text-[9px] uppercase font-bold mt-1">Oculto</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
                          {asset.content && (
                            <div className="p-3 bg-muted/20 rounded-lg border text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-sans">
                              {replaceVariables(asset.content)}
                            </div>
                          )}
                          
                          <div className="space-y-2 pt-2 border-t">
                            {isTextBehavior ? (
                              <Button 
                                onClick={() => handleCopyText(asset.id, asset.content)} 
                                size="sm" 
                                className="w-full font-bold gap-2 text-xs"
                              >
                                {copiedId === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedId === asset.id ? "¡Copiado con tu enlace!" : "Copiar Texto con mi Enlace"}
                              </Button>
                            ) : asset.url ? (
                              <a href={asset.url} target="_blank" rel="noreferrer" className="block w-full">
                                <Button size="sm" variant="outline" className="w-full font-bold gap-2 text-xs text-primary border-primary/20">
                                  <ExternalLink className="h-3.5 w-3.5" /> Abrir / Descargar
                                </Button>
                              </a>
                            ) : null}

                            {isSuperAdmin && (
                              <div className="flex items-center justify-between pt-2 border-t text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Switch checked={asset.active !== false} onCheckedChange={() => handleToggleActive(asset)} />
                                  <span className="text-[10px] text-muted-foreground">{asset.active ? 'Visible' : 'Oculto'}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEdit(asset)}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteAsset(asset)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-xl bg-muted/10 p-6 space-y-2">
                    <p className="text-sm text-muted-foreground italic">Aún no hay material publicado para esta plataforma.</p>
                    {isSuperAdmin && (
                      <Button onClick={handleOpenCreate} size="sm" variant="outline" className="mt-2 font-bold text-xs gap-1">
                        <Plus className="h-3.5 w-3.5" /> Publicar Primer Recurso
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            );
          })}

          {/* Pestaña: Mi Enlace */}
          <TabsContent value="mi_enlace" className="space-y-4">
            <Card className="border-primary/20 shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Enlace de Afiliado para {currentPlatform?.name || 'SaaS'}
                </CardTitle>
                <CardDescription>
                  Comparte este enlace directo con tus prospectos para registrar clientes bajo tu código.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAffiliated ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3 text-amber-800 text-xs font-semibold">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>Actualmente no estás afiliado a esta plataforma. Puedes afiliarte desde la sección <strong>Partners</strong> para activar tus comisiones.</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2 items-center bg-muted/20 p-3 rounded-xl border border-primary/20">
                      <span className="font-mono text-xs text-primary font-bold flex-1 px-2 break-all">
                        {affiliateUrl || 'Generando enlace...'}
                      </span>
                      <Button onClick={() => handleCopyText('direct_link', affiliateUrl)} className="w-full sm:w-auto font-bold gap-2 text-xs">
                        {copiedId === 'direct_link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedId === 'direct_link' ? "¡Copiado!" : "Copiar Enlace"}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>Código de socio: <strong className="font-mono text-slate-800">{partnerCode}</strong></span>
                      <span>Nombre: <strong className="text-slate-800">{partnerName}</strong></span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Principal: Crear / Editar Recurso */}
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black uppercase text-primary">
                  {editingAsset ? 'Editar Recurso de Marketing' : 'Nuevo Recurso de Marketing'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Publica material oficial para {currentPlatform?.name}. Los socios podrán copiarlo con su enlace incrustado.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  {/* Selector de Tipo con botón "+" */}
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Tipo de Recurso</label>
                    <div className="flex items-center gap-1.5">
                      <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {effectiveTypes.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isSuperAdmin && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 shrink-0 text-primary border-primary/20 hover:bg-primary/5"
                          onClick={() => setIsAddTypeOpen(true)}
                          title="Agregar nuevo tipo de recurso"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Selector de Canal con botón "+" */}
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Canal Sugerido</label>
                    <div className="flex items-center gap-1.5">
                      <Select value={formData.channel} onValueChange={(val) => setFormData({ ...formData, channel: val })}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {effectiveChannels.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isSuperAdmin && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 shrink-0 text-primary border-primary/20 hover:bg-primary/5"
                          onClick={() => setIsAddChannelOpen(true)}
                          title="Agregar nuevo canal sugerido"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Título del Recurso</label>
                  <Input 
                    placeholder="Ej. Mensaje de prospección para WhatsApp"
                    className="h-8 text-xs"
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  />
                </div>

                {/* Contenido condicional según behavior */}
                {currentTypeBehavior === 'texto' ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold uppercase text-[10px] text-muted-foreground">Contenido del Texto</label>
                      <span className="text-[10px] text-primary font-mono font-bold">Variables: {'{{enlace}}'}, {'{{codigo}}'}, {'{{nombre_socio}}'}</span>
                    </div>
                    <Textarea 
                      placeholder="Hola, te presento la plataforma. Puedes registrarte aquí: {{enlace}}..."
                      className="text-xs h-32 leading-relaxed"
                      value={formData.content} 
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Subir Archivo a Storage (Máx 10 MB)</label>
                      <Input 
                        type="file" 
                        className="text-xs h-9 cursor-pointer"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                      />
                    </div>
                    <div>
                      <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">O Enlace Externo (URL de Video / Web)</label>
                      <Input 
                        placeholder="https://youtube.com/watch?v=..."
                        className="h-8 text-xs font-mono"
                        value={formData.url} 
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })} 
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Orden de Presentación</label>
                    <Input 
                      type="number" 
                      className="h-8 text-xs font-mono"
                      value={formData.order} 
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                    <span className="font-bold uppercase text-[10px] text-muted-foreground">Visible para Socios</span>
                    <Switch 
                      checked={formData.active !== false} 
                      onCheckedChange={(val) => setFormData({ ...formData, active: val })} 
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveAsset} size="sm" disabled={isSaving} className="font-bold">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  {editingAsset ? 'Guardar Cambios' : 'Publicar Recurso'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Mini-diálogo: Agregar Tipo de Recurso */}
        {isAddTypeOpen && (
          <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
            <DialogContent className="max-w-sm p-5 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black uppercase text-primary">
                  Agregar Tipo de Recurso
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Crea una nueva categoría para organizar el material.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Nombre del Tipo (máx. 30 caracteres)</label>
                  <Input 
                    placeholder="Ej. Presentación de ventas"
                    maxLength={30}
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Comportamiento en Tarjeta</label>
                  <Select value={newTypeBehavior} onValueChange={setNewTypeBehavior}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto copiable (reemplaza variables)</SelectItem>
                      <SelectItem value="enlace">Enlace o archivo descargable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddTypeOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveNewType} disabled={isSavingType} className="font-bold">
                  {isSavingType ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Agregar Tipo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Mini-diálogo: Agregar Canal Sugerido */}
        {isAddChannelOpen && (
          <Dialog open={isAddChannelOpen} onOpenChange={setIsAddChannelOpen}>
            <DialogContent className="max-w-sm p-5 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black uppercase text-primary">
                  Agregar Canal Sugerido
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Crea una nueva etiqueta de canal de difusión.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground block mb-1">Nombre del Canal (máx. 30 caracteres)</label>
                  <Input 
                    placeholder="Ej. TikTok"
                    maxLength={30}
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddChannelOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveNewChannel} disabled={isSavingChannel} className="font-bold">
                  {isSavingChannel ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Agregar Canal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
