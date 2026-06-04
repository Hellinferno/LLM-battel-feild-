import type { BenchmarkResult, BenchmarkSettings, ModelSelection } from "@/lib/providers/types";

export type BenchmarkRunInput = {
  userId: string;
  prompt: string;
  systemInstruction: string | null;
  settings: BenchmarkSettings;
  models: ModelSelection[];
};

export type OrderedBenchmarkResult = BenchmarkResult & {
  resultOrder: number;
};

