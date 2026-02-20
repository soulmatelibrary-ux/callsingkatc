import { Header } from '@/components/layout/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="pt-12">{children}</div>
    </>
  );
}
