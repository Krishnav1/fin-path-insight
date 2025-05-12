
import { Link } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FinPathPreview() {
  return (
    <Card className="bg-gradient-to-r from-slate-50 to-white border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center text-fin-primary">
          <span className="text-fin-teal font-bold mr-1">Fin</span>Path
          <span className="bg-fin-accent/20 text-xs rounded-full px-2 py-0.5 ml-2 text-fin-primary">Personalized</span>
        </CardTitle>
        <CardDescription>
          Your customized journey to financial confidence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="rounded-full bg-fin-teal/10 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-fin-teal font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Investor Assessment</h3>
              <p className="text-slate-600 mb-3">
                Discover your investor profile based on your goals, risk tolerance, and knowledge level.
              </p>
              <Link to="/finpath/assessment">
                <Button variant="outline" className="border-fin-teal text-fin-teal hover:bg-fin-teal/10">
                  Take Assessment
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex-1">
              <div className="rounded-full bg-fin-teal/10 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-fin-teal font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Learning Plan</h3>
              <p className="text-slate-600 mb-3">
                Get a tailored learning path with curated resources based on your investor profile.
              </p>
              <Link to="/finpath/plan">
                <Button variant="outline" className="border-fin-teal text-fin-teal hover:bg-fin-teal/10">
                  View Learning Path
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex-1">
              <div className="rounded-full bg-fin-teal/10 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-fin-teal font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Goal Setting</h3>
              <p className="text-slate-600 mb-3">
                Set financial goals with clear milestones and track your progress over time.
              </p>
              <Link to="/finpath/goals">
                <Button variant="outline" className="border-fin-teal text-fin-teal hover:bg-fin-teal/10">
                  Set Your Goals
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-lg mb-3">Why FinPath Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-start">
                <div className="mt-1 mr-2 bg-fin-teal/10 rounded-full p-1">
                  <Check size={16} className="text-fin-teal" />
                </div>
                <span className="text-slate-700">Personalized to your needs</span>
              </div>
              <div className="flex items-start">
                <div className="mt-1 mr-2 bg-fin-teal/10 rounded-full p-1">
                  <Check size={16} className="text-fin-teal" />
                </div>
                <span className="text-slate-700">Structured learning approach</span>
              </div>
              <div className="flex items-start">
                <div className="mt-1 mr-2 bg-fin-teal/10 rounded-full p-1">
                  <Check size={16} className="text-fin-teal" />
                </div>
                <span className="text-slate-700">Expert-designed curriculum</span>
              </div>
              <div className="flex items-start">
                <div className="mt-1 mr-2 bg-fin-teal/10 rounded-full p-1">
                  <Check size={16} className="text-fin-teal" />
                </div>
                <span className="text-slate-700">Clear goal tracking</span>
              </div>
              <div className="flex items-start">
                <div className="mt-1 mr-2 bg-fin-teal/10 rounded-full p-1">
                  <Check size={16} className="text-fin-teal" />
                </div>
                <span className="text-slate-700">Adaptive to your progress</span>
              </div>
              <div className="flex items-start">
                <div className="mt-1 mr-2 bg-fin-teal/10 rounded-full p-1">
                  <Check size={16} className="text-fin-teal" />
                </div>
                <span className="text-slate-700">Practical exercises included</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link to="/finpath">
              <Button className="bg-fin-accent hover:bg-fin-accent-hover text-fin-dark">
                Explore FinPath
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
