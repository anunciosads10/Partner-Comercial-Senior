'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Datos de ejemplo para las reglas de notificación
const mockNotificationRules = [
  {
    id: "rule-1",
    name: "Alerta de Bajo Rendimiento",
    description: "Notificar a un partner si sus ventas semanales caen por debajo de $500.",
    type: "Rendimiento",
    status: "active",
  },
  {
    id: "rule-2",
    name: "Felicitación por Hito de Ventas",
    description: "Enviar un mensaje de felicitación cuando un partner alcanza los $10,000 en ventas totales.",
    type: "Hito",
    status: "active",
  },
  {
    id: "rule-3",
    name: "Recordatorio de Inactividad",
    description: "Enviar un recordatorio si un partner no ha registrado actividad en los últimos 30 días.",
    type: "Inactividad",
    status: "inactive",
  },
  {
    id: "rule-4",
    name: "Mensaje de Bienvenida",
    description: "Enviar un correo de bienvenida a los nuevos partners que se unen al programa.",
    type: "Bienvenida",
    status: "active",
  },
];

const getStatusBadgeVariant = (status) => {
  return status === 'active' ? 'default' : 'secondary';
};

export default function NotificationsPage() {
  const [rules, setRules] = React.useState(mockNotificationRules);

  const handleStatusChange = (ruleId) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
          : rule
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notificaciones Automáticas</CardTitle>
            <CardDescription>
              Configura alertas y notificaciones automáticas para mantener a los partners informados y comprometidos.
            </CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nueva Regla
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regla de Notificación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Activada</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-sm text-muted-foreground">{rule.description}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{rule.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(rule.status)}>
                    {rule.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.status === 'active'}
                    onCheckedChange={() => handleStatusChange(rule.id)}
                    aria-label={`Activar o desactivar la regla ${rule.name}`}
                  />
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
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {rules.length === 0 && (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-secondary mt-4">
                <p className="text-muted-foreground">No hay reglas de notificación configuradas.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
