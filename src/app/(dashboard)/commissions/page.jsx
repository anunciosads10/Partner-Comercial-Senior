'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { commissions as allCommissions } from "@/lib/data";

const CommissionsTable = ({ commissions }) => {
  if (!commissions || commissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
        <p className="text-muted-foreground">No commission data available.</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sale ID</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Sale Amount</TableHead>
          <TableHead>Commission Rate</TableHead>
          <TableHead>Earning</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((commission) => (
          <TableRow key={commission.id}>
            <TableCell className="font-medium">{commission.id}</TableCell>
            <TableCell>{commission.product}</TableCell>
            <TableCell>${commission.saleAmount.toLocaleString()}</TableCell>
            <TableCell>{commission.commissionRate}%</TableCell>
            <TableCell className="font-semibold text-green-600">${commission.earning.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={commission.status === 'Paid' ? 'default' : 'secondary'}>{commission.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export default function CommissionsPage({ userData }) {
  const { role, uid } = userData || {};

  // Filter commissions based on user role
  const commissions = role === 'superadmin' 
    ? allCommissions 
    : allCommissions.filter(c => c.partnerId === uid);

  const totalEarnings = commissions.reduce((acc, curr) => acc + curr.earning, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Commissions</CardTitle>
          <CardDescription>
            {role === 'superadmin' 
              ? "A complete overview of all partner commissions." 
              : "Here's a detailed breakdown of your earnings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommissionsTable commissions={commissions} />
        </CardContent>
      </Card>
      <Card className="w-full md:w-1/3 self-end">
          <CardHeader className="pb-2">
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className="text-4xl">${totalEarnings.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-xs text-muted-foreground">
                  This is the sum of all your paid and pending commissions.
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
