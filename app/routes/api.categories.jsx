// api/categories.js
import { json } from "@remix-run/node";

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

export const loader = async () => {
  const categories = await db.category.findMany();
  return json(categories);
};
