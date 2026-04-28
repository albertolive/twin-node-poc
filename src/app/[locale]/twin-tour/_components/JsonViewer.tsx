"use client";

import { useState } from "react";

type Props = {
  json: unknown;
  maxHeight?: string;
};

export function JsonViewer({ json, maxHeight = "24rem" }: Props) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(json, null, 2);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        className="overflow-auto rounded-md bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100"
        style={{ maxHeight }}
      >
        {text}
      </pre>
    </div>
  );
}
