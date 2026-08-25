"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setIsStandalone(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Only hide once it's actually running as an installed app — otherwise
  // always show something clickable, even before the browser has decided
  // to offer its own native install prompt (or on browsers that never do).
  if (isStandalone) return null;

  async function handleClick() {
    if (installing) return;

    if (installPrompt) {
      setInstalling(true);
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      } finally {
        setInstalling(false);
      }
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast.info(
      isIOS
        ? "Tap the Share icon, then \"Add to Home Screen\"."
        : "Open your browser menu and choose \"Install app\" or \"Add to Home Screen\"."
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={installing}
      className="gap-1.5"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">Install app</span>
    </Button>
  );
}
