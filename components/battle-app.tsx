"use client";

import {
  Activity,
  Clock3,
  History,
  ImagePlus,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Settings2,
  Trash2,
  X,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type {
  BenchmarkResultsPayload,
  BenchmarkRunView,
  HistoryItem,
  ModelView,
  ProviderKeyView,
  ProviderModelsResponse
} from "@/lib/client/api-types";
import { PROVIDER_LABELS } from "@/lib/providers/catalog";
import type { BenchmarkResult, ModelSelection, Provider } from "@/lib/providers/types";
import { PROVIDERS } from "@/lib/providers/types";

type ApiState = {
  providerKeys: ProviderKeyView[];
  models: ModelView[];
  history: HistoryItem[];
};

type ProviderForm = {
  provider: Provider;
  label: string;
  baseUrl: string;
  apiKey: string;
};

const initialProviderForm: ProviderForm = {
  provider: "openai",
  label: "",
  baseUrl: "",
  apiKey: ""
};

const providerOptions = PROVIDERS.map((provider) => ({
  value: provider,
  label: PROVIDER_LABELS[provider]
}));

type ImageAttachment = {
  name: string;
  mimeType: string;
  /** Base64 payload without the data: URL prefix. */
  data: string;
  /** Full data URL, used only for the on-screen preview. */
  dataUrl: string;
};

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
const MAX_IMAGES = 8;

function readImageFile(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const data = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
      resolve({ name: file.name, mimeType: file.type, data, dataUrl });
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export function BattleApp() {
  const [apiState, setApiState] = useState<ApiState>({
    providerKeys: [],
    models: [],
    history: []
  });
  const [providerForm, setProviderForm] = useState<ProviderForm>(initialProviderForm);
  const [prompt, setPrompt] = useState("Explain vector databases to a product manager.");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [systemInstruction, setSystemInstruction] = useState("Be clear, concise, and practical.");
  const [temperature, setTemperature] = useState(0.4);
  const [maxOutputTokens, setMaxOutputTokens] = useState(700);
  const [timeoutMs, setTimeoutMs] = useState(60000);
  const [selected, setSelected] = useState<Record<string, ModelSelection>>({});
  const [customModels, setCustomModels] = useState<ModelView[]>([]);
  const [liveModels, setLiveModels] = useState<ModelView[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [activeRun, setActiveRun] = useState<BenchmarkRunView | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const [keys, models, history] = await Promise.all([
      fetchJson<{ providerKeys: ProviderKeyView[] }>("/api/provider-keys"),
      fetchJson<{ models: ModelView[] }>("/api/models"),
      fetchJson<{ runs: HistoryItem[] }>("/api/benchmark-runs?limit=10")
    ]);

    setApiState({
      providerKeys: keys.providerKeys,
      models: models.models,
      history: history.runs
    });
  }, []);

  const loadProviderModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const data = await fetchJson<ProviderModelsResponse>("/api/provider-models");
      const flat: ModelView[] = [];
      const errors: string[] = [];

      for (const group of data.providers) {
        if (group.error) {
          errors.push(`${group.providerLabel}: ${group.error}`);
        }
        for (const item of group.models) {
          flat.push({
            provider: item.provider,
            providerLabel: group.providerLabel,
            model: item.model,
            displayName: item.displayName,
            supportsTemperature: true,
            supportsMaxOutputTokens: true,
            enabled: true
          });
        }
      }

      setLiveModels(flat);
      setMessage(
        errors.length > 0
          ? `Some providers could not list models — ${errors.join("; ")}`
          : null
      );
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    refresh()
      .then(() => loadProviderModels())
      .catch((error) => setMessage(readError(error)));
  }, [refresh, loadProviderModels]);

  const enabledProviders = useMemo(
    () => new Set(apiState.providerKeys.map((key) => key.provider)),
    [apiState.providerKeys]
  );

  const allModels = useMemo(() => {
    const liveProviders = new Set(liveModels.map((model) => model.provider));
    const byKey = new Map<string, ModelView>();

    // Catalog presets — shown only for providers we have NOT fetched live.
    for (const model of apiState.models) {
      if (liveProviders.has(model.provider)) {
        continue;
      }
      byKey.set(selectionKey(model.provider, model.model), {
        ...model,
        enabled: model.enabled || enabledProviders.has(model.provider)
      });
    }

    // Live models from the provider APIs are authoritative.
    for (const model of liveModels) {
      byKey.set(selectionKey(model.provider, model.model), model);
    }

    // User-added custom models, if not already present.
    for (const model of customModels) {
      const key = selectionKey(model.provider, model.model);
      if (!byKey.has(key)) {
        byKey.set(key, model);
      }
    }

    return [...byKey.values()];
  }, [apiState.models, liveModels, customModels, enabledProviders]);

  const selectedModels = Object.values(selected);

  function addCustomModel(provider: Provider, modelId: string, displayName: string) {
    const trimmedModel = modelId.trim();
    if (trimmedModel.length === 0) {
      setMessage("Enter a model ID to add.");
      return;
    }

    const key = selectionKey(provider, trimmedModel);
    setCustomModels((current) => {
      if (
        current.some((model) => selectionKey(model.provider, model.model) === key) ||
        apiState.models.some((model) => selectionKey(model.provider, model.model) === key)
      ) {
        return current;
      }
      return [
        ...current,
        {
          provider,
          providerLabel: PROVIDER_LABELS[provider],
          model: trimmedModel,
          displayName: displayName.trim() || trimmedModel,
          supportsTemperature: true,
          supportsMaxOutputTokens: true,
          enabled: enabledProviders.has(provider)
        }
      ];
    });
    setSelected((current) => ({
      ...current,
      [key]: { provider, model: trimmedModel }
    }));
    setMessage(null);
  }

  async function addProviderKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const isCustom = providerForm.provider === "custom_openai_compatible";
    await fetchJson("/api/provider-keys", {
      method: "POST",
      body: JSON.stringify({
        provider: providerForm.provider,
        apiKey: providerForm.apiKey,
        label: isCustom ? providerForm.label || "Custom endpoint" : undefined,
        baseUrl: isCustom ? providerForm.baseUrl : undefined
      })
    });
    setProviderForm(initialProviderForm);
    await refresh();
    await loadProviderModels();
    setMessage("Provider key saved.");
  }

  async function deleteProviderKey(id: string) {
    setMessage(null);
    await fetch(`/api/provider-keys/${id}`, { method: "DELETE" });
    await refresh();
    setMessage("Provider key deleted.");
  }

  async function testProviderKey(id: string) {
    setMessage(null);
    const result = await fetchJson<{ message: string }>(`/api/provider-keys/${id}/test`, {
      method: "POST"
    });
    await refresh();
    setMessage(result.message);
  }

  async function addImages(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setMessage(null);
    try {
      const loaded = await Promise.all(Array.from(fileList).map(readImageFile));
      setImages((current) => [...current, ...loaded].slice(0, MAX_IMAGES));
    } catch (error) {
      setMessage(readError(error));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function runBenchmark(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedModels.length === 0) {
      setMessage("Select at least one model.");
      return;
    }
    if (prompt.trim().length === 0 && images.length === 0) {
      setMessage("Provide a prompt, an image, or both.");
      return;
    }

    setMessage(null);
    setResults([]);
    const run = await fetchJson<BenchmarkRunView>("/api/benchmark-runs", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        images: images.map(({ mimeType, data }) => ({ mimeType, data })),
        systemInstruction: systemInstruction || null,
        settings: { temperature, maxOutputTokens, timeoutMs },
        models: selectedModels
      })
    });

    const payload = await fetchJson<BenchmarkResultsPayload>(`/api/benchmark-runs/${run.id}/results`);
    setActiveRun(run);
    setResults(payload.results);
    await refresh();
  }

  async function openHistory(id: string) {
    setMessage(null);
    const [run, payload] = await Promise.all([
      fetchJson<BenchmarkRunView>(`/api/benchmark-runs/${id}`),
      fetchJson<BenchmarkResultsPayload>(`/api/benchmark-runs/${id}/results`)
    ]);
    setActiveRun(run);
    setResults(payload.results);
    setPrompt(run.prompt);
    setImages([]);
    setSystemInstruction(run.systemInstruction ?? "");
    setTemperature(run.settings.temperature ?? 0.4);
    setMaxOutputTokens(run.settings.maxOutputTokens ?? 700);
    setTimeoutMs(run.settings.timeoutMs);
    setSelected(
      Object.fromEntries(
        run.selectedModels.map((model) => [selectionKey(model.provider, model.model), model])
      )
    );
  }

  function submitWithTransition(action: () => Promise<void>) {
    startTransition(() => {
      action().catch((error) => setMessage(readError(error)));
    });
  }

  const successCount = results.filter((result) => result.status === "success").length;
  const averageLatency =
    results.length === 0
      ? 0
      : Math.round(results.reduce((total, result) => total + result.latencyMs, 0) / results.length);

  return (
    <main className="min-h-screen bg-wash text-ink">
      <div className="grid min-h-screen grid-cols-[240px_1fr] max-lg:grid-cols-1">
        <aside className="border-r border-line bg-white px-5 py-6 max-lg:border-b max-lg:border-r-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal text-white">
              <Zap size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">LLM Battle</h1>
              <p className="text-xs text-muted">Local model benchmark</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1 text-sm">
            <NavItem icon={<Activity size={16} />} label="Benchmark" />
            <NavItem icon={<KeyRound size={16} />} label="Provider Keys" />
            <NavItem icon={<History size={16} />} label="History" />
            <NavItem icon={<Settings2 size={16} />} label="Settings" />
          </nav>
        </aside>

        <section className="px-6 py-6 max-md:px-4">
          <header className="mb-5 flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <p className="text-sm text-muted">One prompt, many API-key-based LLMs.</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">Compare outputs, tokens, and latency</h2>
            </div>
            <button
              type="button"
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium shadow-sm hover:border-teal"
              onClick={() => submitWithTransition(refresh)}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </header>

          {message ? (
            <div className="mb-4 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm">
              {message}
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">New benchmark</h3>
                    <p className="text-sm text-muted">Provider calls run in parallel and remain visible if one fails.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-right text-sm">
                    <Metric label="Selected" value={selectedModels.length.toString()} />
                    <Metric label="Success" value={successCount.toString()} />
                    <Metric label="Avg latency" value={averageLatency ? `${averageLatency} ms` : "-"} />
                  </div>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={(event) => submitWithTransition(() => runBenchmark(event))}
                >
                  <label className="block">
                    <span className="text-sm font-medium">Prompt</span>
                    <span className="ml-1 text-xs text-muted">(text, image, or both)</span>
                    <textarea
                      className="focus-ring mt-2 min-h-28 w-full resize-y rounded-md border border-line px-3 py-3 text-sm leading-6"
                      value={prompt}
                      placeholder="Type a prompt, attach an image, or do both."
                      onChange={(event) => setPrompt(event.target.value)}
                    />
                  </label>

                  <ImageInputField
                    images={images}
                    fileInputRef={fileInputRef}
                    onAdd={addImages}
                    onRemove={removeImage}
                  />

                  <label className="block">
                    <span className="text-sm font-medium">System instruction</span>
                    <input
                      className="focus-ring mt-2 w-full rounded-md border border-line px-3 py-2 text-sm"
                      value={systemInstruction}
                      onChange={(event) => setSystemInstruction(event.target.value)}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-3">
                    <NumberField label="Temperature" value={temperature} min={0} max={2} step={0.1} onChange={setTemperature} />
                    <NumberField label="Max tokens" value={maxOutputTokens} min={1} max={32000} step={50} onChange={setMaxOutputTokens} />
                    <NumberField label="Timeout ms" value={timeoutMs} min={1000} max={180000} step={1000} onChange={setTimeoutMs} />
                  </div>

                  <ModelSelector
                    models={allModels}
                    selected={selected}
                    enabledProviders={enabledProviders}
                    onChange={setSelected}
                    onAddCustomModel={addCustomModel}
                    onReload={() => submitWithTransition(loadProviderModels)}
                    loading={loadingModels}
                  />

                  <button
                    className="focus-ring inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-[#066b67] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      isPending ||
                      selectedModels.length === 0 ||
                      (prompt.trim().length === 0 && images.length === 0)
                    }
                  >
                    {isPending ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                    Run comparison
                  </button>
                </form>
              </section>

              <ResultsTable activeRun={activeRun} results={results} />
            </div>

            <div className="space-y-5">
              <ProviderKeyPanel
                providerForm={providerForm}
                providerKeys={apiState.providerKeys}
                isPending={isPending}
                onFormChange={setProviderForm}
                onAdd={(event) => submitWithTransition(() => addProviderKey(event))}
                onDelete={(id) => submitWithTransition(() => deleteProviderKey(id))}
                onTest={(id) => submitWithTransition(() => testProviderKey(id))}
              />

              <HistoryPanel history={apiState.history} onOpen={(id) => submitWithTransition(() => openHistory(id))} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ImageInputField({
  images,
  fileInputRef,
  onAdd,
  onRemove
}: {
  images: ImageAttachment[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Images</span>
        <span className="text-xs text-muted">
          {images.length}/{MAX_IMAGES} attached
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        aria-label="Attach images"
        className="hidden"
        onChange={(event) => onAdd(event.target.files)}
      />

      <button
        type="button"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-white px-3 py-2 text-sm font-medium hover:border-teal disabled:cursor-not-allowed disabled:opacity-60"
        disabled={images.length >= MAX_IMAGES}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus size={15} />
        Add image
      </button>

      {images.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div
              key={`${image.name}-${index}`}
              className="relative h-20 w-20 overflow-hidden rounded-md border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${image.name}`}
                className="focus-ring absolute right-1 top-1 rounded-full bg-ink/80 p-0.5 text-white hover:bg-ink"
                onClick={() => onRemove(index)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-muted first:bg-wash first:text-ink">
      {icon}
      {label}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        className="focus-ring mt-2 w-full rounded-md border border-line px-3 py-2 text-sm"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ModelSelector({
  models,
  selected,
  enabledProviders,
  onChange,
  onAddCustomModel,
  onReload,
  loading
}: {
  models: ModelView[];
  selected: Record<string, ModelSelection>;
  enabledProviders: Set<Provider>;
  onChange: (selected: Record<string, ModelSelection>) => void;
  onAddCustomModel: (provider: Provider, modelId: string, displayName: string) => void;
  onReload: () => void;
  loading: boolean;
}) {
  const [filter, setFilter] = useState("");

  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const byProvider = new Map<Provider, ModelView[]>();
    for (const model of models) {
      if (
        needle &&
        !model.model.toLowerCase().includes(needle) &&
        !model.displayName.toLowerCase().includes(needle) &&
        !model.providerLabel.toLowerCase().includes(needle)
      ) {
        continue;
      }
      const list = byProvider.get(model.provider) ?? [];
      list.push(model);
      byProvider.set(model.provider, list);
    }
    return PROVIDERS.flatMap((provider) => {
      const list = byProvider.get(provider);
      return list ? [{ provider, models: list }] : [];
    });
  }, [models, filter]);

  function toggle(model: ModelView, checked: boolean) {
    const key = selectionKey(model.provider, model.model);
    const next = { ...selected };
    if (checked) {
      next[key] = { provider: model.provider, model: model.model };
    } else {
      delete next[key];
    }
    onChange(next);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Models</h4>
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-medium hover:border-teal disabled:opacity-60"
          onClick={onReload}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
          Load models from your APIs
        </button>
      </div>

      <input
        className="focus-ring mb-3 w-full rounded-md border border-line px-3 py-2 text-sm"
        placeholder="Search models…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      <div className="space-y-4">
        {groups.map((group) => {
          const providerEnabled = enabledProviders.has(group.provider);
          return (
            <div key={group.provider}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {PROVIDER_LABELS[group.provider]}
                </span>
                {!providerEnabled ? (
                  <span className="text-[11px] text-muted">(add key to enable)</span>
                ) : null}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {group.models.map((model) => {
                  const key = selectionKey(model.provider, model.model);
                  const enabled = model.enabled || providerEnabled;
                  const checked = Boolean(selected[key]);
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${
                        enabled ? "border-line bg-white" : "border-line bg-slate-50 text-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-teal"
                        disabled={!enabled}
                        checked={checked}
                        onChange={(event) => toggle(model, event.target.checked)}
                      />
                      <span>
                        <span className="block font-medium">{model.displayName}</span>
                        <span className="block text-xs text-muted">{model.model}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <CustomModelForm onAdd={onAddCustomModel} />
    </div>
  );
}

function CustomModelForm({
  onAdd
}: {
  onAdd: (provider: Provider, modelId: string, displayName: string) => void;
}) {
  const [provider, setProvider] = useState<Provider>("openai");
  const [modelId, setModelId] = useState("");
  const [displayName, setDisplayName] = useState("");

  function submit() {
    onAdd(provider, modelId, displayName);
    setModelId("");
    setDisplayName("");
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-line bg-slate-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Add a custom model
      </div>
      <div className="grid gap-2 md:grid-cols-[150px_1fr_1fr_auto]">
        <select
          aria-label="Custom model provider"
          className="focus-ring rounded-md border border-line px-2 py-2 text-sm"
          value={provider}
          onChange={(event) => setProvider(event.target.value as Provider)}
        >
          {providerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          placeholder="Model ID (e.g. gemini-2.5-pro)"
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <input
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          placeholder="Display name (optional)"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <button
          type="button"
          className="focus-ring inline-flex items-center justify-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:border-teal disabled:opacity-60"
          disabled={modelId.trim().length === 0}
          onClick={submit}
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Use any model ID your provider supports. It will be selected automatically.
      </p>
    </div>
  );
}

function ProviderKeyPanel({
  providerForm,
  providerKeys,
  isPending,
  onFormChange,
  onAdd,
  onDelete,
  onTest
}: {
  providerForm: ProviderForm;
  providerKeys: ProviderKeyView[];
  isPending: boolean;
  onFormChange: (form: ProviderForm) => void;
  onAdd: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}) {
  const isCustom = providerForm.provider === "custom_openai_compatible";
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-base font-semibold">Provider keys</h3>
      <p className="mt-1 text-sm text-muted">Keys are encrypted locally and only key hints are shown.</p>

      <form className="mt-4 space-y-3" onSubmit={onAdd}>
        <select
          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
          value={providerForm.provider}
          onChange={(event) =>
            onFormChange({ ...providerForm, provider: event.target.value as Provider })
          }
        >
          {providerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {isCustom ? (
          <>
            <input
              className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
              placeholder="Custom label"
              value={providerForm.label}
              onChange={(event) => onFormChange({ ...providerForm, label: event.target.value })}
            />
            <input
              className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
              placeholder="https://api.example.com/v1"
              value={providerForm.baseUrl}
              onChange={(event) => onFormChange({ ...providerForm, baseUrl: event.target.value })}
            />
          </>
        ) : null}

        <input
          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
          placeholder="API key"
          type="password"
          value={providerForm.apiKey}
          onChange={(event) => onFormChange({ ...providerForm, apiKey: event.target.value })}
        />
        <button
          className="focus-ring w-full rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending || providerForm.apiKey.trim().length < 4 || (isCustom && !providerForm.baseUrl)}
        >
          Save key
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {providerKeys.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-3 py-4 text-sm text-muted">
            No provider keys saved yet.
          </p>
        ) : (
          providerKeys.map((key) => (
            <div key={key.id} className="rounded-md border border-line px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{key.label ?? PROVIDER_LABELS[key.provider]}</div>
                  <div className="text-xs text-muted">
                    {key.provider} / ****{key.keyHint}
                  </div>
                </div>
                <Status status={key.status} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium"
                  onClick={() => onTest(key.id)}
                >
                  <Clock3 size={13} />
                  Test
                </button>
                <button
                  type="button"
                  className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-danger"
                  onClick={() => onDelete(key.id)}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ResultsTable({
  activeRun,
  results
}: {
  activeRun: BenchmarkRunView | null;
  results: BenchmarkResult[];
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Results</h3>
          <p className="text-sm text-muted">
            {activeRun ? `Run ${activeRun.id.slice(0, 8)} / ${activeRun.status}` : "Run a benchmark to compare outputs."}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase text-muted">
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Model</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Latency</th>
              <th className="py-2 pr-3">Input</th>
              <th className="py-2 pr-3">Output</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Preview</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td className="py-6 text-muted" colSpan={8}>
                  No results yet.
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr key={`${result.provider}-${result.model}`} className="border-b border-line align-top">
                  <td className="py-3 pr-3 font-medium">{PROVIDER_LABELS[result.provider]}</td>
                  <td className="py-3 pr-3 text-muted">{result.model}</td>
                  <td className="py-3 pr-3"><Status status={result.status} /></td>
                  <td className="py-3 pr-3">{result.latencyMs} ms</td>
                  <td className="py-3 pr-3">{formatToken(result.inputTokens)}</td>
                  <td className="py-3 pr-3">{formatToken(result.outputTokens)}</td>
                  <td className="py-3 pr-3">{formatToken(result.totalTokens)}</td>
                  <td className="max-w-md py-3 pr-3 text-muted">
                    {result.status === "success" ? result.output : result.errorMessage}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HistoryPanel({
  history,
  onOpen
}: {
  history: HistoryItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-base font-semibold">History</h3>
      <div className="mt-4 space-y-2">
        {history.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-3 py-4 text-sm text-muted">
            Previous runs will appear here.
          </p>
        ) : (
          history.map((item) => (
            <button
              type="button"
              key={item.id}
              className="focus-ring w-full rounded-md border border-line px-3 py-3 text-left hover:border-teal"
              onClick={() => onOpen(item.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{item.promptPreview}</span>
                <Status status={item.status} />
              </div>
              <div className="mt-2 text-xs text-muted">
                {item.providerCount} models / {item.averageLatencyMs} ms avg /{" "}
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function Status({ status }: { status: string }) {
  const color =
    status === "success" || status === "connected" || status === "completed"
      ? "bg-teal text-white"
      : status === "failed" || status === "error" || status === "timeout"
        ? "bg-danger text-white"
        : "bg-amber text-white";
  return <span className={`rounded px-2 py-1 text-xs font-semibold ${color}`}>{status}</span>;
}

function formatToken(value: number | null) {
  return value === null ? "Unknown" : value.toLocaleString();
}

function selectionKey(provider: Provider, model: string) {
  return `${provider}:${model}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed.");
  }

  return data as T;
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

