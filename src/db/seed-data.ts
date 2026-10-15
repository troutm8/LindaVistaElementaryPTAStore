/**
 * Placeholder catalog for the mockup. Replace with the real product list,
 * prices, and photos once the PTA provides them.
 */
export type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  /** Fill color for the generated placeholder image. */
  swatch: string;
};

const YOUTH = ["YS", "YM", "YL", "YXL"];
const ADULT = ["S", "M", "L", "XL", "2XL"];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "spirit-tee-youth",
    name: "Spirit T-Shirt (Youth)",
    description: "Soft cotton tee with the Linda Vista logo on the front. Great for spirit days.",
    category: "Shirts",
    priceCents: 1500,
    sizes: YOUTH,
    colors: ["Royal Blue", "White"],
    swatch: "#2a6fb5",
  },
  {
    slug: "spirit-tee-adult",
    name: "Spirit T-Shirt (Adult)",
    description: "Same tee, parent sized. Show up to pickup line in style.",
    category: "Shirts",
    priceCents: 1800,
    sizes: ADULT,
    colors: ["Royal Blue", "White"],
    swatch: "#1c4f8a",
  },
  {
    slug: "hoodie-youth",
    name: "Pullover Hoodie (Youth)",
    description: "Fleece-lined pullover hoodie with embroidered logo. Warm enough for morning drop-off.",
    category: "Sweatshirts",
    priceCents: 3000,
    sizes: YOUTH,
    colors: ["Royal Blue"],
    swatch: "#3b82c4",
  },
  {
    slug: "hoodie-adult",
    name: "Pullover Hoodie (Adult)",
    description: "Fleece-lined pullover hoodie, adult sizes.",
    category: "Sweatshirts",
    priceCents: 3500,
    sizes: ADULT,
    colors: ["Royal Blue", "Heather Gray"],
    swatch: "#1e3a5f",
  },
  {
    slug: "pencil-pack",
    name: "Linda Vista Pencils (6-pack)",
    description: "Six #2 pencils stamped with the school name. The store's best seller.",
    category: "School Supplies",
    priceCents: 300,
    stock: 100,
    swatch: "#5b8fcf",
  },
  {
    slug: "eraser-set",
    name: "Fun Eraser Set",
    description: "Assorted animal-shaped erasers. Five per set.",
    category: "School Supplies",
    priceCents: 200,
    stock: 60,
    swatch: "#7fa9dc",
  },
  {
    slug: "water-bottle",
    name: "Logo Water Bottle",
    description: "20 oz reusable bottle with flip straw and the school logo.",
    category: "Accessories",
    priceCents: 1200,
    colors: ["Royal Blue", "White"],
    swatch: "#2a6fb5",
  },
  {
    slug: "spirit-sticker",
    name: "Spirit Sticker",
    description: "Die-cut vinyl sticker for water bottles and laptops.",
    category: "Accessories",
    priceCents: 150,
    stock: 200,
    swatch: "#4a7fb8",
  },
  {
    slug: "beanie",
    name: "Knit Beanie",
    description: "One size fits most. Embroidered logo.",
    category: "Accessories",
    priceCents: 1500,
    colors: ["Royal Blue", "White"],
    swatch: "#1c4f8a",
  },
  {
    slug: "tote-bag",
    name: "Canvas Tote Bag",
    description: "Heavy canvas tote with the school name. Fits a library haul.",
    category: "Accessories",
    priceCents: 1000,
    swatch: "#6b7f99",
  },
];
