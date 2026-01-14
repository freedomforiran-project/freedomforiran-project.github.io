import React, { useState, useEffect } from 'react';
import { Search, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface MP {
  firstName: string;
  lastName: string;
  fullName: string;
  constituency: string;
  province: string;
  party: string;
  email: string;
  isDefault?: boolean;
  actualConstituency?: string;
  postalCode?: string;
}

const MPLookup: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [mp, setMp] = useState<MP | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allMPs, setAllMPs] = useState<MP[]>([]);
  const [suggestions, setSuggestions] = useState<MP[]>([]);
  const [usedPostalCode, setUsedPostalCode] = useState(false);

  // Google Form tracking
  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScLi7l0Mmsh79QK438KjkoKdCHGe-PU8NWxpLtv62ED1XH24w/formResponse';

  const trackEvent = (eventType: string, mpName?: string, constituency?: string) => {
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
    formData.append('entry.268126460', eventType);
    formData.append('entry.490158959', timestamp);
    if (mpName) formData.append('entry.1101110710', mpName);
    if (constituency) formData.append('entry.822429236', constituency);

    // Send to Google Form (no-cors mode, fire and forget)
    fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    }).catch(() => {}); // Ignore errors silently
  };

  const getEmailTemplate = () => {
    // Calculate days since January 8, 2026
    const startDate = new Date('2026-01-08');
    startDate.setHours(0, 0, 0, 0); // Set to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return `Dear [MP_NAME],

I am writing to you as one of your constituents. As I am writing this email, millions of Iranians have taken to the streets all over Iran since late December 2025, to protest against the Islamic Republic of Iran. The government has shut down the internet and phone lines. For ${diffDays} consecutive days, we have been unable to reach our families in Iran. The regime has held the Iranian people hostage and by cutting off internet connectivity and isolating Iran from the outside world, it has intensified its crackdown on protesters. There have been reports that thousands of protestors have been killed and countless others injured.

As a Member of the Parliament of Canada, a country that is among the most diverse and home to one of the largest communities of the Iranian diaspora in the world, the role of your office extends far beyond the Canadian borders and your silence fails to stand with the Iranian-Canadians that looks to their elected representatives for leadership. As you know, for decades, the Iranian regime has held the country and the Iranians hostage, has engaged in systemic repression, including arbitrary detention, execution, torture, censorship and violent suppression of peaceful protests. In fact, the Government of Canada has formally recognized the Islamic Republic as a regime that has engaged in terrorism and systematic or gross human rights violations. Protestors are once again facing the brutality and terror of the Islamic Revolutionary Guard Corps (IRGC), which is recognized as a terrorist organization under the Criminal Code.

I appreciate the multitude of other issues before Parliament and the demands of your office.  However, we are at a pivotal and defining moment in history - one in which every statement, action and expression of support matters. Time is of the essence. A revolution is underway.

As a constituent, I ask that you publicly and unequivocally denounce the Islamic Republic of Iran, acknowledge and amplify the voices of the protestors in Iran, advocate within the Parliament for continued and expanded measures to hold Iranian officials accountable, support independent human rights investigations, and clearly stand with the people of Iran. When our leaders speak unequivocally and consistently, it sends a signal that Canada does not condone and will not normalize repression, terrorism, or overlook state violence.

This is a revolution for a free Iran and a better world. Stand with us.

[CONSTITUENCY_INFO]

Sincerely,
`;
  };

  // Load MP data on component mount
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}mps-data.json`)
      .then(res => res.json())
      .then(data => setAllMPs(data))
      .catch(err => console.error('Failed to load MP data:', err));
  }, []);

  const searchMP = async () => {
    const query = searchInput.trim();

    if (!query) {
      setError('Please enter a postal code, MP name, constituency, or city');
      return;
    }

    if (query.length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMp(null);
    setSuggestions([]);
    setUsedPostalCode(false);

    // Check if it's a postal code (Canadian format: A1A 1A1 or A1A1A1)
    const postalCodePattern = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
    const queryUpper = query.toUpperCase().replace(/\s/g, '');

    if (postalCodePattern.test(query)) {
      // It's a postal code - use Represent API
      setUsedPostalCode(true);
      try {
        const response = await fetch(
          `https://represent.opennorth.ca/postcodes/${queryUpper}/?sets=federal-electoral-districts`
        );

        if (!response.ok) {
          throw new Error('Unable to find MP for this postal code');
        }

        const data = await response.json();

        // Get the constituency name from the API
        const boundaries = data.boundaries_centroid || data.boundaries_concordance || [];
        const federalDistrict = boundaries.find((b: any) =>
          b.boundary_set_name && b.boundary_set_name.toLowerCase().includes('federal')
        );

        if (!federalDistrict) {
          throw new Error('No federal constituency found for this postal code');
        }

        // Match the constituency name with our local MP data
        const constituencyName = federalDistrict.name;

        // Try exact match first
        let foundMP = allMPs.find(mp =>
          mp.constituency.toLowerCase() === constituencyName.toLowerCase()
        );

        // If no exact match, try matching the first part before the dash (must start with it)
        if (!foundMP) {
          const constituencyFirstPart = constituencyName.split('—')[0].toLowerCase().trim();
          foundMP = allMPs.find(mp =>
            mp.constituency.toLowerCase().startsWith(constituencyFirstPart)
          );
        }

        if (foundMP) {
          setMp(foundMP);
          trackEvent('Search MP', foundMP.fullName, foundMP.constituency);
        } else {
          // MP not found - use Mark Carney as default
          const markCarney = allMPs.find(mp => mp.fullName === 'Mark Carney');

          if (markCarney) {
            const defaultMP = {
              ...markCarney,
              isDefault: true,
              actualConstituency: constituencyName,
              postalCode: queryUpper
            };
            setMp(defaultMP);
            trackEvent('Search MP', markCarney.fullName, constituencyName);
            setError(`Note: The constituency "${constituencyName}" seat is currently vacant or not in our database. Your email will be sent to Mark Carney (Prime Minister) with your constituency information.`);
          } else {
            setError(`Found constituency "${constituencyName}" but couldn't match with MP database. Try searching by name instead.`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error looking up postal code. Try searching by constituency name instead.');
      } finally {
        setLoading(false);
      }
    } else {
      // Not a postal code - search local database
      setTimeout(() => {
        const queryLower = query.toLowerCase();
        const results = allMPs.filter(mp =>
          mp.fullName.toLowerCase().includes(queryLower) ||
          mp.constituency.toLowerCase().includes(queryLower) ||
          mp.province.toLowerCase().includes(queryLower) ||
          mp.lastName.toLowerCase().includes(queryLower) ||
          mp.firstName.toLowerCase().includes(queryLower)
        );

        if (results.length === 0) {
          setError('No MP found. Try searching by postal code, MP name, constituency, city, or province.');
        } else if (results.length === 1) {
          setMp(results[0]);
          trackEvent('Search MP', results[0].fullName, results[0].constituency);
        } else {
          // Multiple results - show suggestions
          setSuggestions(results.slice(0, 10)); // Show top 10 results
          setError(`Found ${results.length} matches. Please select one below:`);
        }

        setLoading(false);
      }, 300);
    }
  };

  const selectMP = (selectedMP: MP) => {
    setMp(selectedMP);
    setSuggestions([]);
    setError('');
    setSearchInput(selectedMP.fullName);
    trackEvent('Search MP', selectedMP.fullName, selectedMP.constituency);
  };

  const createMailtoLink = (mpData: MP) => {
    const subject = encodeURIComponent('RE: Urgent Call for Support of the Iranian People and Condemnation of the Islamic Republic');

    let emailBody = getEmailTemplate().replace('[MP_NAME]', mpData.fullName);

    // Clean up placeholders
    emailBody = emailBody.replace('[MP_NAME]', mpData.fullName);

    // Add constituency and province info before "Sincerely,"
    const locationInfo = `${mpData.constituency}, ${mpData.province}`;
    emailBody = emailBody.replace('[CONSTITUENCY_INFO]', locationInfo);

    // If this is a fallback to Mark Carney for a vacant seat, add additional note
    if (mpData.isDefault && mpData.actualConstituency) {
      const constituencyNote = `\n\nNote: I am writing from the ${mpData.actualConstituency} constituency${mpData.postalCode ? ` (Postal Code: ${mpData.postalCode})` : ''}, which currently has a vacant seat. I am reaching out to you as Deputy Prime Minister to ensure this important issue receives attention.`;
      emailBody = emailBody + constituencyNote;
    }

    const body = encodeURIComponent(emailBody);
    return `mailto:${mpData.email}?subject=${subject}&body=${body}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMP();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-4">
            <img src="/flag.svg" alt="Iranian Flag" className="w-12 h-12 md:w-20 md:h-20 flex-shrink-0" />
            <img src="/canadaflag.svg" alt="Canadian Flag" className="w-12 h-12 md:w-20 md:h-20 flex-shrink-0" />
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Contact Your MP About Iran
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            Take action by emailing your Canadian Member of Parliament regarding the ongoing humanitarian crisis in Iran
          </p>
          <p className="text-sm text-gray-500">
            Search by postal code, MP name, constituency, or city
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Find Your MP
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., K1A 0A6, Ottawa, or Mark Carney"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                disabled={loading}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          <button
            onClick={searchMP}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Searching...
              </>
            ) : (
              <>
                Find My MP
              </>
            )}
          </button>

          {/* Error Message */}
          {error && suggestions.length === 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">{error}</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectMP(suggestion)}
                    className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    <p className="font-semibold text-gray-900">{suggestion.fullName}</p>
                    <p className="text-sm text-gray-600">{suggestion.constituency}, {suggestion.province}</p>
                    <p className="text-xs text-gray-500">{suggestion.party}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MP Results */}
          {mp && (
            <div className="mt-6 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {mp.isDefault ? 'Contact Prime Minister' : 'Your Member of Parliament'}
              </h2>

              {usedPostalCode && !mp.isDefault && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Note:</span> Postal code lookups may be inaccurate due to recent constituency boundary changes. Postal codes are primarily used for mail sorting and can span multiple electoral districts. If this MP does not represent your area, please search by your constituency name or MP name instead.
                  </p>
                </div>
              )}

              {mp.isDefault && mp.actualConstituency && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Your Constituency:</span> {mp.actualConstituency}
                    <br />
                    <span className="text-xs">This seat is currently vacant. Your email will go to the Prime Minister with your constituency information included.</span>
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-6">
                <p className="text-gray-700">
                  <span className="font-semibold">Name:</span> {mp.fullName}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Constituency:</span> {mp.constituency}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Province:</span> {mp.province}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Party:</span> {mp.party}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span> {mp.email}
                </p>
              </div>

              <a
                href={createMailtoLink(mp)}
                onClick={() => trackEvent('Send email', mp.fullName, mp.constituency)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 inline-flex"
              >
                <Mail size={20} />
                Email {mp.firstName} About Iran
              </a>

              <p className="text-sm text-gray-600 mt-4">
                The email will open in your default email client with a pre-written message. You can edit it before sending.
              </p>
            </div>
          )}
        </div>

        {/* Information Box */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Why Contact Your MP?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Members of Parliament represent your voice in the Canadian government</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Your message helps raise awareness about human rights violations in Iran</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Collective action can lead to policy changes and international support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Every email counts in demonstrating Canadian support for Iranian people</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MPLookup;
