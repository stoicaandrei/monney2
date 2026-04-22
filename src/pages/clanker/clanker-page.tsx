"use client";

import * as React from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Bot, ImagePlus, Send, Trash2 } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type PendingScreenshot = {
  name: string;
  dataUrl: string;
};

const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = fileDataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_WIDTH / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process image");
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function ClankerPage() {
  const runClanker = useAction(api.clanker.runChat);
  const [message, setMessage] = React.useState("");
  const [screenshots, setScreenshots] = React.useState<PendingScreenshot[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Send me a screenshot and tell me what to create. I can add wallets and transactions for you.",
    },
  ]);
  const [isSending, setIsSending] = React.useState(false);
  const messagesBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addScreenshots = React.useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Only image files are supported.");
      return;
    }

    const nextScreenshots = await Promise.all(
      imageFiles.map(async (file) => ({
        name: file.name || `pasted-image-${Date.now()}.png`,
        dataUrl: await fileToCompressedDataUrl(file),
      })),
    );
    setScreenshots((current) => [...current, ...nextScreenshots]);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      await addScreenshots(files);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add image");
    } finally {
      event.target.value = "";
    }
  };

  const handleTextareaPaste = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const clipboardItems = Array.from(event.clipboardData.items ?? []);
    const imageFiles = clipboardItems
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (imageFiles.length === 0) return;

    try {
      await addScreenshots(imageFiles);
      toast.success(
        imageFiles.length === 1
          ? "Pasted image attached."
          : `${imageFiles.length} pasted images attached.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not paste image");
    }
  };

  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    if (!isSending) {
      void handleSend();
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      toast.error("Write a request before sending.");
      return;
    }

    const requestScreenshots = [...screenshots];
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text:
        requestScreenshots.length > 0
          ? `${trimmedMessage}\n\nAttached screenshots: ${requestScreenshots.map((s) => s.name).join(", ")}`
          : trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setScreenshots([]);
    setIsSending(true);

    try {
      const result = await runClanker({
        message: trimmedMessage,
        screenshots: requestScreenshots,
      });

      const generatedLines = [
        result.reply,
        result.createdWallets.length > 0
          ? `Created wallets: ${result.createdWallets.map((wallet) => wallet.name).join(", ")}`
          : "",
        result.createdTransactions.length > 0
          ? `Created transactions: ${result.createdTransactions.length}`
          : "",
        result.warnings.length > 0 ? `Warnings: ${result.warnings.join(" | ")}` : "",
      ].filter(Boolean);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: generatedLines.join("\n"),
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Clanker failed");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I hit an error while processing that. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Clanker" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Clanker</h1>
                  <p className="text-muted-foreground text-sm">
                    Chat with AI, attach banking screenshots, and auto-create wallets or transactions.
                  </p>
                </div>

                <Card className="min-h-[60vh]">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="size-4" />
                      Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex h-[65vh] flex-col gap-4 p-4">
                    <ScrollArea className="flex-1 rounded-md border p-3">
                      <div className="flex flex-col gap-3">
                        {messages.map((chatMessage) => (
                          <div
                            key={chatMessage.id}
                            className={
                              chatMessage.role === "user"
                                ? "bg-primary text-primary-foreground ml-auto max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                                : "bg-muted mr-auto max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                            }
                          >
                            {chatMessage.text}
                          </div>
                        ))}
                        <div ref={messagesBottomRef} />
                      </div>
                    </ScrollArea>

                    {screenshots.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                        {screenshots.map((screenshot, index) => (
                          <div
                            key={`${screenshot.name}-${index}`}
                            className="bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                          >
                            <span>{screenshot.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setScreenshots((current) =>
                                  current.filter((_, currentIndex) => currentIndex !== index),
                                )
                              }
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`Remove ${screenshot.name}`}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onPaste={handleTextareaPaste}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder="Example: From this screenshot, create a wallet called Revolut EUR and add the grocery transaction."
                        rows={4}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                          <Button variant="outline" type="button" asChild>
                            <span>
                              <ImagePlus className="size-4" />
                              Attach screenshots
                            </span>
                          </Button>
                        </label>
                        <Button type="button" onClick={handleSend} disabled={isSending}>
                          <Send className="size-4" />
                          {isSending ? "Thinking..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
