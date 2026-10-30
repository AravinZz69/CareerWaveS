import React, { useState, useMemo } from 'react';
import { sample12Courses, DetailedCourse } from '../../../data/coursesData';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CoursePlayerModal } from '../../courses/CoursePlayerModal';
import { useAuth } from '../../../context/AuthContext';
import {
  Search,
  Star,
  Clock,
  PlayCircle,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CoursesPage: React.FC = () => {
  const { profile, user, workspace, saveUserCourseProgress } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  const courses: DetailedCourse[] = useMemo(() => {
    const progressMap = workspace.coursesProgress || {};
    return sample12Courses.map((c) => {
      const userProg = progressMap[c.id];
      return {
        ...c,
        enrolled: userProg !== undefined,
        progress: userProg ?? 0,
      };
    });
  }, [workspace.coursesProgress]);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  const categories = [
    'All',
    'Generative AI',
    'Full Stack',
    'Cloud & Systems',
    'FinTech',
    'Data Analytics',
    'Interview Prep',
  ];

  const filteredCourses = courses.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleEnroll = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveUserCourseProgress(courseId, 10);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6C3CE1', '#10B981'],
    });
  };

  const handleUpdateProgress = async (courseId: string, newProg: number) => {
    await saveUserCourseProgress(courseId, newProg);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-soft space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F0FF] text-[#6C3CE1] text-xs font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>12 Accredited Industry Labs & Certifications</span>
            </div>
            <h2 className="text-2xl font-bold font-serif-heading text-slate-900">
              Course Marketplace & Video Labs
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Complete lessons, watch embedded video lectures, pass quizzes, and earn downloadable verified PDF certificates.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search courses by topic, skill, or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-50">
          <span className="text-xs font-bold text-slate-500 mr-2">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#6C3CE1] text-white shadow-xs'
                  : 'bg-[#F4F0FF] text-[#6C3CE1] hover:bg-[#EAE2FD]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const badgeVariants: Record<string, 'bestseller' | 'popular' | 'trending' | 'green'> = {
            Bestseller: 'bestseller',
            Popular: 'popular',
            Trending: 'trending',
            'Highest Rated': 'green',
            New: 'popular',
          };

          return (
            <Card
              key={course.id}
              hover={true}
              onClick={() => setActiveCourseId(course.id)}
              className="flex flex-col h-full bg-white border border-purple-100 rounded-3xl overflow-hidden cursor-pointer group"
            >
              {/* Thumbnail Container */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Badge variant={badgeVariants[course.badge] || 'popular'} size="sm">
                    {course.badge}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-white text-[11px] font-semibold">
                  {course.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-700 truncate max-w-[180px]">
                      {course.instructor}
                    </span>
                    <span className="flex items-center text-amber-500 font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                      {course.rating}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[#6C3CE1] transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#6C3CE1]" /> {course.duration_hours} hrs
                    </span>
                    <span>•</span>
                    <span>{course.level}</span>
                    <span>•</span>
                    <span>{course.students_count.toLocaleString('en-IN')} learners</span>
                  </div>

                  {/* Active Progress Bar if enrolled by this user */}
                  {course.enrolled && (
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-600">Your Progress</span>
                        <span className="text-[#6C3CE1] font-bold">{course.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#6C3CE1] to-[#10B981] rounded-full transition-all duration-300"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div className="pt-2">
                  {course.enrolled ? (
                    <Button variant="secondary" size="sm" className="w-full text-xs font-bold">
                      <PlayCircle className="w-3.5 h-3.5" /> Continue Course
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleEnroll(course.id, e)}
                      className="w-full text-xs font-bold"
                    >
                      Start Course
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Course Player & Quiz Modal */}
      {activeCourse && (
        <CoursePlayerModal
          course={activeCourse}
          isOpen={Boolean(activeCourse)}
          onClose={() => setActiveCourseId(null)}
          onUpdateProgress={handleUpdateProgress}
          userName={profile?.full_name || user?.email?.split('@')[0] || 'Learner'}
        />
      )}
    </div>
  );
};
