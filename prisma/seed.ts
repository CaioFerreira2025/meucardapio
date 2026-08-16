// Seed de desenvolvimento — popular dados de exemplo no banco local.
// Rode com: npm run db:seed
//
// O restaurante "Lanchonete do João" é o cardápio de demonstração público
// (link "Ver Cardápio de Demonstração" da landing page, /r/lanchonete-do-joao).
// Por isso o menu aqui é propositalmente mais completo e usa as mesmas fotos
// reais de comida da landing (src/config/demo-images.ts) — quem clica no
// botão de demonstração precisa ver um cardápio tão convincente quanto os
// mockups que acabou de ver na página.

import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import { DEMO_IMAGES } from "../src/config/demo-images.ts";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
};

type SeedCategory = {
  name: string;
  products: SeedProduct[];
};

const MENU: SeedCategory[] = [
  {
    name: "Carnes",
    products: [
      {
        name: "Picanha na Brasa",
        description:
          "Picanha premium grelhada no ponto, acompanhada de farofa artesanal e vinagrete.",
        priceCents: 5990,
        imageUrl: DEMO_IMAGES.picanha.url,
      },
    ],
  },
  {
    name: "Hambúrgueres",
    products: [
      {
        name: "Classic Burger",
        description: "Pão brioche, blend 180g, queijo, alface e tomate.",
        priceCents: 2990,
        imageUrl: DEMO_IMAGES.hamburguerClassico.url,
      },
      {
        name: "Bacon Burger",
        description: "Blend 180g, bacon crocante, queijo e molho especial.",
        priceCents: 3390,
        imageUrl: DEMO_IMAGES.hamburguerBacon.url,
      },
      {
        name: "Smash Burger",
        description: "Duplo smash, queijo cheddar e picles, no ponto certo.",
        priceCents: 3190,
        imageUrl: DEMO_IMAGES.hamburguerSmash.url,
      },
    ],
  },
  {
    name: "Acompanhamentos",
    products: [
      {
        name: "Batata Frita",
        description: "Porção generosa, crocante por fora e macia por dentro.",
        priceCents: 1890,
        imageUrl: DEMO_IMAGES.batataFrita.url,
      },
    ],
  },
  {
    name: "Bebidas",
    products: [
      {
        name: "Coca-Cola lata",
        description: "Gelada, 350ml.",
        priceCents: 600,
        imageUrl: DEMO_IMAGES.refrigerante.url,
      },
      {
        name: "Suco Natural",
        description: "Feito na hora, escolha a fruta.",
        priceCents: 900,
        imageUrl: DEMO_IMAGES.sucoNatural.url,
      },
    ],
  },
  {
    name: "Sobremesas",
    products: [
      {
        name: "Brownie com Sorvete",
        description: "Brownie de chocolate quente com bola de sorvete.",
        priceCents: 2190,
        imageUrl: DEMO_IMAGES.brownie.url,
      },
      {
        name: "Cheesecake",
        description: "Fatia de cheesecake com calda de frutas vermelhas.",
        priceCents: 1990,
        imageUrl: DEMO_IMAGES.cheesecake.url,
      },
    ],
  },
];

async function main() {
  const email = "demo@example.com";
  const password = await bcrypt.hash("demo12345", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Usuário Demo",
      email,
      password,
    },
  });

  console.log(`Usuário de teste pronto: ${user.email} / senha: demo12345`);

  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: user.id },
    update: {},
    create: {
      ownerId: user.id,
      name: "Lanchonete do João",
      slug: "lanchonete-do-joao",
      phone: "(11) 99999-9999",
      description: "Carnes na brasa, hambúrgueres artesanais e muito mais.",
    },
  });

  console.log(`Restaurante de teste: /r/${restaurant.slug}`);

  let firstProduct: { id: string; name: string; priceCents: number } | null =
    null;

  for (const [categoryIndex, categorySeed] of MENU.entries()) {
    const category = await prisma.category.upsert({
      where: { id: `${restaurant.id}-seed-category-${categoryIndex}` },
      update: { name: categorySeed.name },
      create: {
        id: `${restaurant.id}-seed-category-${categoryIndex}`,
        restaurantId: restaurant.id,
        name: categorySeed.name,
        position: categoryIndex,
      },
    });

    for (const [productIndex, productSeed] of categorySeed.products.entries()) {
      const product = await prisma.product.upsert({
        where: { id: `${category.id}-seed-product-${productIndex}` },
        update: {
          name: productSeed.name,
          description: productSeed.description,
          priceCents: productSeed.priceCents,
          imageUrl: productSeed.imageUrl,
        },
        create: {
          id: `${category.id}-seed-product-${productIndex}`,
          categoryId: category.id,
          name: productSeed.name,
          description: productSeed.description,
          priceCents: productSeed.priceCents,
          imageUrl: productSeed.imageUrl,
          isAvailable: true,
          position: productIndex,
        },
      });

      firstProduct ??= product;
    }
  }

  console.log(`Cardápio de demonstração populado com ${MENU.length} categorias.`);

  const existingOrder = await prisma.order.findFirst({
    where: { restaurantId: restaurant.id, customerName: "Maria Cliente" },
  });

  if (!existingOrder && firstProduct) {
    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        customerName: "Maria Cliente",
        customerPhone: "11988887777",
        tableNumber: "5",
        notes: "Sem cebola",
        status: "preparing",
        totalCents: firstProduct.priceCents * 2,
        items: {
          create: [
            {
              productId: firstProduct.id,
              productName: firstProduct.name,
              unitPriceCents: firstProduct.priceCents,
              quantity: 2,
              notes: "Sem cebola",
            },
          ],
        },
      },
    });
    console.log("Pedido de exemplo criado para Maria Cliente.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
