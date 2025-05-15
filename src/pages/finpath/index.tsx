import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Target, 
  Award, 
  User, 
  BookOpen,
  BarChart,
  Lightbulb,
  GraduationCap,
  Goal,
  MoveHorizontal
} from 'lucide-react';

export default function FinPathPage() {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const [activeTab, setActiveTab] = useState(section || 'overview');
  
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
  
  // Mock investor assessment
  const investorAssessment = {
    completed: 70,
    riskTolerance: "Moderate",
    investmentHorizon: "5-10 years",
    financialGoals: ["Retirement", "Home Purchase"],
    recommendedAssetAllocation: {
      equity: 60,
      fixedIncome: 30,
      alternatives: 5,
      cash: 5
    }
  };
  
  // Mock cards for the drag and drop section
  const [cards, setCards] = useState([
    {
      id: 'investor-assessment',
      title: 'Investor Assessment',
      description: 'Understand your risk profile and investment style',
      icon: <User className="h-5 w-5" />,
      link: '/finpath/investor-assessment'
    },
    {
      id: 'learning-path',
      title: 'Learning Path',
      description: 'Structured financial education journey',
      icon: <BookOpen className="h-5 w-5" />,
      link: '/finpath/learning-path'
    },
    {
      id: 'goal-setting',
      title: 'Goal Setting',
      description: 'Define and track your financial objectives',
      icon: <Target className="h-5 w-5" />,
      link: '/finpath/goal-setting'
    }
  ]);
  
  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(cards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setCards(items);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/finpath${value === 'overview' ? '' : `/${value}`}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your FinPath Journey</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Personalized learning path to improve your financial literacy and investing skills.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="investor-assessment">Investor Assessment</TabsTrigger>
              <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
              <TabsTrigger value="goal-setting">Goal Setting</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Your FinPath Dashboard</CardTitle>
                  <CardDescription>Drag and drop cards to customize your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="cards" direction="horizontal">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                          {cards.map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <Card className="h-full hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                                            {card.icon}
                                          </div>
                                          <CardTitle className="text-xl">{card.title}</CardTitle>
                                        </div>
                                        <MoveHorizontal className="h-5 w-5 text-slate-400" />
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <CardDescription className="mb-4">{card.description}</CardDescription>
                                      <Link to={card.link}>
                                        <Button className="w-full">
                                          Go to {card.title}
                                          <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                      </Link>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
              
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
            </TabsContent>
            
            {/* Investor Assessment Tab */}
            <TabsContent value="investor-assessment" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Investor Profile Assessment</CardTitle>
                      <CardDescription>Understand your investment style and risk tolerance</CardDescription>
                    </div>
                    <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Assessment Completion</h3>
                      <span className="text-sm font-medium">{investorAssessment.completed}%</span>
                    </div>
                    <Progress value={investorAssessment.completed} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h3 className="font-medium mb-2">Risk Tolerance</h3>
                        <div className="flex items-center">
                          <div className="p-2 bg-amber-100 rounded-full text-amber-800 mr-3">
                            <BarChart className="h-5 w-5" />
                          </div>
                          <span className="text-lg font-medium">{investorAssessment.riskTolerance}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h3 className="font-medium mb-2">Investment Horizon</h3>
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-full text-blue-800 mr-3">
                            <Clock className="h-5 w-5" />
                          </div>
                          <span className="text-lg font-medium">{investorAssessment.investmentHorizon}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h3 className="font-medium mb-2">Financial Goals</h3>
                        <div className="flex flex-wrap gap-2">
                          {investorAssessment.financialGoals.map((goal, index) => (
                            <div key={index} className="px-3 py-1 bg-fin-primary/10 text-fin-primary rounded-full text-sm">
                              {goal}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg h-full">
                        <h3 className="font-medium mb-4">Recommended Asset Allocation</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Equity</span>
                              <span className="font-medium">{investorAssessment.recommendedAssetAllocation.equity}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div 
                                className="h-2 bg-blue-500 rounded-full" 
                                style={{ width: `${investorAssessment.recommendedAssetAllocation.equity}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Fixed Income</span>
                              <span className="font-medium">{investorAssessment.recommendedAssetAllocation.fixedIncome}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div 
                                className="h-2 bg-green-500 rounded-full" 
                                style={{ width: `${investorAssessment.recommendedAssetAllocation.fixedIncome}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Alternatives</span>
                              <span className="font-medium">{investorAssessment.recommendedAssetAllocation.alternatives}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div 
                                className="h-2 bg-purple-500 rounded-full" 
                                style={{ width: `${investorAssessment.recommendedAssetAllocation.alternatives}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Cash</span>
                              <span className="font-medium">{investorAssessment.recommendedAssetAllocation.cash}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div 
                                className="h-2 bg-yellow-500 rounded-full" 
                                style={{ width: `${investorAssessment.recommendedAssetAllocation.cash}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    {investorAssessment.completed < 100 ? (
                      <Button>Continue Assessment</Button>
                    ) : (
                      <Button>Update Assessment</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Learning Path Tab */}
            <TabsContent value="learning-path" className="mt-6">
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Learning Path</CardTitle>
                      <CardDescription>Structured financial education journey</CardDescription>
                    </div>
                    <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {learningPath.map((path, index) => (
                      <div key={path.id} className="relative">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            path.status === 'completed' 
                              ? 'bg-green-100 text-green-600'
                              : path.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className="text-lg font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium mb-1">{path.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{path.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-500 mb-1">
                              {path.completed}/{path.modules} modules
                            </div>
                            <div className="flex items-center gap-2">
                              {path.status === 'completed' ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>
                              ) : path.status === 'in-progress' ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span>
                              ) : (
                                <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs">Locked</span>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant={path.status === 'locked' ? 'outline' : 'default'}
                                disabled={path.status === 'locked'}
                              >
                                {path.status === 'completed' ? 'Review' : path.status === 'in-progress' ? 'Continue' : 'Start'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
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
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">{lesson.duration}</span>
                          {!lesson.completed && (
                            <Button size="sm">Start</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Goal Setting Tab */}
            <TabsContent value="goal-setting" className="mt-6">
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Financial Goals</CardTitle>
                      <CardDescription>Define and track your financial objectives</CardDescription>
                    </div>
                    <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                      <Goal className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {goals.map(goal => (
                      <div key={goal.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                          <div>
                            <h3 className="text-lg font-medium">{goal.title}</h3>
                            <span className="text-sm text-slate-500">Due in {goal.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{goal.progress}% complete</span>
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    ))}
                    
                    <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                      <Lightbulb className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">Add a New Goal</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">
                        Define your financial objectives and track your progress
                      </p>
                      <Button>
                        Create New Goal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Goal Setting Tips</CardTitle>
                  <CardDescription>How to set effective financial goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="p-2 bg-green-100 rounded-full text-green-600 h-fit">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Be Specific</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          Define clear, specific goals. Instead of "save more money," try "save ₹5,000 per month for a house down payment."
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600 h-fit">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Make it Measurable</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          Include specific amounts and dates. This helps you track progress and stay motivated.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-100 rounded-full text-amber-600 h-fit">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Set Timeframes</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          Every goal should have a deadline. This creates urgency and helps you prioritize.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
