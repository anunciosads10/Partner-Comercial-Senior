import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Notifications</CardTitle>
        <CardDescription>
          Set up alerts and notifications for partners.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Notification settings coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
