import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData } from "@/pages/CompanyAnalysis";
import { Button } from "@/components/ui/button";
import { BarChart4, LineChart } from "lucide-react";

interface CompanyChartsProps {
  companyData: CompanyData;
  currencySymbol: string;
}

type TimeFrame = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y" | "Max";

export default function CompanyCharts({ companyData, currencySymbol }: CompanyChartsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1M");
  
  const timeFrames: TimeFrame[] = ["1D", "1W", "1M", "6M", "1Y", "5Y", "Max"];
  
  // Add safety check to prevent accessing undefined properties
  if (!companyData) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>Loading company data...</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="h-[400px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <LineChart size={64} className="text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">Waiting for company data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Price Chart</CardTitle>
              <CardDescription>{companyData.name || 'Company'} ({companyData.ticker || 'Symbol'})</CardDescription>
            </div>
            
            <div className="flex gap-1">
              {timeFrames.map(tf => (
                <Button
                  key={tf}
                  variant={timeFrame === tf ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame(tf)}
                  className="h-8 px-3"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-[400px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <LineChart size={64} className="text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-slate-500 dark:text-slate-400">Interactive stock price chart would be displayed here</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {timeFrame} price movement for {companyData.ticker || 'Symbol'}
            </p>
          </div>
          
          <div className="mt-6 h-[100px] rounded-md border border-dashed p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <BarChart4 size={32} className="text-slate-300 dark:text-slate-600" />
            <p className="ml-2 text-sm text-slate-400 dark:text-slate-500">Volume chart would appear here</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
            <CardDescription>Revenue & profit growth trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <LineChart size={48} className="text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">Financial metrics chart would be displayed here</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Annual financial performance indicators
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Technical Indicators</CardTitle>
            <CardDescription>Moving averages & key indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <LineChart size={48} className="text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">Technical analysis chart would be displayed here</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Key technical indicators for trend analysis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 