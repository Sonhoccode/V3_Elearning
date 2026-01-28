import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getQuizDetail } from "../../api/quiz.api";

export default function QuizDetail() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { questionId: choiceId }
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        fetchQuizDetail();
    }, [id]);

    const fetchQuizDetail = async () => {
        try {
            const response = await getQuizDetail(id);
            setQuiz(response.data);
        } catch (err) {
            setError("Failed to load quiz details");
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId, choiceId) => {
        if (showResult) return;
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: choiceId,
        }));
    };

    const calculateScore = () => {
        let correctCount = 0;
        quiz.questions.forEach((q) => {
            const selectedChoiceId = userAnswers[q.id];
            // Find the selected choice in the question's choices
            const selectedChoice = q.choices.find(c => c.id === selectedChoiceId);
            if (selectedChoice && selectedChoice.is_correct) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setShowResult(true);
    };

    const handleNext = () => {
        if (currentIndex < quiz.questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading quiz...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!quiz) return <div className="p-8 text-center">Quiz not found</div>;

    const currentQuestion = quiz.questions[currentIndex];
    const totalQuestions = quiz.questions.length;
    const progress = ((currentIndex + 1) / totalQuestions) * 100;

    if (showResult) {
        return (
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Quiz Results</h1>
                <div className="text-center mb-8">
                    <div className="text-6xl font-bold mb-2 text-slate-800">{score} / {totalQuestions}</div>
                    <p className="text-xl text-slate-500">Your Score</p>
                </div>
                <div className="space-y-4">
                    {quiz.questions.map((q, idx) => {
                        const selectedChoiceId = userAnswers[q.id];
                        const correctChoice = q.choices.find(c => c.is_correct);
                        const isCorrect = selectedChoiceId === correctChoice?.id;

                        return (
                            <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <p className="font-medium mb-2">{idx + 1}. {q.text}</p>
                                <p className="text-sm">
                                    Your answer: <span className={isCorrect ? "font-bold text-green-700" : "font-bold text-red-700"}>
                                        {q.choices.find(c => c.id === selectedChoiceId)?.text || "Skipped"}
                                    </span>
                                </p>
                                {!isCorrect && (
                                    <p className="text-sm text-green-700 mt-1">
                                        Correct answer: <span className="font-bold">{correctChoice?.text}</span>
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className="mt-8 text-center">
                    <Link to="/quiz" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                        Back to Quiz List
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-6 mt-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">{quiz.title}</h1>
                <span className="text-slate-500 font-medium">Question {currentIndex + 1} of {totalQuestions}</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-8">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 min-h-[400px] flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-medium mb-6">{currentQuestion.text}</h2>
                    <div className="space-y-3">
                        {currentQuestion.choices.map((choice) => (
                            <button
                                key={choice.id}
                                onClick={() => handleOptionSelect(currentQuestion.id, choice.id)}
                                className={`w-full text-left p-4 rounded-lg border transition-all ${userAnswers[currentQuestion.id] === choice.id
                                        ? "border-blue-500 bg-blue-50 shadow-sm"
                                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${userAnswers[currentQuestion.id] === choice.id ? "border-blue-500" : "border-slate-300"
                                        }`}>
                                        {userAnswers[currentQuestion.id] === choice.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                    </div>
                                    <span>{choice.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`px-6 py-2 rounded-lg font-medium ${currentIndex === 0
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        Previous
                    </button>

                    {currentIndex === totalQuestions - 1 ? (
                        <button
                            onClick={calculateScore}
                            className="bg-green-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                        >
                            Submit Quiz
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
