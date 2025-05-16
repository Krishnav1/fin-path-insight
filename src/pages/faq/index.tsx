import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const faqCategories = [
    {
      id: 'general',
      title: 'General Questions',
      questions: [
        {
          id: 'what-is-finpath',
          question: 'What is FinPath Insight?',
          answer: 'FinPath Insight is a comprehensive financial platform designed specifically for Indian retail investors. We provide tools, analytics, and educational resources to help you make informed investment decisions, track your portfolio, and achieve your financial goals.'
        },
        {
          id: 'who-can-use',
          question: 'Who can use FinPath Insight?',
          answer: 'Our platform is designed for all types of retail investors in India, from beginners just starting their investment journey to experienced investors looking for advanced tools and analytics. We cater to individual investors, not institutional clients.'
        }
      ]
    },
    {
      id: 'tools',
      title: 'Tools & Features',
      questions: [
        {
          id: 'available-tools',
          question: 'What tools are available on FinPath Insight?',
          answer: 'We offer a wide range of tools including stock screener, portfolio analyzer, technical analysis tools, fundamental analysis, financial calculators, market movers, and our AI-powered FinGenie assistant. Each tool is designed to help you with different aspects of your investment journey.'
        },
        {
          id: 'data-source',
          question: 'Where does your market data come from?',
          answer: 'We source our data from reliable financial data providers with direct feeds from Indian exchanges (NSE/BSE) and global markets. Our data is refreshed regularly to ensure you have access to accurate and timely information for your investment decisions.'
        },
        {
          id: 'fingenie',
          question: 'What is FinGenie and how does it work?',
          answer: 'FinGenie is our AI-powered financial assistant that can answer your questions about investing, analyze your portfolio, provide market insights, and offer personalized recommendations. It uses advanced natural language processing to understand your queries and provide relevant, actionable information.'
        }
      ]
    },
    {
      id: 'pricing',
      title: 'Pricing & Plans',
      questions: [
        {
          id: 'free-plan',
          question: 'What is included in the free plan?',
          answer: 'Our free plan includes access to basic market data, limited stock screening capabilities, basic portfolio tracking, financial calculators, learning resources, and limited queries with our AI assistant. It  is designed to give you a solid foundation for your investment journey.'
        },
        {
          id: 'premium-plans',
          question: 'When will premium plans be available?',
          answer: 'We are currently developing our premium offerings with advanced features and expect to launch them in Q3 2025. Premium plans will include real-time data, advanced analytics, unlimited AI queries, portfolio optimization tools, and much more.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Security',
      questions: [
        {
          id: 'data-security',
          question: 'How do you protect my financial data?',
          answer: 'We take data security very seriously. All your data is encrypted both in transit and at rest. We use industry-standard security protocols, regular security audits, and follow best practices to ensure your financial information remains private and secure.'
        },
        {
          id: 'delete-account',
          question: 'How can I delete my account?',
          answer: 'You can delete your account at any time from your account settings. Once deleted, all your personal data will be permanently removed from our systems in accordance with our privacy policy and data retention guidelines.'
        }
      ]
    }
  ];
  
  // Filter FAQs based on search query
  const filteredFAQs = searchQuery.trim() === '' 
    ? faqCategories 
    : faqCategories.map(category => ({
        ...category,
        questions: category.questions.filter(q => 
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-fin-primary to-fin-teal py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
              <p className="text-xl opacity-90 mb-8">
                Find answers to common questions about FinPath Insight
              </p>
              
              <div className="relative max-w-xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Content Section */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((category) => (
                  <div key={category.id} className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                    <Accordion type="single" collapsible className="space-y-4">
                      {category.questions.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 pt-2 text-slate-600 dark:text-slate-400">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    We couldn't find any FAQs matching your search query.
                  </p>
                  <Button onClick={() => setSearchQuery('')} variant="outline">
                    Clear Search
                  </Button>
                </div>
              )}
              
              <div className="mt-16 bg-slate-50 dark:bg-slate-800 rounded-xl p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  If you couldn't find the answer you were looking for, our support team is here to help.
                </p>
                <Link to="/contact">
                  <Button>Contact Support</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
