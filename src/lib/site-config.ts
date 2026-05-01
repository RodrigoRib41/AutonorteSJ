const fallbackWhatsAppUrl =
  "https://wa.me/5491100000000?text=Hola%2C%20quiero%20hacer%20una%20consulta.";

function getPublicEnv(value: string | undefined, fallback = "") {
  value = value?.trim();
  return value && value.length > 0 ? value : fallback;
}

function buildGoogleMapsEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function buildGoogleMapsDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

const contactAddress = getPublicEnv(
  process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
  "Av. principal 1234, Ciudad Autonoma de Buenos Aires"
);

export const siteConfig = {
  name: "TestAutomotores",
  description: "Compra, venta, permuta y financiacion de vehiculos.",
  contact: {
    phoneDisplay: getPublicEnv(
      process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY,
      "+54 11 4000 0000"
    ),
    phoneTel: getPublicEnv(
      process.env.NEXT_PUBLIC_CONTACT_PHONE_TEL,
      "+541140000000"
    ),
    email: getPublicEnv(
      process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      "ventas@testautomotores.com"
    ),
    address: contactAddress,
    mapEmbedUrl: buildGoogleMapsEmbedUrl(contactAddress),
    mapDirectionsUrl: buildGoogleMapsDirectionsUrl(contactAddress),
  },
  businessHours: {
    weekdays: getPublicEnv(
      process.env.NEXT_PUBLIC_BUSINESS_HOURS_WEEKDAYS,
      "Lunes a viernes de 9 a 18 hs"
    ),
    saturday: getPublicEnv(
      process.env.NEXT_PUBLIC_BUSINESS_HOURS_SATURDAY,
      "Sabados de 9 a 13 hs"
    ),
  },
  social: {
    instagramUrl: getPublicEnv(
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      "https://www.instagram.com/"
    ),
    facebookUrl: getPublicEnv(
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      "https://www.facebook.com/"
    ),
    whatsappUrl: getPublicEnv(
      process.env.NEXT_PUBLIC_WHATSAPP_URL,
      fallbackWhatsAppUrl
    ),
  },
} as const;
