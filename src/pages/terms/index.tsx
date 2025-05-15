import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  const lastUpdated = "May 15, 2025";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-fin-primary to-fin-teal py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-lg opacity-90">
                Last Updated: {lastUpdated}
              </p>
            </div>
          </div>
        </section>
        
        {/* Terms Content */}
        <section className="py-12 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="p-8">
                <CardContent className="p-0 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                    <p className="mb-4">
                      Welcome to FinPath Insight. These Terms of Service ("Terms") govern your access to and use of the FinPath Insight website, mobile applications, and services (collectively, the "Services").
                    </p>
                    <p className="mb-4">
                      By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
                    </p>
                    <p>
                      We may modify these Terms at any time. If we make changes, we will provide notice of such changes, such as by sending an email notification, providing notice through the Services, or updating the "Last Updated" date at the beginning of these Terms. Your continued use of the Services will confirm your acceptance of the revised Terms.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">2. Using Our Services</h2>
                    <h3 className="text-xl font-semibold mb-2">2.1 Account Registration</h3>
                    <p className="mb-4">
                      To access certain features of the Services, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself and to update such information as necessary.
                    </p>
                    <p className="mb-4">
                      You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                    </p>
                    
                    <h3 className="text-xl font-semibold mb-2">2.2 Age Restrictions</h3>
                    <p className="mb-4">
                      The Services are intended for users who are 18 years of age or older. By using the Services, you represent and warrant that you are at least 18 years old.
                    </p>
                    
                    <h3 className="text-xl font-semibold mb-2">2.3 Prohibited Conduct</h3>
                    <p className="mb-4">
                      You agree not to:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Use the Services in any manner that could interfere with, disrupt, negatively affect, or inhibit other users from fully enjoying the Services</li>
                      <li>Use the Services for any illegal or unauthorized purpose</li>
                      <li>Attempt to circumvent any content-filtering techniques, security measures, or access controls that we employ</li>
                      <li>Use any automated means or interface not provided by us to access the Services or to extract data</li>
                      <li>Attempt to decipher, decompile, disassemble, or reverse engineer any of the software used to provide the Services</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">3. Financial Information and Investment Decisions</h2>
                    <p className="mb-4">
                      The information provided through our Services is for informational and educational purposes only. It is not intended to be and does not constitute financial advice, investment advice, trading advice, or any other type of advice.
                    </p>
                    <p className="mb-4">
                      You should not make any investment decision without conducting your own research and consulting with a qualified financial advisor. The information we provide is not personalized to your individual circumstances.
                    </p>
                    <p className="mb-4">
                      Investing in financial markets involves risk, including the possible loss of principal. Past performance is not indicative of future results.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">4. Data and Privacy</h2>
                    <p className="mb-4">
                      Our <Link to="/privacy" className="text-fin-primary hover:underline">Privacy Policy</Link> describes how we collect, use, and share information about you when you use our Services. By using our Services, you agree to the collection, use, and sharing of your information as described in our Privacy Policy.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
                    <p className="mb-4">
                      The Services and all content and materials included on or within the Services, including, but not limited to, text, graphics, logos, images, and software, are the property of FinPath Insight or our licensors and are protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p className="mb-4">
                      We grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the Services for your personal, non-commercial use. This license does not include the right to:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Modify or copy the materials</li>
                      <li>Use the materials for any commercial purpose</li>
                      <li>Attempt to decompile or reverse engineer any software contained in the Services</li>
                      <li>Remove any copyright or other proprietary notations from the materials</li>
                      <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">6. Termination</h2>
                    <p className="mb-4">
                      We may terminate or suspend your access to the Services at any time, with or without cause, and with or without notice. Upon termination, your right to use the Services will immediately cease.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
                    <p className="mb-4">
                      THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                    </p>
                    <p className="mb-4">
                      WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
                    <p className="mb-4">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL FINPATH INSIGHT, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">9. Governing Law</h2>
                    <p className="mb-4">
                      These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
                    <p className="mb-4">
                      If you have any questions about these Terms, please contact us at:
                    </p>
                    <p>
                      <strong>Email:</strong> legal@finpathinsight.com<br />
                      <strong>Address:</strong> FinPath Insight, 123 Financial District, Hyderabad, Telangana 500032, India
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
