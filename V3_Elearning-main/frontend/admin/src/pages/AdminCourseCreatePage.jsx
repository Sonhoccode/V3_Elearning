import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourses, fetchCategories } from "../api/AdminCoursesAPI";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function AdminCourseCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    order: 0,
    category: "",
    is_active: true
  });
  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCourses,
    onSuccess: (data) => {
       queryClient.invalidateQueries(["courses"]);
       navigate(`/courses/${data.id}`);
    },
    onError: (err) => {
        setError(err.message);
    }
  });

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!form.title || !form.slug || !form.category) {
          setError("Vui lòng điền đầy đủ các trường bắt buộc");
          return;
      }
      createMutation.mutate({
          ...form,
          category: parseInt(form.category)
      });
  };

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
      const title = e.target.value;
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      
      setForm(prev => ({ ...prev, title, slug }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Tạo Khóa Học Mới</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
                label="Tiêu đề khóa học *"
                value={form.title}
                onChange={handleTitleChange}
            />
            
            <Input 
                label="Slug (URL Friendly) *"
                value={form.slug}
                onChange={(e) => setForm({...form, slug: e.target.value})}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border border-[var(--color-border)]"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <Input 
                label="Mô tả"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                type="textarea" 
            />


            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    checked={form.is_active}
                    onChange={(e) => setForm({...form, is_active: e.target.checked})}
                    id="is_active"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Kích hoạt ngay</label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => navigate("/")} type="button">Hủy</Button>
                <Button type="submit" isLoading={createMutation.isPending}>Tạo khóa học</Button>
            </div>
        </form>
    </div>
  );
}
