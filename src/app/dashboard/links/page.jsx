'use client';
import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link2, Copy, Check, MousePointerClick, UserCheck, Share2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function LinksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const pDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'partners', user.uid)), [firestore, user?.uid]);
  const { data: pData } = useDoc(pDocRef);

  const code = pData?.referralCode || user?.uid?.substring(0, 8).toUpperCase() || 'PARTNER';
  const link = pData?.referralLink || `https://menfy.app/aff/${code}`;

  React.useEffect(() => {
    if (!firestore || !user?.uid || !pData || pData.referralLink) return;
    setDoc(pDocRef, { referralCode: code, referralLink: link, clicks: pData.clicks || 0, signupsFromLink: pData.signupsFromLink || 0 }, { merge: true });
  }, [firestore, user?.uid, pData, pDocRef, code, link]);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Enlace Copiado", description: "URL de referido en portapapeles." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3"><Link2 className="h-8 w-8" /> Mis Enlaces</h1>
          <p className="text-muted-foreground text-sm font-medium">Comparte tu enlace oficial para comisionar restaurantes.</p>
        </div>
        <Card className="border-primary/20 shadow-md bg-gradient-to-r from-primary/5 via-white to-primary/5">
          <CardHeader><CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Tu Enlace Oficial</CardTitle><CardDescription>Registros desde esta URL quedarán vinculados a tu cuenta.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 items-center bg-white p-3 rounded-xl border border-primary/20">
              <span className="font-mono text-sm text-primary font-bold flex-1 px-2 break-all">{link}</span>
              <Button onClick={handleCopy} className="w-full sm:w-auto font-bold gap-2">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "¡Copiado!" : "Copiar Enlace"}</Button>
            </div>
            <div className="text-xs text-muted-foreground">Código de socio: <span className="font-mono font-bold text-slate-800">{code}</span></div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Total Clics</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary">{pData?.clicks || 0}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Registros</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-emerald-600">{pData?.signupsFromLink || 0}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Conversión</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-purple-600">{pData?.clicks ? ((pData.signupsFromLink || 0) / pData.clicks * 100).toFixed(1) : 0}%</div></CardContent></Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
