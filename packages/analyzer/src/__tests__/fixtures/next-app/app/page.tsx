import { FeatureCard } from "../components/FeatureCard";

export default function HomePage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10">
      <FeatureCard title="Routes" />
      <FeatureCard title="Components" />
    </main>
  );
}
