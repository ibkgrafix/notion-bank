import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Server-side role check — never trust only middleware
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { firstName: true, lastName: true, email: true },
  });

  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col w-full lg:flex-row">
        <AdminSidebar admin={admin} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
