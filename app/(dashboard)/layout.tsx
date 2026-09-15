import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { firstName: true, lastName: true, email: true },
  });

  if (!user) {
    redirect("/login");
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.userId, read: false },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col w-full lg:flex-row">
        <DashboardSidebar user={user} unreadCount={unreadCount} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
