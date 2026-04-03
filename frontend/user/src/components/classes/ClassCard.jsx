import { Link } from "react-router-dom";

export default function ClassCard({ item, isTeacher }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
          <p className="text-sm text-slate-500">ID: {item.id}</p>
          {isTeacher && (
            <p className="mt-1 text-sm text-slate-700">
              Join code:{" "}
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold">
                {item.join_code || "—"}
              </span>
            </p>
          )}
        </div>
        <Link
          to={`/classes/${item.id}`}
          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
