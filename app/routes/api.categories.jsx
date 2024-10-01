// api/categories.js
import { json } from "@remix-run/node";
import db from '../db.server';

export const loader = async () => {
  const categories = await db.category.findMany();
  return json(categories);
};
