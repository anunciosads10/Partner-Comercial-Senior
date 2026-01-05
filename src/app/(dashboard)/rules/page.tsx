import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function RulesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules & Governance</CardTitle>
        <CardDescription>
          Define program policies, anti-fraud rules, and terms of service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Rules and governance settings coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
