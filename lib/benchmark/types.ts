import type {
  BenchmarkResult,
  BenchmarkSettings,
  ImageInput,
  ModelSelection
} from "@/lib/providers/types";

export type BenchmarkRunInput = {
  userId: string;
  prompt: string;
  systemInstruction: string | null;
  settings: BenchmarkSettings;
  models: ModelSelection[];
  images: ImageInput[];
};

export type OrderedBenchmarkResult = BenchmarkResult & {
  resultOrder: number;
};

