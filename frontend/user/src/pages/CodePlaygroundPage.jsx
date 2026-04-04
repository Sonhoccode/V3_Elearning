import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

const DEFAULT_HTML = `<div class="card">
  <h1>Hello Playground</h1>
  <p>Edit HTML/CSS/JS and click Run.</p>
  <button id="btn">Click me</button>
</div>`;

const DEFAULT_CSS = `body {
  font-family: system-ui, sans-serif;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
}

.card {
  max-width: 520px;
  margin: 0 auto;
  padding: 20px 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}`;

const DEFAULT_JS = `const btn = document.getElementById("btn");
btn?.addEventListener("click", () => {
  alert("Hello from JS!");
});`;

import { useTranslation } from "react-i18next";

export default function CodePlaygroundPage() {
  const { t } = useTranslation("common");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [activeTab, setActiveTab] = useState("html");
  const [autoRun, setAutoRun] = useState(true);
  const [srcDoc, setSrcDoc] = useState("");
  const htmlExtensions = useMemo(() => [htmlLang()], []);
  const cssExtensions = useMemo(() => [cssLang()], []);
  const jsExtensions = useMemo(() => [javascript({ jsx: true })], []);

  const buildDocument = (htmlText, cssText, jsText) => {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${cssText}</style>
  </head>
  <body>
    ${htmlText}
    <script>
      ${jsText}
    </script>
  </body>
</html>`;
  };

  const documentText = useMemo(() => {
    return buildDocument(html, css, js);
  }, [html, css, js]);

  useEffect(() => {
    if (!autoRun) return;
    const timer = setTimeout(() => {
      setSrcDoc(documentText);
    }, 400);
    return () => clearTimeout(timer);
  }, [documentText, autoRun]);

  const handleRun = () => {
    setSrcDoc(documentText);
  };

  const handleReset = () => {
    setHtml("");
    setCss("");
    setJs("");
    setSrcDoc("");
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t("playground.title", "Editor code")}</h1>
            <p className="text-slate-600">
              {t("playground.desc", "Thực hành HTML/CSS/JS trực tiếp trong trình duyệt.")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                className="h-4 w-4 accent-teal-600"
              />
              {t("playground.auto_run", "Auto run")}
            </label>
            <button
              type="button"
              onClick={handleRun}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {t("playground.run", "Run")}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {t("playground.reset", "Reset")}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10 lg:h-[calc(100vh-14rem)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3 lg:flex lg:h-full lg:flex-col">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">
              {t("playground.editor", "Editor")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "html", label: "HTML" },
                { id: "css", label: "CSS" },
                { id: "js", label: "JavaScript" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex-1">
              {activeTab === "html" && (
                <div className="flex h-full flex-col">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    HTML
                  </label>
                  <div className="h-[360px] w-full flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 lg:h-full">
                    <CodeMirror
                      value={html}
                      height="100%"
                      extensions={htmlExtensions}
                      onChange={(value) => setHtml(value)}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        foldGutter: false,
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "css" && (
                <div className="flex h-full flex-col">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    CSS
                  </label>
                  <div className="h-[360px] w-full flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 lg:h-full">
                    <CodeMirror
                      value={css}
                      height="100%"
                      extensions={cssExtensions}
                      onChange={(value) => setCss(value)}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        foldGutter: false,
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "js" && (
                <div className="flex h-full flex-col">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    JavaScript
                  </label>
                  <div className="h-[360px] w-full flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 lg:h-full">
                    <CodeMirror
                      value={js}
                      height="100%"
                      extensions={jsExtensions}
                      onChange={(value) => setJs(value)}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        foldGutter: false,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-7 lg:flex lg:h-full lg:flex-col">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">
              {t("playground.preview", "Preview")}
            </h2>
            <div className="h-[420px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:h-full">
              <iframe
                title="Preview"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
                className="h-full w-full"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
