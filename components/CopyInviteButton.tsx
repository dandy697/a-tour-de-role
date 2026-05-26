"use client";

import { useState } from "react";

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs ml-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
    >
      {copied ? "✅ Copié" : "🔗 Copier l'invitation"}
    </button>
  );
}
