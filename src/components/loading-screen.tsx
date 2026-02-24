import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const CUTE_MESSAGES = [
  "Counting your pennies...",
  "Organizing your coins...",
  "Polishing the vault...",
  "Brewing some financial wisdom...",
  "Almost there, hang tight!",
  "Your money is doing stretches...",
  "Waking up the piggy bank...",
  "Double-checking the math...",
  "Making everything sparkle...",
  "Gathering your financial ducks...",
];

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % CUTE_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-bounce" style={{ animationDuration: "1.5s" }}>
            💰
          </span>
          <Spinner className="size-10 text-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium text-foreground animate-in fade-in duration-500">
            {CUTE_MESSAGES[messageIndex]}
          </p>
          <p className="text-sm text-muted-foreground">
            Monney is getting ready for you
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        {CUTE_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-1 rounded-full transition-all duration-300 ${
              i === messageIndex ? "bg-primary scale-150" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
