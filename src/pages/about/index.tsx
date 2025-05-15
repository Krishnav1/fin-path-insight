import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Target, Lightbulb } from 'lucide-react';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Rahul Sharma',
      position: 'Founder & CEO',
      bio: 'Former investment banker with 10+ years experience in Indian financial markets',
      image: '/team/team1.jpg'
    },
    {
      name: 'Priya Patel',
      position: 'Chief Investment Strategist',
      bio: 'Certified Financial Analyst with expertise in equity research and portfolio management',
      image: '/team/team2.jpg'
    },
    {
      name: 'Vikram Mehta',
      position: 'Head of Technology',
      bio: 'Tech leader with background in fintech solutions and data analytics',
      image: '/team/team3.jpg'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-fin-primary to-fin-teal py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About FinPath Insight</h1>
              <p className="text-xl opacity-90 mb-8">
                One solution for every finance problem faced by retail investors in India.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mission Section */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  We're on a mission to democratize financial knowledge and tools for Indian retail investors, making complex financial decisions simpler and more accessible.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <Card className="text-center p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-fin-primary/10 rounded-full text-fin-primary">
                      <Lightbulb size={24} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Simplify Finance</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Breaking down complex financial concepts into easy-to-understand information for everyday investors.
                  </p>
                </Card>
                
                <Card className="text-center p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-fin-primary/10 rounded-full text-fin-primary">
                      <Target size={24} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Empower Decisions</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Providing tools and insights that help investors make informed decisions aligned with their goals.
                  </p>
                </Card>
                
                <Card className="text-center p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-fin-primary/10 rounded-full text-fin-primary">
                      <Users size={24} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Build Community</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Creating a supportive community of retail investors who learn and grow together.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Story Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-8 mb-12">
                <p className="text-lg mb-4">
                  FinPath Insight was born out of a simple observation: despite India's growing investor base, many retail investors struggle with limited access to quality financial tools and information.
                </p>
                <p className="text-lg mb-4">
                  Founded in 2023, we set out to create a comprehensive platform that addresses the unique challenges faced by Indian investors - from navigating complex market dynamics to building sustainable investment strategies aligned with personal goals.
                </p>
                <p className="text-lg">
                  Today, we're proud to serve a growing community of investors across India, providing them with AI-powered insights, educational resources, and analytical tools that were once available only to financial professionals.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10 text-center">Meet Our Team</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {teamMembers.map((member, index) => (
                  <div key={index} className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 mb-4 overflow-hidden">
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <Users size={40} />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-fin-primary font-medium mb-2">{member.position}</p>
                    <p className="text-slate-600 dark:text-slate-400">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-fin-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your Investment Journey?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of Indian investors who are using FinPath Insight to make smarter financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary">Get Started</Button>
              </Link>
              <Link to="/tools">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  Explore Tools
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
