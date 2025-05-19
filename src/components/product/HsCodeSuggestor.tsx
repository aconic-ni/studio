"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestHsCode as suggestHsCodeFlow, type SuggestHsCodeInput, type SuggestHsCodeOutput } from '@/ai/flows/hs-code-suggestion'; // Adjust path as needed

interface HsCodeSuggestorProps {
  productDescription: string;
  onSuggestion: (hsCode: string, explanation: string) => void;
}

export function HsCodeSuggestor({ productDescription, onSuggestion }: HsCodeSuggestorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestHsCodeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestHsCode = async () => {
    if (!productDescription || productDescription.trim() === "") {
      setError("Por favor, ingrese una descripción del producto.");
      setSuggestion(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const input: SuggestHsCodeInput = { productDescription };
      const result = await suggestHsCodeFlow(input);
      setSuggestion(result);
      if(result.hsCode) {
        // Split the result to separate code and explanation if they are combined
        const parts = result.hsCode.split(/:(.*)/s);
        const code = parts[0].trim();
        const explanation = parts[1] ? parts[1].trim() : "Explicación no proporcionada.";
        onSuggestion(code, explanation);
      }
    } catch (e) {
      console.error("Error suggesting HS Code:", e);
      setError("No se pudo sugerir el código HS. Intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        type="button" 
        onClick={handleSuggestHsCode} 
        disabled={isLoading || !productDescription}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Sugerir Código HS
      </Button>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {suggestion && suggestion.hsCode && (
        <Alert variant="default">
           <Wand2 className="h-4 w-4" />
          <AlertTitle>Sugerencia de Código HS</AlertTitle>
          <AlertDescription>
            <p className="font-semibold">Código: {suggestion.hsCode.split(/:(.*)/s)[0].trim()}</p>
            <p>Explicación: {suggestion.hsCode.split(/:(.*)/s)[1]?.trim() || "Explicación no proporcionada."}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
