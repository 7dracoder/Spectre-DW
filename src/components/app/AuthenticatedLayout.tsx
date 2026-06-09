import TopNav from "@/components/app/TopNav";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const AuthenticatedLayout = ({
  children,
  fullWidth = false,
}: AuthenticatedLayoutProps) => (
  <div className="min-h-screen bg-background">
    <TopNav />
    <main
      className={
        fullWidth
          ? "px-4 py-4 md:px-8 md:py-6"
          : "mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8"
      }
    >
      {children}
    </main>
  </div>
);

export default AuthenticatedLayout;
