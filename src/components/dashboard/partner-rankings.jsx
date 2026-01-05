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
import { partners } from "@/lib/data";
import { Badge } from "../ui/badge";

export function PartnerRankings() {
  const rankedPartners = [...partners]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const getTierVariant = (tier) => {
    switch (tier) {
      case 'Platinum':
        return 'default';
      case 'Gold':
        return 'secondary';
      case 'Silver':
        return 'outline';
      default:
        return 'destructive';
    }
  };


  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Performing Partners</CardTitle>
        <CardDescription>
          Ranking of partners based on revenue generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedPartners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={partner.avatarUrl} alt={partner.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{partner.name.slice(0,2)}</AvatarFallback>
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
                  <Badge variant={getTierVariant(partner.tier)}>{partner.tier}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${partner.revenue.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
