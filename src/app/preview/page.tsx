import { Navbar } from '@/components/layout/navbar';
import { DataExportButtons } from '@/components/products/data-export-buttons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getProducts } from '@/lib/actions';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle } from 'lucide-react';

async function PreviewPageContent() {
  const products = await getProducts();

  // Placeholder for approval logic
  const handleApprove = async () => {
    "use server"; // This would be a server action
    console.log("Data approved by user.");
    // Potentially: mark items as approved in DB, trigger next step in a workflow, etc.
    // For now, it's a console log.
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Information Preview & Approval</CardTitle>
          <CardDescription>
            Review all captured product information below. Once confirmed, you can approve the data or export it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No products available for preview. Add some products on the dashboard.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]"> {/* Adjust height as needed */}
              <div className="space-y-6">
                {products.map((product: Product) => (
                  <Card key={product.id} className="bg-background/50">
                    <CardHeader>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription>Item Number: {product.itemNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div><strong>Brand:</strong> {product.brand || "N/A"}</div>
                      <div><strong>Quantity:</strong> {product.quantity}</div>
                      <div><strong>Reference:</strong> {product.reference || "N/A"}</div>
                      <div><strong>Location:</strong> {product.location || "N/A"}</div>
                      <div className="md:col-span-1 lg:col-span-1">
                        <strong>Packaging:</strong> {product.packagingCondition ? <Badge variant="secondary">{product.packagingCondition}</Badge> : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        {products.length > 0 && (
           <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
            <form action={handleApprove} className="w-full sm:w-auto">
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve All Information
              </Button>
            </form>
            <DataExportButtons />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


export default function PreviewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <PreviewPageContent />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ACONIC Facturación Local. All rights reserved.
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic';
