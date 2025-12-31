// src/app/terms/page.js
'use client'

import Link from 'next/link'
import { ArrowLeft, Users, FileText } from 'lucide-react'

export default function TermsPage() {
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
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions</h1>
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
                Welcome to PartnerLogic, a Partner Relationship Management (PRM) platform operated by AmpleLogic. 
                These Terms and Conditions ("Terms") govern your access to and use of our platform, services, and 
                related offerings (collectively, the "Services").
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using PartnerLogic, you agree to be bound by these Terms. If you do not agree with 
                any part of these Terms, you may not access or use our Services.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By creating an account, setting a password, or using any part of PartnerLogic, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You have read, understood, and agree to be bound by these Terms</li>
                <li>You are at least 18 years of age or the age of majority in your jurisdiction</li>
                <li>You have the authority to enter into these Terms on behalf of your organization (if applicable)</li>
                <li>All information you provide is accurate, complete, and current</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration & Security</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">3.1 Account Creation:</strong> Your account is created by an 
                  administrator who invites you to join PartnerLogic. You are responsible for completing the 
                  activation process and setting a secure password.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">3.2 Account Security:</strong> You are responsible for maintaining 
                  the confidentiality of your account credentials and for all activities that occur under your account. 
                  You must notify us immediately of any unauthorized use or security breach.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">3.3 Password Requirements:</strong> Your password must meet minimum 
                  security requirements including length, complexity, and character variety as specified during account setup.
                </p>
              </div>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Use the Services only for lawful purposes and in accordance with these Terms</li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security and confidentiality of your account</li>
                <li>Not share your account credentials with unauthorized individuals</li>
                <li>Not use the Services to transmit harmful, offensive, or illegal content</li>
                <li>Not interfere with or disrupt the Services or servers</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            {/* Partner Program */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partner Program</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">5.1 Partnership Types:</strong> PartnerLogic supports various 
                  partnership models including Referral Partners, Reseller Partners, Full-Cycle Partners, and 
                  White-Label Partners. Specific terms applicable to your partnership type may be outlined in 
                  separate agreements.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">5.2 Tier System:</strong> Partners are assigned to tiers 
                  (Bronze, Silver, Gold, Platinum) based on performance metrics. Tier benefits and requirements 
                  may be modified at our discretion with reasonable notice.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">5.3 Commissions & Payments:</strong> Commission structures, 
                  payment terms, and MDF (Market Development Funds) allocations are subject to your partnership 
                  agreement and may vary by tier level.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">6.1 Platform Ownership:</strong> The PartnerLogic platform, 
                  including all content, features, functionality, software, and visual interfaces, is owned by 
                  AmpleLogic and protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">6.2 Limited License:</strong> We grant you a limited, 
                  non-exclusive, non-transferable, revocable license to access and use the Services for your 
                  business purposes in accordance with these Terms.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">6.3 User Content:</strong> You retain ownership of any content, 
                  data, or materials you submit to the platform. By submitting content, you grant us a license to 
                  use, store, and process such content solely to provide the Services.
                </p>
              </div>
            </section>

            {/* Data Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Privacy & Protection</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy is important to us. Our collection, use, and protection of your personal data is 
                governed by our <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We comply with applicable data protection laws including GDPR, CCPA, and other relevant regulations.
              </p>
            </section>

            {/* Service Availability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">8.1 Availability:</strong> We strive to maintain high service 
                  availability but do not guarantee uninterrupted access. The Services may be unavailable due to 
                  maintenance, updates, or unforeseen circumstances.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">8.2 Modifications:</strong> We reserve the right to modify, 
                  suspend, or discontinue any aspect of the Services at any time with reasonable notice.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AMPLELOGIC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
                DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our total liability to you for any claims arising from or related to these Terms or the Services 
                shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong className="text-gray-900">10.1 By You:</strong> You may terminate your account at any 
                  time by contacting your administrator or our support team.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">10.2 By Us:</strong> We may suspend or terminate your access 
                  to the Services immediately, without prior notice, for violation of these Terms or any applicable laws.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-gray-900">10.3 Effect of Termination:</strong> Upon termination, your 
                  right to use the Services will immediately cease. We may retain certain data as required by law 
                  or legitimate business purposes.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law & Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in 
                which AmpleLogic is registered, without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Any disputes arising from these Terms or the Services shall first be attempted to be resolved through 
                good faith negotiations. If unresolved, disputes may be subject to binding arbitration or litigation 
                as appropriate.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update these Terms from time to time. We will notify you of material changes by posting the 
                updated Terms on the platform and updating the "Last Updated" date. Your continued use of the Services 
                after such changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-semibold">AmpleLogic - PartnerLogic Support</p>
                <p className="text-gray-700">Email: support@amplelogic.com</p>
                <p className="text-gray-700">Legal: legal@amplelogic.com</p>
              </div>
            </section>

            {/* Severability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Severability & Waiver</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions 
                will continue in full force and effect. Our failure to enforce any right or provision of these Terms 
                will not be deemed a waiver of such right or provision.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Entire Agreement</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms, together with our Privacy Policy and any other legal notices or agreements published by 
                us on the Services, constitute the entire agreement between you and AmpleLogic regarding the Services.
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
