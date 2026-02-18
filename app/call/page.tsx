import { HomePageContent } from "../home-page-content";

type CallPageProps = {
  searchParams?: Promise<{
    duration?: string;
  }>;
};

export default async function CallPage({ searchParams }: CallPageProps) {
  const resolvedSearchParams = await searchParams;
  const duration = resolvedSearchParams?.duration;
  const initialCallIntent = duration === "30m" ? "30m" : "15m";

  return (
    <HomePageContent
      initialSectionIntent="home"
      initialCallIntent={initialCallIntent}
    />
  );
}
