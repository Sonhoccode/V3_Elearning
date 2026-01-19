import DayColumn from "./DayColumn";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const StudyCalendar = ({ plan }) => {
  return (
    <div className="flex-1 grid grid-cols-5 gap-4">
      {days.map(day => (
        <DayColumn
          key={day}
          day={day}
          items={plan[day]}
        />
      ))}
    </div>
  );
};

export default StudyCalendar;
