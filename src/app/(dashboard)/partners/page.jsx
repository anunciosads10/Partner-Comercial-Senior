'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, User, FileText, Calendar, Globe, Award, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, writeBatch, doc, updateDoc } from "firebase/firestore";
import { partners as mockPartners } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

function getTierBadgeVariant(tier) {
  switch (tier) {
    case 'Platinum':
      return 'default';
    case 'Gold':
      return 'secondary';
    case 'Silver':
      return 'outline';
    case 'Bronze':
    default:
      return 'destructive';
  }
}

function getStatusBadgeVariant(status) {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Suspended':
      return 'destructive';
    case 'Inactive':
    default:
      return 'secondary';
  }
}

const SuperAdminPartnersView = ({ partners, isLoading, onSeedData, firestore }) => {
  const { toast } = useToast();

  const handleToggleSuspend = async (partner) => {
    if (!firestore || !partner) return;
    const partnerRef = doc(firestore, "partners", partner.id);
    const newStatus = partner.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateDoc(partnerRef, { status: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `El partner ${partner.name} ha sido ${newStatus === 'Active' ? 'reactivado' : 'suspendido'}.`,
      });
    } catch (error) {
      console.error("Error al actualizar el estado del partner:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudo cambiar el estado del partner.",
      });
    }
  };

  const handleCycleTier = async (partner) => {
    if (!firestore || !partner) return;
    const partnerRef = doc(firestore, "partners", partner.id);
    const tiers = ['Silver', 'Gold', 'Platinum'];
    const currentTierIndex = tiers.indexOf(partner.tier);
    const nextTier = tiers[(currentTierIndex + 1) % tiers.length];
    try {
      await updateDoc(partnerRef, { tier: nextTier });
      toast({
        title: "Nivel del Partner Actualizado",
        description: `${partner.name} ahora es nivel ${nextTier}.`,
      });
    } catch (error) {
      console.error("Error al actualizar el nivel del partner:", error);
      toast({
        variant: "destructive",
        title: "Error al editar",
        description: "No se pudo cambiar el nivel del partner.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Partners</CardTitle>
            <CardDescription>Crea, edita, activa y suspende partners.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onSeedData} variant="outline" disabled={!firestore}>Cargar Datos de Prueba</Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Partner
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p>Cargando partners...</p> : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Territorio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners?.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={partner.avatarUrl} alt={partner.name} />
                          <AvatarFallback>{partner.name?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {partner.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierBadgeVariant(partner.tier)}>
                        {partner.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.territory}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(partner.status)}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleCycleTier(partner)}>Editar (Cambiar Nivel)</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleToggleSuspend(partner)}>
                            {partner.status === 'Active' ? 'Suspender' : 'Reactivar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {partners?.length === 0 && (
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-secondary mt-4">
                <p className="text-muted-foreground">No hay partners en la base de datos.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AdminPartnerView = ({ partnerData, isLoading }) => {
  if (isLoading) {
    return <p>Cargando tu perfil...</p>;
  }

  if (!partnerData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil de Partner no Encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hemos podido encontrar tus datos de partner. Por favor, contacta con un administrador.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Perfil de Partner</CardTitle>
        <CardDescription>Aquí puedes ver los detalles de tu cuenta de partner.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={partnerData.avatarUrl} alt={partnerData.name} />
            <AvatarFallback>{partnerData.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{partnerData.name}</h2>
            <p className="text-muted-foreground">{partnerData.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Award className="text-muted-foreground" />
            <span>Nivel: <Badge variant={getTierBadgeVariant(partnerData.tier)}>{partnerData.tier}</Badge></span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="text-muted-foreground" />
            <span>Estado: <Badge variant={getStatusBadgeVariant(partnerData.status)}>{partnerData.status}</Badge></span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground" />
            <span>Territorio: {partnerData.territory}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground" />
            <span>Miembro desde: {new Date(partnerData.joinDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default function PartnersPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // 1. Obtener el rol del usuario
  const userRoleDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isRoleLoading } = useDoc(userRoleDocRef);
  const { role } = userData || {};

  // 2. Obtener datos según el rol
  // Para SuperAdmin: obtener todos los partners
  const partnersCollection = useMemoFirebase(() => {
    if (!firestore || role !== 'superadmin') return null;
    return collection(firestore, 'partners');
  }, [firestore, role]);
  const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersCollection);

  // Para Admin: obtener solo sus propios datos de partner
  const partnerDocRef = useMemoFirebase(() => {
    if (!firestore || role !== 'admin' || !user) return null;
    return doc(firestore, 'partners', user.uid);
  }, [firestore, role, user]);
  const { data: partnerData, isLoading: isPartnerDataLoading } = useDoc(partnerDocRef);


  const seedData = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    mockPartners.forEach((partner) => {
      const docRef = doc(firestore, "partners", partner.id);
      batch.set(docRef, partner);
    });
    await batch.commit();
    console.log("Datos de prueba sembrados exitosamente!");
  };

  const isLoading = isRoleLoading || (role === 'superadmin' && arePartnersLoading) || (role === 'admin' && isPartnerDataLoading);

  if (isRoleLoading) {
    return <p>Cargando...</p>;
  }

  if (role === 'superadmin') {
    return <SuperAdminPartnersView partners={partners} isLoading={isLoading} onSeedData={seedData} firestore={firestore} />;
  }
  
  if (role === 'admin') {
    return <AdminPartnerView partnerData={partnerData} isLoading={isLoading} />;
  }

  return null; // O un mensaje de 'Acceso no autorizado'
}
