import { PrismaClient, PlanSlug } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    slug: PlanSlug.FREE,
    name: 'Gratis',
    description: 'Ideal para empezar. 1 página, 5 enlaces, estadísticas básicas.',
    priceMonthly: 0,
    priceYearly: null,
    maxPages: 1,
    maxLinks: 5,
    maxThemes: 3,
    customDomain: false,
    removeBranding: false,
    qrCode: true,
    basicStats: true,
    fullStats: false,
    advancedAnalytics: false,
    whatsappButton: false,
    paymentButton: false,
    scheduledLinks: false,
    leadCapture: false,
    socialIntegrations: false,
    pixelFacebook: false,
    pixelGoogle: false,
    multipleAdmins: false,
    dataExport: false,
    abTesting: false,
    clientManagement: false,
    prioritySupport: false,
    premiumTemplates: false,
    sortOrder: 0,
  },
  {
    slug: PlanSlug.EMPRENDEDOR,
    name: 'Emprendedor',
    description: 'Enlaces ilimitados, 20 temas, estadísticas completas, botón WhatsApp.',
    priceMonthly: 4,
    priceYearly: 36,
    maxPages: 1,
    maxLinks: 999,
    maxThemes: 20,
    customDomain: false,
    removeBranding: true,
    qrCode: true,
    basicStats: true,
    fullStats: true,
    advancedAnalytics: false,
    whatsappButton: true,
    paymentButton: false,
    scheduledLinks: true,
    leadCapture: false,
    socialIntegrations: false,
    pixelFacebook: false,
    pixelGoogle: false,
    multipleAdmins: false,
    dataExport: false,
    abTesting: false,
    clientManagement: false,
    prioritySupport: false,
    premiumTemplates: false,
    sortOrder: 1,
  },
  {
    slug: PlanSlug.NEGOCIO,
    name: 'Negocio',
    description: 'Dominio personalizado, integraciones redes, botón de pagos, analítica avanzada.',
    priceMonthly: 9,
    priceYearly: 99,
    maxPages: 1,
    maxLinks: 999,
    maxThemes: 999,
    customDomain: true,
    removeBranding: true,
    qrCode: true,
    basicStats: true,
    fullStats: true,
    advancedAnalytics: true,
    whatsappButton: true,
    paymentButton: true,
    scheduledLinks: true,
    leadCapture: true,
    socialIntegrations: true,
    pixelFacebook: true,
    pixelGoogle: true,
    multipleAdmins: false,
    dataExport: false,
    abTesting: false,
    clientManagement: false,
    prioritySupport: false,
    premiumTemplates: false,
    sortOrder: 2,
  },
  {
    slug: PlanSlug.PRO,
    name: 'Pro / Agencia',
    description: 'Hasta 10 páginas, administración de clientes, A/B testing, soporte prioritario.',
    priceMonthly: 19,
    priceYearly: 199,
    maxPages: 10,
    maxLinks: 999,
    maxThemes: 999,
    customDomain: true,
    removeBranding: true,
    qrCode: true,
    basicStats: true,
    fullStats: true,
    advancedAnalytics: true,
    whatsappButton: true,
    paymentButton: true,
    scheduledLinks: true,
    leadCapture: true,
    socialIntegrations: true,
    pixelFacebook: true,
    pixelGoogle: true,
    multipleAdmins: true,
    dataExport: true,
    abTesting: true,
    clientManagement: true,
    prioritySupport: true,
    premiumTemplates: true,
    sortOrder: 3,
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log('Planes creados/actualizados:', plans.length);

  // Temas por defecto (3 para Free)
  const defaultThemes = [
    { name: 'Clásico', slug: 'clasico', isPremium: false, sortOrder: 0 },
    { name: 'Oscuro', slug: 'oscuro', isPremium: false, sortOrder: 1 },
    { name: 'Minimal', slug: 'minimal', isPremium: false, sortOrder: 2 },
  ];
  for (const theme of defaultThemes) {
    await prisma.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
  }
  console.log('Temas por defecto creados:', defaultThemes.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
