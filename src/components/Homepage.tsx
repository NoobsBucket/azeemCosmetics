"use client";
export const dynamic = "force-dynamic";

import Navbar from "@/components/navbar";
import HomepageBuilder from "@/components/HomepageBuilder";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>
        <HomepageBuilder />
      </main>
    </>
  );
}

/*
  TO ADD YOUR EXISTING PRODUCT GRID TO THE SHUFFLE:

  1. Open components/HomepageBuilder.tsx
  2. Add your component:
       const ProductGrid = dynamic(() => import("./YourProductGrid"));

  3. Add to COMPONENTS object:
       product_grid: ProductGrid,

  4. Add to DEFAULT array:
       { key: "product_grid", enabled: true },

  5. Add to SECTION_DEFS in admin-page.tsx:
       { key:"product_grid", label:"Product Grid", emoji:"🛍", color:"#C03EFF", desc:"Your product cards" }

  That's it — it will now appear in the admin Homepage tab and shuffle with the rest.
*/