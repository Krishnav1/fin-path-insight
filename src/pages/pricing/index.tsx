import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const pricingPlans = [
    {
      name: 'Free',
      description: 'Essential tools for beginners',
      price: '₹0',
      period: 'forever',
      features: [
        { name: 'Basic market data', included: true },
        { name: 'Limited stock screening', included: true },
        { name: 'Basic portfolio tracking', included: true },
        { name: 'Financial calculators', included: true },
        { name: 'Learning resources', included: true },
        { name: 'AI assistant (limited queries)', included: true },
        { name: 'Advanced technical analysis', included: false },
        { name: 'Real-time data', included: false },
        { name: 'Unlimited AI queries', included: false },
        { name: 'Portfolio optimization', included: false },
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline',
      popular: false,
    },
    {
      name: 'Pro',
      description: 'For active retail investors',
      price: '₹499',
      period: 'per month',
      features: [
        { name: 'Everything in Free plan', included: true },
        { name: 'Advanced stock screening', included: true },
        { name: 'Advanced technical analysis', included: true },
        { name: 'Real-time market data', included: true },
        { name: 'Unlimited AI queries', included: true },
        { name: 'Portfolio optimization', included: true },
        { name: 'Backtesting tools', included: true },
        { name: 'Email alerts', included: true },
        { name: 'Priority support', included: true },
        { name: 'API access', included: false },
      ],
      buttonText: 'Coming Soon',
      buttonVariant: 'default',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'For financial advisors & firms',
      price: 'Custom',
      period: 'contact for pricing',
      features: [
        { name: 'Everything in Pro plan', included: true },
        { name: 'White-label solutions', included: true },
        { name: 'API access', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom reporting', included: true },
        { name: 'Multi-user access', included: true },
        { name: 'Client management tools', included: true },
        { name: 'Advanced data analytics', included: true },
        { name: 'Custom development', included: true },
      ],
      buttonText: 'Contact Us',
      buttonVariant: 'outline',
      popular: false,
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
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
              <p className="text-xl opacity-90 mb-8">
                Choose the plan that's right for your investment journey
              </p>
              <div className="inline-block bg-white/20 p-1 rounded-full">
                <Badge variant="outline" className="bg-white text-fin-primary border-0 rounded-full px-4 py-1">
                  Free Plan Available
                </Badge>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Plans Section */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pricingPlans.map((plan, index) => (
                  <Card key={index} className={`relative ${plan.popular ? 'border-fin-primary shadow-lg' : ''}`}>
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Badge className="bg-fin-primary hover:bg-fin-primary text-white">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            {feature.included ? (
                              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-slate-300 dark:text-slate-600 mr-2 shrink-0" />
                            )}
                            <span className={feature.included ? '' : 'text-slate-500 dark:text-slate-400'}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {plan.name === 'Enterprise' ? (
                        <Link to="/contact" className="w-full">
                          <Button variant={plan.buttonVariant as any} className="w-full">
                            {plan.buttonText}
                          </Button>
                        </Link>
                      ) : plan.name === 'Free' ? (
                        <Link to="/signup" className="w-full">
                          <Button variant={plan.buttonVariant as any} className="w-full">
                            {plan.buttonText}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant={plan.buttonVariant as any} className="w-full" disabled>
                          {plan.buttonText}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Can I upgrade or downgrade my plan later?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Yes, you can upgrade to a paid plan at any time. When premium plans are available, you'll also be able to downgrade to a lower-tier plan at the end of your billing cycle.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Do you offer refunds?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>We offer a 14-day money-back guarantee for our premium plans. If you're not satisfied with our service, you can request a full refund within 14 days of your initial purchase.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">What payment methods do you accept?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>We accept all major credit cards, debit cards, UPI, and net banking for Indian customers. For enterprise plans, we also support invoice-based payments.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">When will premium plans be available?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>We're currently working on our premium offerings and expect to launch them in Q3 2025. Sign up for our newsletter to be notified when they become available.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-fin-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Investment Journey?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Create your free account today and get access to essential financial tools and resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary">Get Started for Free</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  Contact Sales
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
