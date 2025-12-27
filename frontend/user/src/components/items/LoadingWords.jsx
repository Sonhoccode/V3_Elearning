import { useEffect, useRef, useState } from "react";

export default function LoadingWords({
  text = "Đợi chúng mình một chút nhé",
  typeSpeed = 50,    // tốc độ gõ
  deleteSpeed = 20,  // tốc độ xoá
  pauseMs = 900,     // dừng khi gõ xong
}) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState("typing"); // typing | pause | deleting
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (mode === "typing") {
      if (index < text.length) {
        timerRef.current = setTimeout(() => {
          setIndex((v) => v + 1);
        }, typeSpeed);
      } else {
        timerRef.current = setTimeout(() => {
          setMode("deleting");
        }, pauseMs);
      }
    }

    if (mode === "deleting") {
      if (index > 0) {
        timerRef.current = setTimeout(() => {
          setIndex((v) => v - 1);
        }, deleteSpeed);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode("typing");
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, mode, text, typeSpeed, deleteSpeed, pauseMs]);

  return (
    <span className="text-xl font-bold text-black mx-auto inline-flex items-center">
      {text.slice(0, index)}
      <span className="ml-1 animate-pulse">|</span>
    </span>
  );
}
