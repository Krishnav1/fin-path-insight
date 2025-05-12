
import { Link } from "react-router-dom";
import { 
  Search, 
  Calculator, 
  PieChart, 
  BookOpen, 
  HelpCircle, 
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  {
    id: "screener",
    name: "Stock Screener",
    description: "Find stocks based on your specific criteria and investment strategy.",
    icon: Search,
    link: "/tools/screener",
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "calculator",
    name: "Financial Calculators",
    description: "Plan your future with our retirement, mortgage, and investment calculators.",
    icon: Calculator,
    link: "/tools/calculator",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "portfolio",
    name: "Portfolio Tracker",
    description: "Monitor your investments and analyze performance in real-time.",
    icon: PieChart,
    link: "/portfolio",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "learn",
    name: "Learning Center",
    description: "Expand your knowledge with our library of articles, guides, and tutorials.",
    icon: BookOpen,
    link: "/learn",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "askfin",
    name: "Ask Fin AI",
    description: "Get answers to your financial questions from our AI assistant.",
    icon: HelpCircle,
    link: "/tools/ask-fin",
    color: "bg-purple-100 text-purple-600",
  },
];

export default function PopularTools() {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-fin-primary">Popular Financial Tools</h2>
        <Link to="/tools" className="text-sm font-medium text-fin-teal hover:underline flex items-center">
          View All Tools <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row space-y-0 gap-3 pb-2">
              <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center`}>
                <tool.icon size={20} />
              </div>
              <CardTitle className="text-lg font-semibold">{tool.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">{tool.description}</p>
              <Link to={tool.link}>
                <button className="text-fin-teal font-medium hover:text-fin-primary flex items-center text-sm">
                  Try It Now <ArrowRight size={14} className="ml-1" />
                </button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
