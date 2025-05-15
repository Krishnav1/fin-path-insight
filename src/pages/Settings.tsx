import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MarketToggle } from "@/components/ui/market-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Fin Insight looks for you</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Choose between light, dark, or system theme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Preferences</CardTitle>
                <CardDescription>Customize your market viewing preferences</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default-market">Default Market</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Choose which market to view by default
                    </p>
                  </div>
                  <MarketToggle />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Receive email updates about your portfolio
                    </p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="market-alerts">Market Alerts</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Get notified about significant market changes
                    </p>
                  </div>
                  <Switch id="market-alerts" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="price-alerts">Price Alerts</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Receive alerts about price changes for your watchlist
                    </p>
                  </div>
                  <Switch id="price-alerts" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Save Notification Settings</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account's security</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Enable Two-Factor Authentication</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 