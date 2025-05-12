import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md dark:bg-slate-800">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome, {user?.username || user?.email?.split('@')[0] || 'User'}!
            </h2>
            
            <p className="text-gray-600 mb-4 dark:text-gray-300">
              This is your personal dashboard where you can view your financial information and track your progress.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-slate-50 p-4 rounded-lg dark:bg-slate-700">
                <h3 className="font-semibold mb-2">Your Portfolio</h3>
                <p className="text-gray-600 dark:text-gray-300">Portfolio items will appear here</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg dark:bg-slate-700">
                <h3 className="font-semibold mb-2">Recent Activity</h3>
                <p className="text-gray-600 dark:text-gray-300">Your recent activity will appear here</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg dark:bg-slate-700">
                <h3 className="font-semibold mb-2">Watchlist</h3>
                <p className="text-gray-600 dark:text-gray-300">Your watched stocks will appear here</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg dark:bg-slate-700">
                <h3 className="font-semibold mb-2">Learning Progress</h3>
                <p className="text-gray-600 dark:text-gray-300">Your learning progress will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 