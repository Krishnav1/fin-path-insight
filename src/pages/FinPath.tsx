import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowRight, CheckCircle, Clock, Target, Award, User, BookOpen } from "lucide-react";

export default function FinPath() {
  const { user } = useAuth();
  
  // Mock data for learning path
  const learningPath = [
    {
      id: 1,
      title: "Financial Basics",
      progress: 100,
      modules: 5,
      completed: 5,
      description: "Fundamental concepts of personal finance and investing",
      status: "completed"
    },
    {
      id: 2,
      title: "Investment Principles",
      progress: 60,
      modules: 5,
      completed: 3,
      description: "Core principles of investment decision making",
      status: "in-progress"
    },
    {
      id: 3,
      title: "Market Analysis",
      progress: 0,
      modules: 4,
      completed: 0,
      description: "Understanding market mechanics and analysis methods",
      status: "locked"
    },
    {
      id: 4,
      title: "Portfolio Management",
      progress: 0,
      modules: 6,
      completed: 0,
      description: "Building and managing an effective investment portfolio",
      status: "locked"
    }
  ];
  
  // Mock data for current module
  const currentModule = {
    title: "Investment Principles",
    lessons: [
      { id: 1, title: "Risk and Return Relationships", completed: true, duration: "20 min" },
      { id: 2, title: "Asset Classes Overview", completed: true, duration: "25 min" },
      { id: 3, title: "Diversification Strategies", completed: true, duration: "18 min" },
      { id: 4, title: "Modern Portfolio Theory", completed: false, duration: "30 min" },
      { id: 5, title: "Factor Investing", completed: false, duration: "22 min" }
    ]
  };
  
  // Mock goals
  const goals = [
    {
      id: 1,
      title: "Complete Investment Principles",
      progress: 60,
      dueDate: "2 weeks"
    },
    {
      id: 2,
      title: "Create first investment portfolio",
      progress: 25,
      dueDate: "1 month"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your FinPath Journey</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Personalized learning path to improve your financial literacy and investing skills.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                  <CardDescription>Your personalized financial education journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {learningPath.map(path => (
                      <div key={path.id} className="relative">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              path.status === 'completed' 
                                ? 'bg-green-100 text-green-600'
                                : path.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {path.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : path.status === 'in-progress' ? (
                                <Clock className="h-5 w-5" />
                              ) : (
                                <BookOpen className="h-5 w-5" />
                              )}
                            </div>
                            <h3 className="font-medium">{path.title}</h3>
                          </div>
                          <span className="text-sm text-slate-500">
                            {path.completed}/{path.modules} modules
                          </span>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                        <p className="text-sm text-slate-500 mt-1">{path.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Learning Goals</CardTitle>
                    <Target className="h-5 w-5 text-fin-primary" />
                  </div>
                  <CardDescription>Track your learning objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goals.map(goal => (
                      <div key={goal.id} className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{goal.title}</h3>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Due in {goal.dueDate}
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-2 mb-1" />
                        <span className="text-xs text-slate-500">{goal.progress}% complete</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Add New Goal</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </div>
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-semibold mb-4">{currentModule.title}</h3>
              <div className="space-y-3">
                {currentModule.lessons.map(lesson => (
                  <div key={lesson.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {lesson.completed ? (
                        <div className="text-green-500">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                      <span className={lesson.completed ? "line-through text-slate-500" : ""}>
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{lesson.duration}</span>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Continue to Next Lesson</Button>
            </CardFooter>
          </Card>
          
          <div className="flex justify-between items-center bg-fin-primary/10 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <User className="h-5 w-5 text-fin-primary" />
              </div>
              <div>
                <h3 className="font-medium">Need help with your learning journey?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Get personalized guidance from our financial education experts</p>
              </div>
            </div>
            <Button>Schedule Consultation</Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 