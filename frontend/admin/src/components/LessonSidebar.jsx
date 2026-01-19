import { useEffect, useState, useMemo } from "react";
import { NavLink, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchLessons } from "../api/AdminLessonsAPI";

export default function LessonSidebar() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedLessonSlug = searchParams.get("lesson");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tree state
  const [expanded, setExpanded] = useState({});

  // 1. Fetch Lessons with React Query
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      const allLessons = await fetchLessons();
      // Client-side filter for now
      return allLessons
        .filter((l) => l.course === parseInt(courseId))
        .sort((a,b) => a.order - b.order);
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  // 2. Filter & Build Tree
  const treeData = useMemo(() => {
    if (!lessons) return [];

    // Filter first
    const filtered = lessons.filter(l => 
        l.slug.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Deduplicate logic
    const uniqueMap = new Map();
    filtered.forEach(l => {
        if (!uniqueMap.has(String(l.id))) {
            uniqueMap.set(String(l.id), { ...l, children: [] });
        }
    });

    // Build hierarchy
    const map = Object.fromEntries(Array.from(uniqueMap.entries()));
    const tree = [];

    uniqueMap.forEach(l => {
      // If parent exists in the MAP (meaning parent is also in filtered results)
      // If searching, we might lose parents. 
      // For now, if parent not found in filtered list, treat as root? 
      // Or strict tree? Let's treat as root if parent missing from current set to avoid hiding items.
      if (l.parent && map[String(l.parent)]) {
          map[String(l.parent)].children.push(l);
      } else {
        tree.push(l);
      }
    });

    return tree.sort((a,b) => a.order - b.order);
  }, [lessons, searchTerm]);

  // 3. Auto-expand (Accordion Style)
  useEffect(() => {
    if (selectedLessonSlug && lessons.length > 0) {
        const activeLesson = lessons.find(l => l.slug === selectedLessonSlug);
        
        setTimeout(() => {
            if (activeLesson && activeLesson.parent) {
                const parentId = String(activeLesson.parent);
                setExpanded({ [parentId]: true });
            } else {
                setExpanded({});
            }
        }, 0);
    }
  }, [selectedLessonSlug, lessons]);

  const toggleExpand = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectLesson = (slug) => {
      navigate(`/courses/${courseId}?lesson=${slug}`);
  };

  const renderItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !!expanded[String(item.id)];
    const isSelected = selectedLessonSlug === item.slug;
    
    // Choose the best display title
    // If title is missing/empty, use slug.
    const displayTitle = item.title ? item.title : item.slug;

    if (hasChildren) {
        // Parent / Group
        return (
            <div key={item.id} className="mb-1">
                <div className={`flex items-center gap-2 pr-2 rounded-lg transition-colors hover:bg-gray-50 py-1`}>
                    {/* Expand Toggle */}
                    <button
                        onClick={(e) => toggleExpand(e, String(item.id))}
                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0"
                        style={{ marginLeft: `${level * 16}px` }}
                    >
                         <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Title (Select to Edit) */}
                    <div
                        onClick={() => handleSelectLesson(item.slug)}
                        className={`
                            flex-1 min-w-0 cursor-pointer select-none py-1
                            ${isSelected ? "text-teal-700 font-semibold" : "text-gray-700 hover:text-teal-600 font-medium"}
                        `}
                    >
                         <div className="flex items-baseline gap-2">
                             <span className="truncate">{displayTitle}</span>
                             <span className="shrink-0 text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                ID: {item.id}
                             </span>
                         </div>
                    </div>
                </div>

                {/* Children */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                    {item.children.map(child => renderItem(child, level + 1))}
                </div>
            </div>
        );
    }

    // Leaf (Lesson)
    return (
        <div 
            key={item.id}
            onClick={() => handleSelectLesson(item.slug)}
            className={`
                p-2 pr-4 rounded-lg mb-0.5 transition-all flex items-start gap-3 cursor-pointer select-none
                ${isSelected
                    ? "bg-teal-50 text-teal-700 border-r-4 border-r-teal-500" // Moved border to right or left? User side has left. Let's keep consistency but make it neat.
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-r-transparent"
                }
            `}
            style={{ paddingLeft: `${(level * 16) + 40}px` }}
        >
             <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${isSelected ? "bg-teal-500" : "bg-gray-300"}`}></span>
             <div className="flex-1 overflow-hidden">
                <div className={`text-sm ${isSelected ? "font-medium" : ""}`}>{displayTitle}</div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1 py-0.5 rounded border border-gray-200">
                        ID: {item.id}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">
                        {item.slug}
                    </span>
                </div>
             </div>
        </div>
    );
  };

  if (!courseId) return null;

  return (
    <aside className="lesson-sidebar w-80 h-screen sticky top-0 border-r border-gray-200 flex flex-col z-40 bg-white shadow-sm">
      {/* Header */}
      <div className="p-7 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
         <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            Nội dung khóa học
        </h3>
        
        {/* Search */}
        <div className="relative mt-4">
            <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none bg-white/50 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
             <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
        <p className="text-sm text-gray-500 mt-2">{lessons.length} bài học</p>
      </div>

       <div className="p-4 border-b border-gray-100">
        <button
          onClick={() => navigate(`/courses/${courseId}?lesson=new`)}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all flex items-center justify-center gap-2"
        >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
           <span>Thêm bài học mới</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-200">
        {isLoading ? (
             <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse"/>)}
             </div>
        ) : lessons.length === 0 ? (
             <div className="p-8 text-center text-gray-400 text-sm">Chưa có bài học nào</div>
        ) : (
            <div className="space-y-0.5">
                {treeData.map(root => renderItem(root))}
                {treeData.length === 0 && searchTerm && (
                    <div className="p-4 text-center text-gray-500 text-sm italic">
                        Không tìm thấy kết quả
                    </div>
                )}
            </div>
        )}
      </div>
    </aside>
  );
}
