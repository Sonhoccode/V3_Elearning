import { useDroppable } from "@dnd-kit/core";

const DayColumn = ({ day, items = [] }) => {
  const { setNodeRef } = useDroppable({ id: day });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-50 rounded-xl p-3 min-h-[160px]"
    >
      <h4 className="font-semibold mb-2 capitalize">{day}</h4>

      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white p-2 rounded shadow text-sm mb-2"
        >
          {item.title}
        </div>
      ))}
    </div>
  );
};

export default DayColumn;
