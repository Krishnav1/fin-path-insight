import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  const lastUpdated = "May 15, 2025";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-fin-primary to-fin-teal py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-lg opacity-90">
                Last Updated: {lastUpdated}
              </p>
            </div>
          </div>
        </section>
        
        {/* Privacy Content */}
        <section className="py-12 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="p-8">
                <CardContent className="p-0 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                    <p className="mb-4">
                      At FinPath Insight, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and services (collectively, the "Services").
                    </p>
                    <p>
                      Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access or use our Services.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                    
                    <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
                    <p className="mb-4">
                      We may collect personal information that you voluntarily provide to us when you register for an account, express interest in obtaining information about us or our Services, or otherwise contact us. The personal information we collect may include:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Name, email address, phone number, and other contact details</li>
                      <li>Account credentials, such as passwords and password hints</li>
                      <li>Financial information, such as investment preferences and portfolio details</li>
                      <li>Profile information, such as your investment goals and risk tolerance</li>
                      <li>Any other information you choose to provide</li>
                    </ul>
                    
                    <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
                    <p className="mb-4">
                      When you access or use our Services, we may automatically collect certain information, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Device information, such as your IP address, browser type, operating system, and device identifiers</li>
                      <li>Usage information, such as pages visited, time spent on pages, links clicked, and actions taken</li>
                      <li>Location information, such as general geographic location based on your IP address</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                    <p className="mb-4">
                      We may use the information we collect for various purposes, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Providing, maintaining, and improving our Services</li>
                      <li>Processing your transactions and managing your account</li>
                      <li>Personalizing your experience and delivering content relevant to your interests</li>
                      <li>Communicating with you about our Services, updates, and promotions</li>
                      <li>Responding to your inquiries and providing customer support</li>
                      <li>Analyzing usage patterns and trends to enhance our Services</li>
                      <li>Protecting our Services and preventing fraud</li>
                      <li>Complying with legal obligations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>
                    <p className="mb-4">
                      We may share your information in the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as data analysis, payment processing, and customer service.</li>
                      <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
                      <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                      <li><strong>Protection of Rights:</strong> We may disclose your information to protect our rights, privacy, safety, or property, or that of our users or others.</li>
                    </ul>
                    <p className="mb-4">
                      We do not sell, rent, or otherwise disclose your personal information to third parties for their marketing purposes without your explicit consent.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                    <p className="mb-4">
                      We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                    <p className="mb-4">
                      You are responsible for maintaining the confidentiality of your account credentials and for any activities that occur under your account. Please notify us immediately of any unauthorized use of your account or any other breach of security.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
                    <p className="mb-4">
                      Depending on your location, you may have certain rights regarding your personal information, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Accessing, correcting, or deleting your personal information</li>
                      <li>Restricting or objecting to our use of your personal information</li>
                      <li>Receiving a copy of your personal information in a structured, machine-readable format</li>
                      <li>Withdrawing your consent at any time, where we rely on consent to process your personal information</li>
                    </ul>
                    <p className="mb-4">
                      To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking Technologies</h2>
                    <p className="mb-4">
                      We use cookies and similar tracking technologies to collect information about your browsing activities and to remember your preferences. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Services.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
                    <p className="mb-4">
                      Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us. If we become aware that we have collected personal information from a child under 18 without verification of parental consent, we will take steps to remove that information from our servers.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">9. Changes to This Privacy Policy</h2>
                    <p className="mb-4">
                      We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a notice on our website prior to the change becoming effective. We encourage you to review this Privacy Policy periodically for the latest information on our privacy practices.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
                    <p className="mb-4">
                      If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
                    </p>
                    <p>
                      <strong>Email:</strong> privacy@finpathinsight.com<br />
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
