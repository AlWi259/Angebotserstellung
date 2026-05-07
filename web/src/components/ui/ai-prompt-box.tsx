import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { ArrowUp, FileText, Mic, MicOff, Paperclip, X } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

const localStyles = `
  *:focus-visible {
    outline-offset: 0 !important;
  }

  textarea::-webkit-scrollbar {
    width: 6px;
  }

  textarea::-webkit-scrollbar-track {
    background: transparent;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.18);
    border-radius: 999px;
  }

  textarea::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const ACCEPT =
  "image/*,.md,.markdown,.txt,.csv,.pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc";

function useLocalStyleSheet(cssText: string) {
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = cssText;
    document.head.appendChild(styleSheet);
    return () => {
      styleSheet.remove();
    };
  }, [cssText]);
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[48px] w-full resize-none rounded-3xl border-none bg-transparent px-1 py-2 text-base leading-7 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      rows={1}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-full border border-white/10 bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-2xl backdrop-blur data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/72 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[var(--surface-strong)] p-0 shadow-[0_40px_120px_rgba(0,0,0,0.45)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/30 p-2 text-[var(--text-primary)] transition hover:bg-black/50">
        <X className="h-4 w-4" />
        <span className="sr-only">Schließen</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface PromptInputContextType {
  disabled?: boolean;
  isLoading: boolean;
  maxHeight: number | string;
  onSubmit?: () => void;
  setValue: (value: string) => void;
  value: string;
}

const PromptInputContext = React.createContext<PromptInputContextType | null>(null);

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput must be used within a PromptInput");
  return context;
}

interface PromptInputProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxHeight?: number | string;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onSubmit?: () => void;
  onValueChange?: (value: string) => void;
  value?: string;
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      children,
      className,
      disabled = false,
      isLoading = false,
      maxHeight = 240,
      onDragLeave,
      onDragOver,
      onDrop,
      onSubmit,
      onValueChange,
      value,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(value ?? "");
    const resolvedValue = value ?? internalValue;

    const handleValueChange = (nextValue: string) => {
      setInternalValue(nextValue);
      onValueChange?.(nextValue);
    };

    return (
      <TooltipProvider delayDuration={100}>
        <PromptInputContext.Provider
          value={{
            disabled,
            isLoading,
            maxHeight,
            onSubmit,
            setValue: onValueChange ?? handleValueChange,
            value: resolvedValue,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "rounded-[32px] border border-white/10 bg-[var(--surface-strong)]/95 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-200",
              className,
            )}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  },
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps extends React.ComponentProps<typeof Textarea> {
  disableAutosize?: boolean;
  placeholder?: string;
}

const PromptInputTextarea: React.FC<PromptInputTextareaProps> = ({
  className,
  disableAutosize = false,
  onKeyDown,
  placeholder,
  ...props
}) => {
  const { disabled, maxHeight, onSubmit, setValue, value } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [disableAutosize, maxHeight, value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(event);
  };

  return (
    <Textarea
      ref={textareaRef}
      className={cn("text-base", className)}
      disabled={disabled}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      value={value}
      {...props}
    />
  );
};

const PromptInputActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex items-center justify-between gap-3", className)} {...props}>
    {children}
  </div>
);

interface PromptInputActionProps {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  tooltip: React.ReactNode;
}

const PromptInputAction: React.FC<PromptInputActionProps> = ({
  children,
  side = "top",
  tooltip,
}) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

function ImageViewDialog({ imageUrl, onClose }: ImageViewDialogProps) {
  if (!imageUrl) return null;
  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden border-none bg-transparent shadow-none">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-[28px] border border-white/10 bg-[var(--surface-strong)]"
          initial={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <img
            alt="Dateivorschau"
            className="max-h-[82vh] w-full object-contain"
            src={imageUrl}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isImageFile = (file: File) => file.type.startsWith("image/");

const isTextFile = (file: File) =>
  file.type === "text/plain" ||
  file.type === "text/markdown" ||
  file.type === "text/csv" ||
  /\.(md|markdown|txt|csv)$/i.test(file.name);

async function extractFileText(file: File): Promise<string> {
  if (isTextFile(file)) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? "");
      reader.onerror = reject;
      reader.readAsText(file, "utf-8");
    });
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/extract-text", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Fehler beim Lesen von ${file.name}`);
  const data = (await res.json()) as { text: string };
  return data.text;
}

// ─── PromptInputBox ───────────────────────────────────────────────────────────

interface PromptInputBoxProps {
  className?: string;
  isLoading?: boolean;
  onSend?: (message: string, files?: File[]) => void;
  placeholder?: string;
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
  (
    {
      className,
      isLoading = false,
      onSend,
      placeholder = "Womit soll ich dir beim Angebot helfen?",
    },
    ref,
  ) => {
    useLocalStyleSheet(localStyles);

    const [input, setInput] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [filePreviews, setFilePreviews] = React.useState<Record<string, string>>({});
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isExtracting, setIsExtracting] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = React.useRef<any>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: any =
      typeof window !== "undefined"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
        : undefined;
    const speechSupported = Boolean(SpeechRecognitionAPI);

    const toggleRecording = () => {
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
        return;
      }
      if (!SpeechRecognitionAPI) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec: any = new SpeechRecognitionAPI();
      rec.lang = "de-DE";
      rec.continuous = true;
      rec.interimResults = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results as ArrayLike<SpeechRecognitionResult>)
          .slice(event.resultIndex as number)
          .map((r) => r[0].transcript)
          .join("");
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    };

    const processFile = (file: File) => {
      if (file.size > 25 * 1024 * 1024) return;
      setFiles((prev) => [...prev, file]);
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreviews((prev) => ({
            ...prev,
            [file.name]: event.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      Array.from(event.dataTransfer.files).forEach(processFile);
    };

    const handleRemoveFile = (index: number) => {
      const fileToRemove = files[index];
      if (fileToRemove && filePreviews[fileToRemove.name]) {
        setFilePreviews((prev) => {
          const next = { ...prev };
          delete next[fileToRemove.name];
          return next;
        });
      }
      setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    React.useEffect(() => {
      const handlePaste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i += 1) {
          if (items[i].type.includes("image")) {
            const file = items[i].getAsFile();
            if (file) {
              event.preventDefault();
              processFile(file);
            }
            break;
          }
        }
      };
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, []);

    const handleSubmit = async () => {
      if (!input.trim() && files.length === 0) return;

      setIsExtracting(true);
      try {
        const parts: string[] = [];
        const imageFiles: File[] = [];

        for (const file of files) {
          if (isImageFile(file)) {
            imageFiles.push(file);
            continue;
          }
          try {
            const text = await extractFileText(file);
            if (text.trim()) {
              parts.push(
                `**Dateiinhalt: ${file.name}**\n\`\`\`\n${text.slice(0, 12000)}\n\`\`\``,
              );
            }
          } catch {
            parts.push(`[${file.name} – konnte nicht gelesen werden]`);
          }
        }

        if (input.trim()) parts.push(input.trim());

        onSend?.(parts.join("\n\n"), imageFiles);
        setInput("");
        setFiles([]);
        setFilePreviews({});
      } finally {
        setIsExtracting(false);
      }
    };

    const isBusy = isLoading || isExtracting;
    const hasContent = input.trim() !== "" || files.length > 0;

    return (
      <>
        <PromptInput
          ref={ref}
          className={className}
          isLoading={isBusy}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
          onValueChange={setInput}
          value={input}
        >
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  {isImageFile(file) && filePreviews[file.name] ? (
                    <button
                      className="relative h-[72px] w-[72px] overflow-hidden"
                      onClick={() => setSelectedImage(filePreviews[file.name])}
                      type="button"
                    >
                      <img
                        alt={file.name}
                        className="h-[72px] w-[72px] object-cover transition duration-200 group-hover:scale-105"
                        src={filePreviews[file.name]}
                      />
                      <span className="sr-only">Bildvorschau öffnen</span>
                    </button>
                  ) : (
                    <div className="flex max-w-[180px] items-center gap-2 px-3 py-3">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                      <span className="truncate text-sm text-[var(--text-primary)]">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    className="absolute right-1.5 top-1.5 rounded-full border border-white/10 bg-black/55 p-1 text-white transition hover:bg-black/75"
                    onClick={() => handleRemoveFile(index)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Datei entfernen</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <PromptInputTextarea className="min-h-[56px]" placeholder={placeholder} />

          <PromptInputActions className="pt-2">
            <div className="flex items-center gap-2">
              <PromptInputAction tooltip="Datei hinzufügen">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-[var(--brand)]/50 hover:text-[var(--text-primary)]"
                  onClick={() => uploadInputRef.current?.click()}
                  type="button"
                >
                  <Paperclip className="h-[18px] w-[18px]" />
                  <input
                    ref={uploadInputRef}
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      Array.from(event.target.files ?? []).forEach(processFile);
                      event.target.value = "";
                    }}
                    type="file"
                    multiple
                  />
                </button>
              </PromptInputAction>
              {speechSupported && (
                <PromptInputAction tooltip={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}>
                  <button
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition",
                      isRecording
                        ? "animate-pulse border-[var(--brand)]/60 bg-[var(--brand)]/15 text-[var(--brand)]"
                        : "border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-[var(--brand)]/50 hover:text-[var(--text-primary)]",
                    )}
                    onClick={toggleRecording}
                    type="button"
                  >
                    {isRecording ? (
                      <MicOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Mic className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </PromptInputAction>
              )}
              <span className="text-sm text-[var(--text-muted)]">
                {isExtracting ? "Datei wird gelesen…" : isRecording ? "Aufnahme läuft…" : "Enter zum Senden, Shift+Enter für Umbruch"}
              </span>
            </div>

            <PromptInputAction tooltip={hasContent ? "Nachricht senden" : "Nachricht eingeben"}>
              <button
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition duration-200",
                  hasContent && !isBusy
                    ? "bg-[var(--brand)] text-[var(--brand-contrast)] shadow-[0_18px_40px_rgba(252,106,28,0.28)] hover:scale-[1.02] hover:bg-[var(--brand-strong)]"
                    : "bg-white/5 text-[var(--text-muted)]",
                )}
                disabled={!hasContent || isBusy}
                onClick={handleSubmit}
                type="button"
              >
                <ArrowUp className="h-[18px] w-[18px]" />
                <span className="sr-only">Senden</span>
              </button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>

        <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      </>
    );
  },
);
PromptInputBox.displayName = "PromptInputBox";
