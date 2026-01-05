'use client';
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { identifyAtRiskPartners } from "@/ai/flows/identify-at-risk-partners";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UserX, ShieldAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function AtRiskPartners({ partners }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const historicalData = JSON.stringify(partners, null, 2);
      const output = await identifyAtRiskPartners({ historicalData });
      setResult(output);
    } catch (e) {
      setError(e.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-destructive" />
          Identificar Partners en Riesgo
        </CardTitle>
        <CardDescription>
          Usa GenAI para analizar datos históricos e identificar partners en riesgo de abandono.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Analizando datos de partners...</p>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Análisis Fallido</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <div>
            {result.atRiskPartners.length > 0 ? (
              <>
                <h3 className="font-semibold mb-2">{result.atRiskPartners.length} Partner(s) Identificados en Riesgo:</h3>
                <ScrollArea className="h-72 w-full rounded-md border">
                  <div className="p-4">
                    {result.atRiskPartners.map((partnerId, index) => {
                      const partner = partners.find(p => p.id === partnerId);
                      return (
                        <div key={partnerId}>
                          <div className="mb-4">
                            <p className="font-bold">{partner ? partner.name : partnerId}</p>
                            <p className="text-sm text-muted-foreground">{result.reasons[index]}</p>
                          </div>
                          {index < result.atRiskPartners.length - 1 && <Separator className="my-4" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary rounded-lg">
                 <UserX className="w-12 h-12 text-green-500 mb-4"/>
                <h3 className="text-lg font-semibold">No se encontraron Partners en Riesgo</h3>
                <p className="text-muted-foreground">
                  El análisis no identificó partners en riesgo de abandono basado en los datos proporcionados.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalysis} disabled={loading || !partners}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            "Ejecutar Análisis con IA"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
