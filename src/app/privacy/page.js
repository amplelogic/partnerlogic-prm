// src/app/privacy/page.js
'use client'

import Link from 'next/link'
import { ArrowLeft, Users, Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">PartnerLogic</div>
              <div className="text-sm text-gray-500">by AmpleLogic</div>
            </div>
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600">Last Updated: December 31, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="prose prose-blue max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At AmpleLogic, we are committed to protecting your privacy and ensuring the security of your personal 
                information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use PartnerLogic, our Partner Relationship Management platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy applies to all users of PartnerLogic, including partners, administrators, partner 
                managers, and support staff. By using our Services, you consent to the data practices described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    We collect information that you voluntarily provide to us, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Account Information:</strong> Name, email address, phone number, job title, company name</li>
                    <li><strong>Profile Information:</strong> Business details, partnership type, tier level, certifications</li>
                    <li><strong>Authentication Data:</strong> Password (encrypted), security questions, two-factor authentication settings</li>
                    <li><strong>Business Data:</strong> Deal information, customer details, transaction records, commission data</li>
                    <li><strong>Communications:</strong> Support tickets, messages, feedback, and correspondence</li>
                    <li><strong>Payment Information:</strong> Banking details for commission payments (processed securely)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    When you access and use PartnerLogic, we automatically collect:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                    <li><strong>Log Data:</strong> Access times, error logs, performance data</li>
                    <li><strong>Cookies & Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may receive information from third-party services, partners, or data providers to enhance our 
                    Services, verify information, or prevent fraud.
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use the collected information for the following purposes:</p>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">3.1 Service Provision:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Create and manage your account</li>
                    <li>Provide access to platform features and functionality</li>
                    <li>Process deals, commissions, and transactions</li>
                    <li>Enable collaboration and communication</li>
                    <li>Provide customer support and respond to inquiries</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2">3.2 Platform Improvement:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Analyze usage patterns and trends</li>
                    <li>Improve platform performance and user experience</li>
                    <li>Develop new features and services</li>
                    <li>Conduct research and analytics</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2">3.3 Communication:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Send service-related notifications and updates</li>
                    <li>Provide tier progression updates and achievements</li>
                    <li>Send marketing communications (with your consent)</li>
                    <li>Notify about important changes or security issues</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2">3.4 Security & Compliance:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Protect against fraud, abuse, and security threats</li>
                    <li>Comply with legal obligations and regulations</li>
                    <li>Enforce our Terms and Conditions</li>
                    <li>Resolve disputes and troubleshoot issues</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">4.1 Within the Platform:</strong> Your information may be visible 
                  to administrators, partner managers, and other authorized users based on their role and permissions.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">4.2 Service Providers:</strong> We may share information with 
                  trusted third-party service providers who assist us in operating our platform (e.g., hosting, 
                  payment processing, analytics, email services). These providers are bound by confidentiality agreements.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">4.3 Business Transfers:</strong> In the event of a merger, 
                  acquisition, or sale of assets, your information may be transferred to the acquiring entity.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">4.4 Legal Requirements:</strong> We may disclose information 
                  when required by law, court order, or governmental authority, or to protect our rights, property, 
                  or safety.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">4.5 With Your Consent:</strong> We may share information with 
                  third parties when you have given explicit consent.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Encryption:</strong> Data is encrypted in transit (SSL/TLS) and at rest</li>
                <li><strong>Access Controls:</strong> Role-based access controls and authentication</li>
                <li><strong>Monitoring:</strong> Continuous security monitoring and logging</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Employee Training:</strong> Staff trained on data protection best practices</li>
                <li><strong>Incident Response:</strong> Procedures for detecting and responding to security breaches</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
                strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide our Services to you</li>
                <li>Comply with legal, tax, or regulatory obligations</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Maintain business records and analytics</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                When data is no longer needed, we securely delete or anonymize it. Some information may be retained 
                in backup systems for a limited period.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.1 Access:</strong> Request access to the personal information 
                  we hold about you
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.2 Correction:</strong> Request correction of inaccurate or 
                  incomplete information
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.3 Deletion:</strong> Request deletion of your personal information 
                  (subject to legal requirements)
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.4 Portability:</strong> Request a copy of your data in a 
                  structured, machine-readable format
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.5 Restriction:</strong> Request restriction of processing in 
                  certain circumstances
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.6 Objection:</strong> Object to processing based on legitimate 
                  interests
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">7.7 Withdraw Consent:</strong> Withdraw consent for marketing 
                  communications or other optional processing
                </p>
              </div>
              
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@amplelogic.com. We will respond to your request 
                within the timeframe required by applicable law.
              </p>
            </section>

            {/* GDPR Compliance */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. GDPR Compliance (EU Users)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are located in the European Economic Area (EEA), we process your personal data in accordance 
                with the General Data Protection Regulation (GDPR). Our legal bases for processing include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Contractual Necessity:</strong> Processing necessary to perform our contract with you</li>
                <li><strong>Legitimate Interests:</strong> Processing for our legitimate business interests</li>
                <li><strong>Legal Obligation:</strong> Processing required by law</li>
                <li><strong>Consent:</strong> Processing based on your explicit consent</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You have the right to lodge a complaint with your local data protection authority if you believe we 
                have violated your privacy rights.
              </p>
            </section>

            {/* CCPA Compliance */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. CCPA Rights (California Users)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are a California resident, the California Consumer Privacy Act (CCPA) provides you with 
                specific rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information (subject to exceptions)</li>
                <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising your rights</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise your CCPA rights, contact us at privacy@amplelogic.com or call our toll-free number 
                (if applicable).
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies & Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                <li><strong>Performance Cookies:</strong> Help us understand how users interact with the platform</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Collect data about usage patterns and performance</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings, but disabling certain cookies may affect 
                platform functionality.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                PartnerLogic is not intended for use by individuals under the age of 18 (or the age of majority in 
                their jurisdiction). We do not knowingly collect personal information from children. If we become 
                aware that we have collected information from a child, we will take steps to delete it promptly.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place for such transfers, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Adequacy decisions by relevant authorities</li>
                <li>Other legally recognized transfer mechanisms</li>
              </ul>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
                or legal requirements. We will notify you of material changes by posting the updated policy on our 
                platform and updating the "Last Updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-semibold">AmpleLogic - Privacy Team</p>
                <p className="text-gray-700">Email: privacy@amplelogic.com</p>
                <p className="text-gray-700">Data Protection Officer: dpo@amplelogic.com</p>
                <p className="text-gray-700">General Support: support@amplelogic.com</p>
              </div>
            </section>

            {/* Consent */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Your Consent</h2>
              <p className="text-gray-700 leading-relaxed">
                By using PartnerLogic, you acknowledge that you have read and understood this Privacy Policy and 
                consent to the collection, use, and disclosure of your information as described herein.
              </p>
            </section>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/set-password"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Set Password
          </Link>
        </div>
      </div>
    </div>
  )
}
