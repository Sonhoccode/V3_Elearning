import StudyItem from "./StudyItem";

const topics = [
  { id: "html", title: "HTML", color: "bg-blue-100" },
  { id: "css", title: "CSS", color: "bg-green-100" },
  { id: "js", title: "JavaScript", color: "bg-yellow-100" },
];

const StudySidebar = () => {
  return (
    <aside className="w-64 bg-white rounded-xl shadow p-4">
      <h3 className="font-bold mb-4">Select topic</h3>

      <div className="space-y-2">
        {topics.map(t => (
          <StudyItem key={t.id} item={t} />
        ))}
      </div>
    </aside>
  );
};

export default StudySidebar;
