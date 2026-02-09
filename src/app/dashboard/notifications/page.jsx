'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '../../../firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Bell, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'partners', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, user?.uid]);

  const { data: notifications, isLoading } = useCollection(notificationsRef);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <Bell className="h-8 w-8" /> Notificaciones
            </h1>
            <p className="text-muted-foreground text-sm"> Centro de alertas y comunicaciones del sistema. </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs gap-2">
              <CheckCheck className="h-4 w-4" /> Marcar todas
            </Button>
          </div>
        </div>

        <Card className="border-primary/10 shadow-lg">
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {notifications && notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">
                            {notif.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{notif.message}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                  <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="font-bold text-lg">Bandeja Vacía</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    No tienes notificaciones pendientes en este momento. Te avisaremos cuando ocurra algo importante.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}