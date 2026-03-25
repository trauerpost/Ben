"use client";

import { useState } from "react";

const BUILD_VERSION = "2026-03-25-v7";

export default function LoginDebug() {
  const [result, setResult] = useState("");

  return (
    <div className="mt-8 p-4 border-2 border-blue-300 rounded-xl bg-blue-50 text-xs">
      <p className="font-bold text-blue-700 mb-2">DEBUG v{BUILD_VERSION}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Button 1: Does JS work at all? */}
        <button
          type="button"
          onClick={() => setResult("1: JS works ✅")}
          className="p-2 bg-blue-500 text-white rounded font-bold"
        >
          1. JS Test
        </button>

        {/* Button 2: Can we fetch the API? */}
        <button
          type="button"
          onClick={async () => {
            setResult("2: fetching...");
            try {
              const r = await fetch("/api/auth/login", { method: "HEAD" });
              setResult(`2: API responded ${r.status} ✅`);
            } catch (e) {
              setResult(`2: FETCH FAILED ❌ ${e}`);
            }
          }}
          className="p-2 bg-green-500 text-white rounded font-bold"
        >
          2. API Test
        </button>

        {/* Button 3: Does form submit work? */}
        <button
          type="button"
          onClick={() => {
            setResult("3: submitting form...");
            const form = document.querySelector("form");
            if (!form) { setResult("3: NO FORM FOUND ❌"); return; }
            const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            const fa = btn?.getAttribute("formaction") || btn?.formAction;
            const fm = form.method;
            const act = form.action;
            setResult(`3: form.action="${act}" btn.formAction="${fa}" method="${fm}"`);
          }}
          className="p-2 bg-yellow-500 text-white rounded font-bold"
        >
          3. Form Check
        </button>

        {/* Button 4: Actual form submit via requestSubmit */}
        <button
          type="button"
          onClick={() => {
            setResult("4: requesting submit...");
            const form = document.querySelector("form");
            if (!form) { setResult("4: NO FORM ❌"); return; }
            try {
              form.requestSubmit();
              setResult("4: requestSubmit() called ✅");
            } catch (e) {
              setResult(`4: requestSubmit FAILED ❌ ${e}`);
            }
          }}
          className="p-2 bg-red-500 text-white rounded font-bold"
        >
          4. Submit Form
        </button>
      </div>

      {/* Result display */}
      <div className="p-2 bg-white rounded border border-blue-200 min-h-[40px] font-mono break-all">
        {result || "Tap a button..."}
      </div>
    </div>
  );
}
