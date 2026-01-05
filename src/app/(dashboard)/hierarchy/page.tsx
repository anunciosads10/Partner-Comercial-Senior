import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function HierarchyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Partner Hierarchy</CardTitle>
        <CardDescription>
          Visualize partner hierarchies and commission distribution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Partner tree visualization coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
