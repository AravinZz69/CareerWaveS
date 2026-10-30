import React, { useState } from 'react';
import { DetailedCourse, CourseLesson, CourseQuiz } from '../../data/coursesData';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  X,
  PlayCircle,
  CheckCircle2,
  HelpCircle,
  Award,
  Download,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoursePlayerModalProps {
  course: DetailedCourse;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProgress: (courseId: string, newProgress: number) => void;
  userName: string;
}

export const CoursePlayerModal: React.FC<CoursePlayerModalProps> = ({
  course,
  isOpen,
  onClose,
  onUpdateProgress,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz' | 'certificate'>('lessons');
  const [activeLessonId, setActiveLessonId] = useState<string>(
    course.modules[0]?.lessons[0]?.id || ''
  );

  // Lesson completion tracking
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(['l1', 'l2', 'l3']);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  if (!isOpen) return null;

  // Flatten all lessons
  const allLessons: CourseLesson[] = course.modules.flatMap((m) => m.lessons);
  const currentLesson =
    allLessons.find((l) => l.id === activeLessonId) || allLessons[0];

  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  const toggleLessonComplete = (lessonId: string) => {
    let next: string[];
    if (completedLessonIds.includes(lessonId)) {
      next = completedLessonIds.filter((id) => id !== lessonId);
    } else {
      next = [...completedLessonIds, lessonId];
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#6C3CE1', '#10B981'],
      });
    }
    setCompletedLessonIds(next);
    const newProg = Math.min(100, Math.round((next.length / totalLessons) * 100));
    onUpdateProgress(course.id, newProg);

    if (newProg >= 100) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#FFB547', '#10B981', '#6C3CE1'],
      });
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionIndex });
  };

  const handleSubmitQuiz = () => {
    let correct = 0;
    course.quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    const scorePct = Math.round((correct / course.quiz.questions.length) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    if (scorePct >= course.quiz.passingScore) {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#10B981', '#FFB547', '#6C3CE1'],
      });
    }
  };

  const certificateNumber = `CW-CERT-${course.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrintCertificate = () => {
    window.print();
  };

  const isEligibleForCertificate = progressPercent >= 80 || (quizScore !== null && quizScore >= course.quiz.passingScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-[#FAF8FF]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#6C3CE1] text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {course.title}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Instructor: {course.instructor} ({course.instructorTitle})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Progress Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-100 text-xs">
              <span className="font-bold text-[#6C3CE1]">{progressPercent}% Completed</span>
              <div className="w-16 h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C3CE1] to-[#10B981] rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-purple-100 px-6 bg-white gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'lessons'
                ? 'border-[#6C3CE1] text-[#6C3CE1]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Lessons ({completedCount}/{totalLessons})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'border-[#6C3CE1] text-[#6C3CE1]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Certification Quiz
            {quizScore !== null && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${quizScore >= course.quiz.passingScore ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {quizScore}%
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'certificate'
                ? 'border-[#6C3CE1] text-[#6C3CE1]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" /> Verified Certificate
            {isEligibleForCertificate && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          
          {/* TAB 1: LESSONS & VIDEO PLAYER */}
          {activeTab === 'lessons' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              
              {/* Left Column (8 cols): Active Lesson Viewer & Embedded Video */}
              <div className="lg:col-span-8 space-y-4">
                {currentLesson ? (
                  <Card className="p-6 bg-white border border-purple-100 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-50">
                      <div>
                        <span className="text-xs font-bold text-[#6C3CE1] uppercase tracking-wider">
                          Active Lesson
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                          {currentLesson.title}
                        </h3>
                      </div>

                      <Button
                        variant={completedLessonIds.includes(currentLesson.id) ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => toggleLessonComplete(currentLesson.id)}
                        className="text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {completedLessonIds.includes(currentLesson.id)
                          ? 'Completed ✓'
                          : 'Mark as Finished'}
                      </Button>
                    </div>

                    {/* Embedded Video Player if link exists */}
                    {currentLesson.videoUrl && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                        <iframe
                          src={currentLesson.videoUrl}
                          title={currentLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    )}

                    {/* Lesson Text Documentation Content */}
                    <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                      <p className="font-bold text-slate-900 text-sm">Key Concepts & Implementation Guide:</p>
                      <p>{currentLesson.textContent}</p>
                      <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Duration: {currentLesson.duration}</span>
                        <span className="text-[#6C3CE1] font-semibold">Included in Certification Rubric</span>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </div>

              {/* Right Column (4 cols): Course Syllabus Curriculum */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="p-5 bg-white border border-purple-100 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Course Curriculum
                  </h4>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {course.modules.map((mod) => (
                      <div key={mod.id} className="space-y-2">
                        <p className="text-xs font-bold text-slate-700">{mod.title}</p>
                        <div className="space-y-1.5">
                          {mod.lessons.map((lesson) => {
                            const isSelected = lesson.id === activeLessonId;
                            const isDone = completedLessonIds.includes(lesson.id);

                            return (
                              <div
                                key={lesson.id}
                                onClick={() => setActiveLessonId(lesson.id)}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                                  isSelected
                                    ? 'bg-[#F4F0FF] border-[#6C3CE1] text-[#6C3CE1] font-bold shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-purple-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLessonComplete(lesson.id);
                                    }}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                      isDone
                                        ? 'bg-[#10B981] text-white'
                                        : 'border border-slate-300'
                                    }`}
                                  >
                                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="truncate">{lesson.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {lesson.duration}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

            </div>
          )}

          {/* TAB 2: CERTIFICATION QUIZ */}
          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="p-6 bg-white border border-purple-100 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-purple-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{course.quiz.title}</h3>
                    <p className="text-xs text-slate-500">
                      Passing score: {course.quiz.passingScore}% • Auto-graded with instant explanations
                    </p>
                  </div>
                  {quizScore !== null && (
                    <Badge variant={quizScore >= course.quiz.passingScore ? 'green' : 'coral'} size="md">
                      Score: {quizScore}% {quizScore >= course.quiz.passingScore ? '(Passed)' : '(Retake)'}
                    </Badge>
                  )}
                </div>

                <div className="space-y-6">
                  {course.quiz.questions.map((q, idx) => {
                    const selectedIdx = selectedAnswers[q.id];
                    const isAnswered = selectedIdx !== undefined;

                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 space-y-3">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          Question {idx + 1}: {q.question}
                        </p>

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            let optionClass = 'bg-white border-slate-200 text-slate-700 hover:border-purple-300';

                            if (selectedIdx === optIdx) {
                              optionClass = 'bg-[#F4F0FF] border-[#6C3CE1] text-[#6C3CE1] font-bold ring-1 ring-[#6C3CE1]';
                            }

                            if (quizSubmitted) {
                              if (optIdx === q.correctIndex) {
                                optionClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                              } else if (selectedIdx === optIdx && optIdx !== q.correctIndex) {
                                optionClass = 'bg-red-50 border-red-500 text-red-900 font-bold';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectOption(q.id, optIdx)}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${optionClass}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.correctIndex && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="p-3 rounded-xl bg-white border border-purple-100 text-xs text-slate-600">
                            <strong className="text-slate-800">Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-purple-50 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAnswers({});
                      setQuizSubmitted(false);
                      setQuizScore(null);
                    }}
                    className="text-xs"
                  >
                    Reset Answers
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitQuiz}
                    disabled={quizSubmitted && quizScore !== null && quizScore >= course.quiz.passingScore}
                    className="text-xs font-bold"
                  >
                    Submit & Grade Assessment
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: DOWNLOADABLE PDF CERTIFICATE */}
          {activeTab === 'certificate' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {!isEligibleForCertificate ? (
                <Card className="p-12 text-center bg-white border border-purple-100 space-y-4">
                  <Award className="w-12 h-12 text-purple-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-800">Certificate Locked</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Complete at least 80% of the course modules or score 75%+ on the Certification Exam to unlock and issue your verified credential.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('quiz')}
                    className="text-xs font-bold"
                  >
                    Take Certification Quiz
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified & Issued by CareerWave AI Institute
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handlePrintCertificate}
                      className="text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download / Print PDF Certificate
                    </Button>
                  </div>

                  {/* Printable Formal Certificate Canvas */}
                  <div
                    id="verified-certificate"
                    className="relative bg-white text-slate-900 p-10 sm:p-14 rounded-3xl border-8 border-double border-[#6C3CE1]/30 shadow-2xl text-center space-y-6 max-w-3xl mx-auto print:border-4 print:shadow-none print:w-full"
                  >
                    {/* Corner Decorative Ornaments */}
                    <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#6C3CE1]" />
                    <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#6C3CE1]" />
                    <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#6C3CE1]" />
                    <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#6C3CE1]" />

                    {/* Logo & Seal */}
                    <div className="inline-flex items-center gap-2 mb-1">
                      <div className="w-12 h-12 rounded-2xl bg-[#6C3CE1] text-white flex items-center justify-center font-bold shadow-md">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#6C3CE1]">
                        CareerWave Institute of Advanced AI
                      </p>
                      <h1 className="text-3xl sm:text-4xl font-serif-heading font-extrabold text-slate-900 mt-2">
                        Certificate of Mastery
                      </h1>
                    </div>

                    <p className="text-xs text-slate-500 italic">This is proudly presented to</p>

                    <p className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#6C3CE1] tracking-wide border-b border-purple-200 pb-2 max-w-md mx-auto">
                      {userName || 'Alex Vance'}
                    </p>

                    <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                      for successfully fulfilling all rigorous laboratory curriculum, algorithm implementations, and passing the comprehensive examination for
                    </p>

                    <h3 className="text-xl font-bold text-slate-900 max-w-xl mx-auto">
                      {course.title}
                    </h3>

                    {/* Footer Signature & Metadata */}
                    <div className="pt-8 border-t border-purple-100 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Date of Issue</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold mb-1">
                          ✓
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                          {certificateNumber}
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-800 font-serif italic text-sm">{course.instructor}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Authorized Instructor</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
