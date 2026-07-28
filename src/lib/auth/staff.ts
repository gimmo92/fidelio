import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import type { StaffUser, Location, DealerGroup } from "@prisma/client";

export type StaffSession = StaffUser & {
  group: DealerGroup;
  location: Location | null;
};

export async function getAuthUser() {
  if (isDemoMode()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getDemoStaff(): Promise<StaffSession | null> {
  return prisma.staffUser.findFirst({
    where: { ruolo: "OWNER" },
    include: { group: true, location: true },
    orderBy: { nome: "asc" },
  });
}

export async function getCurrentStaff(): Promise<StaffSession | null> {
  if (isDemoMode()) {
    return getDemoStaff();
  }

  const user = await getAuthUser();
  if (!user?.email) return null;

  const staff = await prisma.staffUser.findFirst({
    where: {
      OR: [
        { authUserId: user.id },
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
    include: { group: true, location: true },
  });

  if (!staff) return null;

  if (!staff.authUserId) {
    await prisma.staffUser.update({
      where: { id: staff.id },
      data: { authUserId: user.id },
    });
  }

  return staff;
}

export async function requireStaff(): Promise<StaffSession> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  return staff;
}

export function staffLocationFilter(staff: StaffSession) {
  if (staff.locationId) {
    return { locationId: staff.locationId };
  }
  return { groupId: staff.groupId };
}
