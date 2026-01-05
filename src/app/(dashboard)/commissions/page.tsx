import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CommissionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Schemes</CardTitle>
        <CardDescription>
          Define and configure commission models.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Commission scheme configuration coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
