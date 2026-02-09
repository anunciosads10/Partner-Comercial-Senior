"use client";

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SalesChart({ data = [] }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="col-span-1 lg:col-span-2 h-[450px]">
        <CardHeader>
          <CardTitle>Rendimiento de Ventas</CardTitle>
          <CardDescription>Cargando gráfica de comisiones...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="h-32 w-32 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Rendimiento de Ventas</CardTitle>
        <CardDescription>Monto total de comisiones y pagos registrados por mes.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          {data.length > 0 ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${Number(value) / 1000}K`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend wrapperStyle={{fontSize: "14px", paddingTop: '10px'}}/>
              <Bar dataKey="total" fill="hsl(var(--primary))" name="Monto Total" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No hay datos para mostrar en la gráfica.
            </div>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
