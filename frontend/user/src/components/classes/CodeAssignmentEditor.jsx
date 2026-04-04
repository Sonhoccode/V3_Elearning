import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { useTranslation } from "react-i18next";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

export default function CodeAssignmentEditor({
  initialCode,
  language,
  onSubmit,
  submitting,
}) {
  const [code, setCode] = useState(initialCode || "");
  const { t } = useTranslation("classes");

  useEffect(() => {
    setTimeout(() => {
      setCode(initialCode || "");
    }, 0);
  }, [initialCode]);

  const extensions = useMemo(() => {
    if (language === "python") return [python()];
    return [javascript({ jsx: true })];
  }, [language]);

  const handleSubmit = () => {
    if (onSubmit) onSubmit({ code });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-800">
          {t("titles.code_assignment", "Code Assignment")}
        </h4>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? t("buttons.submitting") : t("buttons.submit")}
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <CodeMirror
          value={code}
          height="320px"
          extensions={extensions}
          onChange={(value) => setCode(value)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: false,
          }}
        />
      </div>
    </div>
  );
}
