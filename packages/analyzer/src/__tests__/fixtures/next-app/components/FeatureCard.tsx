"use client";

import { useState } from "react";

export interface FeatureCardProps {
  title: string;
}

export function FeatureCard({ title }: FeatureCardProps) {
  const [active, setActive] = useState(false);

  return (
    <button
      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"
      onClick={() => setActive(!active)}
      type="button"
    >
      <span className="text-sm font-medium text-slate-700">{title}</span>
    </button>
  );
}
