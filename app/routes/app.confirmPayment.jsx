import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const db = new PrismaClient();
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");
  const shop = url.searchParams.get("shop"); 
  const sectionId = url.searchParams.get("sectionID");
  const shopOrigin = db.session.shop;
  const {redirect} = await authenticate.admin(request);

  // Check if charge_id is present
  if (!chargeId || !shop || !sectionId) {
    // Handle the case when charge_id is not available
    return json({ error: "Charge ID, shop, or section ID is missing." }, { status: 400 });
  }

  try {
    // Find or create the PaymentDetails entry for the shop
    const paymentDetails = await db.paymentDetails.upsert({
      where: { shopId: shop },
      update: {}, 
      create: {
        shopId: shop,
      },
    });

    // Create the SectionPayment entry
    await db.sectionPayment.create({
      data: {
        chargeId,
        sectionId,
        paymentId: paymentDetails.id, 
      },
    });

    // Redirect user to the home page of the app after successful payment logging
    return redirect(`/app/`);
  } catch (error) {
    console.error("Error saving payment details: ", error);
    return json({ error: "Failed to save payment details." }, { status: 500 });
  } finally {
    await db.$disconnect(); 
  }
};
