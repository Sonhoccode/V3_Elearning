import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getQuizzes } from "../../api/quiz.api";

export default function QuizList() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const response = await getQuizzes();
            setQuizzes(response.data);
        } catch (err) {
            setError("Failed to load quizzes");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading quizzes...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-slate-800">Available Quizzes</h1>
            <div className="grid gap-6 md:grid-cols-2">
                {quizzes.map((quiz) => (
                    <div
                        key={quiz.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-slate-200"
                    >
                        {quiz.image && (
                            <img src={quiz.image} alt={quiz.title} className="w-full h-48 object-cover" />
                        )}
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
                            <p className="text-slate-600 mb-4 line-clamp-3">
                                {quiz.description || "No description available."}
                            </p>
                            <Link
                                to={`/quiz/${quiz.id}`}
                                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Start Quiz
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            {quizzes.length === 0 && (
                <p className="text-center text-slate-500">No quizzes available at the moment.</p>
            )}
        </div>
    );
}
