import { useDraggable } from "@dnd-kit/core";

const StudyItem = ({ item }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 rounded cursor-grab ${item.color}`}
    >
      {item.title}
    </div>
  );
};

export default StudyItem;
