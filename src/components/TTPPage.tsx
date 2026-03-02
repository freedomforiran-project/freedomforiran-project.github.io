import React, { useState, useEffect } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

interface TTPRecipient {
  name: string;
  email: string;
  role?: string;
}

interface TTPEmailTemplate {
  subject: string;
  body: string;
  recipients: TTPRecipient[];
}

interface EmailTemplates {
  ttpTemplate: TTPEmailTemplate;
}

const TTPPage: React.FC = () => {
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplates | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Google Form tracking for TTP page
  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc2U7Hg3Dk-wEZ3usTxmjyPvwd8-HhFSrmT1mibVSpPvqmxuA/formResponse';

  const trackEvent = (eventType: string) => {
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const formData = new FormData();
    formData.append('entry.466984131', eventType); // Event Type
    formData.append('entry.138447994', timestamp); // Timestamp
    formData.append('entry.257745081', eventType); // Action (using same as event type)

    // Send to Google Form (no-cors mode, fire and forget)
    fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    }).catch(() => {}); // Ignore errors silently
  };

  // Load email template on component mount
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}email-templates.json`)
      .then(res => res.json())
      .then(data => setEmailTemplate(data))
      .catch(err => console.error('Error loading email template:', err));

    // Track page view
    trackEvent('TTP page view');
  }, []);

  const generateTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const createTTPMailtoLink = () => {
    if (!emailTemplate) return '';

    const { subject, body, recipients } = emailTemplate.ttpTemplate;

    if (!recipients || recipients.length === 0) return '';

    const allEmails = recipients.map(r => r.email).join(',');

    // Replace [TIMESTAMP] placeholder with actual timestamp
    const timestampedSubject = subject.replace('[TIMESTAMP]', generateTimestamp());

    const encodedSubject = encodeURIComponent(timestampedSubject);
    const encodedBody = encodeURIComponent(body);

    return `mailto:${allEmails}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  const handleSendEmail = () => {
    setLoading(true);

    // Track email send event
    trackEvent('TTP email sent');

    // Small delay for UX feedback
    setTimeout(() => {
      const mailtoLink = createTTPMailtoLink();
      window.location.href = mailtoLink;
      setLoading(false);
      setEmailSent(true);

      // Reset sent state after 3 seconds
      setTimeout(() => setEmailSent(false), 3000);
    }, 500);
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-4">
              <img src="/ttp.png" alt="The Teach Project" className="w-24 md:w-40 flex-shrink-0" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight text-left">
                Contact UN & UNICEF About Children in Iran
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-2">
              Urge action on documented killings and abductions of children by the Islamic Republic regime
            </p>
            <p className="text-sm text-gray-500">
              Click below to send an email to UN Committee on the Rights of the Child and UNICEF
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            {emailTemplate && emailTemplate.ttpTemplate ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Email Recipients</h2>
                  <div className="space-y-2">
                    {emailTemplate.ttpTemplate.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-start gap-2 text-gray-700">
                        <Mail size={16} className="mt-1 flex-shrink-0 text-green-600" />
                        <div>
                          <span className="font-medium">{recipient.name}</span>
                          {recipient.role && (
                            <span className="text-gray-500 text-sm ml-2">({recipient.role})</span>
                          )}
                          <div className="text-sm text-gray-500">{recipient.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Opening Email...
                    </>
                  ) : emailSent ? (
                    <>
                      <CheckCircle size={20} />
                      Email Opened
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      Send Email to UN & UNICEF
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  This will open your default email client with the message pre-filled.
                  All 4 recipients will be in the To field.
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="animate-spin mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-gray-500">Loading email template...</p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Why Contact UN & UNICEF?</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Document grave violations against children during January 2026 protests (207+ children killed)</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Urge independent investigation into killings, arrests, and detention of children</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Demand protection of families, witnesses, and sources from retaliation</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Call for immediate release of detained children and accountability mechanisms</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Iran is a State Party to the Convention on the Rights of the Child - these violations must be addressed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTPPage;
