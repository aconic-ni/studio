import { Navbar } from '@/components/layout/navbar';
import { ProductListClient } from '@/components/products/product-list-client';
import { getProducts } from '@/lib/actions';

export default async function DashboardPage() {
  const initialProducts = await getProducts(); // Fetch initial products on the server

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <ProductListClient initialProducts={initialProducts} />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ACONIC Facturación Local. All rights reserved.
      </footer>
    </div>
  );
}

// Ensure this page is dynamically rendered if products change frequently
// or use revalidation strategies. For this example, it's server-rendered once at build/request time.
export const dynamic = 'force-dynamic'; // Or 'auto', or implement revalidation
