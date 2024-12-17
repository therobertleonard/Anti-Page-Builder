
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export let loader = async () => {
  const sections = await prisma.section.findMany({
    include: {
      category: true, // Include category if needed
    },
  });
  return { sections };
};
