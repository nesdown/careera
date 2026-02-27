import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: February 27, 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Careera ("we," "our," or "us") operates the website at careera.co (the "Service").
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our Service. By accessing or using the Service, you agree
              to the terms of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Assessment Responses:</strong> Answers you provide
                during the leadership assessment questionnaire, used to generate your personalized report.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> Information about how you
                interact with our Service, including pages visited, time spent, browser type,
                and device information.
              </li>
              <li>
                <strong className="text-white">Cookies & Analytics:</strong> We use cookies and
                similar tracking technologies to improve your experience and analyze usage patterns.
              </li>
              <li>
                <strong className="text-white">Contact Information:</strong> If you book a call
                or purchase a report, we may collect your name, email address, and scheduling preferences.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To generate your personalized leadership readiness report using AI-powered analysis.</li>
              <li>To improve and optimize our Service, content, and user experience.</li>
              <li>To communicate with you about your report, bookings, or account.</li>
              <li>To conduct A/B testing and analytics to enhance our questionnaire and service quality.</li>
              <li>To comply with legal obligations and protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">
              We use third-party services to operate and improve the Service. These may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">OpenAI:</strong> To generate AI-powered analysis for your leadership report. Your assessment responses are sent to OpenAI's API for processing.</li>
              <li><strong className="text-white">Gamma:</strong> To design and export your PDF report with professional formatting.</li>
              <li><strong className="text-white">Calendly:</strong> For scheduling coaching calls.</li>
              <li><strong className="text-white">DigitalOcean:</strong> For hosting and infrastructure.</li>
            </ul>
            <p className="mt-3">
              Each third-party service operates under its own privacy policy. We encourage you
              to review their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your assessment data only for the duration necessary to generate your
              report. We do not store your individual assessment responses long-term. Aggregated,
              anonymized data may be retained for analytics and service improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">6. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your
              information. However, no method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, correct, or delete your personal data.</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
              <li>Lodge a complaint with a supervisory authority.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:privacy@careera.co" className="text-white underline hover:text-zinc-300">
                privacy@careera.co
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@careera.co" className="text-white underline hover:text-zinc-300">
                privacy@careera.co
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-500">
          &copy; 2026 Careera. All rights reserved.
        </div>
      </div>
    </div>
  );
}
