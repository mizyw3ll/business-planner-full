import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import toast from "react-hot-toast";
import { AIPreviewModal } from "../../components/AIPreviewModal";
import type { AITextResponse } from "../../api";

interface TaskHandle {
  title: string;
  onSave: (content: string) => Promise<void>;
}

interface TaskState {
  title: string;
  response: AITextResponse;
  onSave: (content: string) => Promise<void>;
}

interface AiContextValue {
  startTask: (promise: Promise<AITextResponse>, handle: TaskHandle) => void;
}

const AiContext = createContext<AiContextValue | null>(null);

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAi must be inside AiProvider");
  return ctx;
}

export function AiProvider({ children }: { children: ReactNode }) {
  const [taskState, setTaskState] = useState<TaskState | null>(null);
  const [saving, setSaving] = useState(false);
  const tasksRef = useRef<Set<Promise<void>>>(new Set());

  const startTask = useCallback((promise: Promise<AITextResponse>, handle: TaskHandle) => {
    const tracked = promise
      .then((response) => {
        setTaskState({ ...handle, response });
      })
      .catch((err: any) => {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          toast.error(err?.userMessage || "Не удалось выполнить AI-запрос");
        }
      });

    tasksRef.current.add(tracked);
    tracked.finally(() => tasksRef.current.delete(tracked));

    toast.success("AI-задача запущена, результат появится после готовности");
  }, []);

  const handleSave = useCallback(async (content: string) => {
    if (!taskState) return;
    setSaving(true);
    try {
      await taskState.onSave(content);
      toast.success("AI-результат сохранён");
      setTaskState(null);
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }, [taskState]);

  return (
    <AiContext.Provider value={{ startTask }}>
      {children}
      <AIPreviewModal
        open={!!taskState}
        title={taskState?.title ?? ""}
        content={taskState?.response.content ?? ""}
        charCount={taskState?.response.char_count ?? 0}
        maxChars={taskState?.response.max_chars ?? 0}
        provider={taskState?.response.provider}
        model={taskState?.response.model}
        saving={saving}
        onSave={handleSave}
        onCancel={() => setTaskState(null)}
      />
    </AiContext.Provider>
  );
}
