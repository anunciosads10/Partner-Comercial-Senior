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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { partners as mockPartners } from "@/lib/data";

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

export default function PartnersPage() {
  const firestore = useFirestore();

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'partners');
  }, [firestore]);

  const { data: partners, isLoading } = useCollection(partnersCollection);

  const seedData = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    mockPartners.forEach((partner) => {
      const docRef = doc(firestore, "partners", partner.id);
      batch.set(docRef, partner);
    });
    await batch.commit();
    console.log("Mock data seeded successfully!");
    // You might want to refresh the data here or rely on the real-time listener
  };


  if (isLoading) {
    return <p>Loading partners...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Partner Management</CardTitle>
            <CardDescription>
              Create, edit, activate, and suspend partners.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={seedData} variant="outline" disabled={!firestore}>Seed Mock Data</Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Partner
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Territory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
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
                      <AvatarFallback>{partner.name?.slice(0,2)}</AvatarFallback>
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
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Suspend</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
