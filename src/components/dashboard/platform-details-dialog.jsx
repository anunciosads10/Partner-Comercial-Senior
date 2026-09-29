'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export function PlatformDetailsDialog({ platform, open, onOpenChange }) {
  if (!open || !platform) return null;

  const cleanDomain = platform.domain 
    ? platform.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '') 
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-xl font-black uppercase text-primary tracking-tight">
              {platform.name}
            </DialogTitle>
            <Badge 
              variant={platform.status === 'Active' || !platform.status ? 'default' : 'secondary'} 
              className="text-[10px] uppercase font-bold"
            >
              {platform.status || 'Active'}
            </Badge>
          </div>
          <DialogDescription className="text-xs font-semibold text-muted-foreground">
            Categoría: {platform.category || 'Ecosistema SaaS'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* Dominio Oficial */}
          <div className="p-3 bg-muted/20 rounded-xl border border-primary/10 flex items-center justify-between">
            <span className="font-bold text-muted-foreground uppercase text-[10px]">Dominio Oficial:</span>
            {cleanDomain ? (
              <a 
                href={`https://${cleanDomain}`} 
                target="_blank" 
                rel="noreferrer" 
                className="font-mono text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                {cleanDomain} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="italic text-muted-foreground">Sin dominio configurado</span>
            )}
          </div>

          {/* Esquema de Comisiones */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/20 rounded-xl border border-primary/10 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Comisión Base</span>
              <span className="text-lg font-black text-primary block mt-0.5">{platform.baseCommission || 0}%</span>
            </div>
            <div className="p-3 bg-muted/20 rounded-xl border border-primary/10 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Comisión Recurrente</span>
              <span className="text-lg font-black text-emerald-600 block mt-0.5">{platform.recurringCommission || 0}%</span>
            </div>
          </div>

          {/* Descripción Comercial */}
          <div className="space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase text-[10px] block">Condiciones y Descripción Comercial:</span>
            <div className="p-3 bg-muted/30 rounded-xl border max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-700">
              {platform.description ? platform.description : 'Esta plataforma aún no tiene condiciones publicadas.'}
            </div>
          </div>

          {/* Planes de Suscripción */}
          {platform.planes && platform.planes.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="font-bold text-muted-foreground uppercase text-[10px] block">Planes de Suscripción Oficiales:</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {platform.planes.map((plan, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border bg-white flex items-center justify-between shadow-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{plan.nombre}</span>
                      <span className="text-[10px] text-muted-foreground">{plan.recurrente !== false ? 'Cobro Recurrente' : 'Pago Único'}</span>
                    </div>
                    <span className="font-mono font-black text-primary">
                      ${Number(plan.precio || 0).toLocaleString()} {plan.moneda || 'COP'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="font-bold">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
