import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, CheckCircle, ExternalLink } from 'lucide-react';
import { dataStore } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Course {
  course_id: string;
  title: string;
  syllabus_url?: string;
  created_at: string;
}

interface CourseWithProgress extends Course {
  enrolled: boolean;
  progress?: {
    status: string;
    passed_at?: string;
  };
  modules?: Array<{
    module_id: string;
    is_checkpoint: boolean;
    passing_rule_json: any;
  }>;
}

export function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const availableCourses = await dataStore.listAvailableCourses();
        const userProgress = user ? await dataStore.listProgressByWallet(user.wallet) : [];

        const coursesWithProgress = await Promise.all(
          availableCourses.map(async (course) => {
            const courseDetails = await dataStore.getCourseWithModules(course.course_id);
            const progress = userProgress.find(p => p.course_id === course.course_id);
            
            return {
              ...course,
              enrolled: !!progress,
              progress: progress ? {
                status: progress.status,
                passed_at: progress.passed_at || undefined
              } : undefined,
              modules: courseDetails?.modules || []
            };
          })
        );

        setCourses(coursesWithProgress);
      } catch (error) {
        console.error('Failed to load courses:', error);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user]);

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast.error('Please sign in to enroll');
      return;
    }

    setEnrolling(courseId);
    try {
      // Find the course and its first checkpoint module
      const course = courses.find(c => c.course_id === courseId);
      const checkpointModule = course?.modules?.find(m => m.is_checkpoint);
      
      if (!checkpointModule) {
        toast.error('No checkpoint module found for this course');
        return;
      }

      await dataStore.enrollInCourse(user.wallet, courseId, checkpointModule.module_id);
      
      // Update local state
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.course_id === courseId
            ? {
                ...course,
                enrolled: true,
                progress: { status: 'NOT_STARTED' }
              }
            : course
        )
      );

      toast.success('Successfully enrolled in course!');
    } catch (error) {
      console.error('Failed to enroll:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const getStatusBadge = (status?: string, passedAt?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      'NOT_STARTED': { label: 'Not Started', variant: 'secondary' as const },
      'IN_PROGRESS': { label: 'In Progress', variant: 'default' as const },
      'READY': { label: 'Ready', variant: 'default' as const },
      'BENEFIT_CLAIMED': { label: 'Completed', variant: 'default' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {passedAt && <CheckCircle className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
        <p className="text-muted-foreground">
          There are currently no courses available. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Available Courses</h2>
        <p className="text-muted-foreground">
          Explore and enroll in courses to start your learning journey
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.course_id} className="gradient-card shadow-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  {course.title}
                </CardTitle>
                {course.progress && getStatusBadge(course.progress.status, course.progress.passed_at)}
              </div>
              <div className="text-sm text-muted-foreground">
                Course ID: {course.course_id}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.modules?.length || 0} module{(course.modules?.length || 0) !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.modules?.filter(m => m.is_checkpoint).length || 0} checkpoint{(course.modules?.filter(m => m.is_checkpoint).length || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {course.modules && course.modules.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Modules:</div>
                  <div className="space-y-1">
                    {course.modules.map((module) => (
                      <div key={module.module_id} className="flex items-center justify-between text-sm">
                        <span>{module.module_id}</span>
                        {module.is_checkpoint && (
                          <Badge variant="outline" className="text-xs">
                            Checkpoint
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {course.enrolled ? (
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    disabled
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enrolled
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => handleEnroll(course.course_id)}
                    disabled={enrolling === course.course_id || !user}
                  >
                    {enrolling === course.course_id ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                )}
                
                {course.syllabus_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a 
                      href={course.syllabus_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="View Syllabus"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {!user && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Sign in to enroll in courses
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}