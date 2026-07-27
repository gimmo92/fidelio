import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { Customer, DealerGroup, Vehicle } from "@prisma/client";

export type CustomerSession = Customer & {
  group: DealerGroup;
  vehicles: Vehicle[];
};

export async function getCurrentCustomer(): Promise<CustomerSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { authUserId: user.id },
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
    include: {
      group: true,
      vehicles: { orderBy: { targa: "asc" } },
    },
  });

  if (!customer) return null;

  if (!customer.authUserId) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { authUserId: user.id },
    });
  }

  return customer;
}

export async function requireCustomer(): Promise<CustomerSession> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/area-clienti");
  return customer;
}
