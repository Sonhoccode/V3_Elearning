import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";

import TeacherLayout from "../layouts/TeacherLayout.jsx";
import StudySidebar from "../component/study-plan/StudySidebar.jsx";
import StudyCalendar from "../component/study-plan/StudyCalendar.jsx";
import { TOPICS } from "../utils/studyPlanData.js";

const initialPlan = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

const StudyPlanPage = () => {
  const [plan, setPlan] = useState(initialPlan);
  const [activeItem, setActiveItem] = useState(null);

  // 🎯 SENSOR cho drag mượt
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // 🎯 HANDLE DROP
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const topic = TOPICS.find((t) => t.id === active.id);
    if (!topic) return;

    const day = over.id;

    setPlan((prev) => {
      const newPlan = { ...prev };

      // ❌ remove topic khỏi các ngày cũ
      Object.keys(newPlan).forEach((d) => {
        newPlan[d] = newPlan[d].filter((i) => i.id !== topic.id);
      });

      // ✅ add vào ngày mới
      newPlan[day] = [...newPlan[day], topic];
      return newPlan;
    });
  };

  return (
    <TeacherLayout>
      <h1 className="text-2xl font-bold mb-6">
        📅 Weekly Study Plan
      </h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          const item = TOPICS.find((t) => t.id === event.active.id);
          setActiveItem(item);
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveItem(null)}
      >
        {/* MAIN CONTENT */}
        <div className="flex gap-6">
          <StudySidebar />
          <StudyCalendar plan={plan} />
        </div>

        {/* 👁 DRAG PREVIEW */}
        <DragOverlay>
          {activeItem ? (
            <div className="bg-white shadow-lg rounded-lg px-4 py-2 text-sm">
              {activeItem.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </TeacherLayout>
  );
};

export default StudyPlanPage;

