/**
 * AskForms Built-In AI Assistant Engine (Zero-Cost Freemium + Optional BYOK)
 * and Model Context Protocol (MCP) JSON-RPC Handler.
 * Runs identically on Node 22 and Cloudflare Pages Edge.
 */

export function parseNaturalLanguageForm(prompt = '') {
  const raw = String(prompt || '').trim();
  const lower = raw.toLowerCase();

  // Detect industry / form title
  let name = 'Custom Website Enquiry';
  let clientName = 'Website';
  let submitLabel = 'Send Enquiry';
  let multiStep = /2[- ]?step|two[- ]?step|multi[- ]?step|wizard/i.test(raw) ? 1 : 0;

  if (/roof|plumb|electr|build|trade|quote|handyman|paint|landscap|clean|solar|hvac|aircon/i.test(lower)) {
    name = 'Fast Quote Request';
    clientName = 'Trades & Services';
    submitLabel = 'Request Quote';
  } else if (/appoint|book|consult|clinic|physio|dentist|doctor|therapy|ndis|salon|barber/i.test(lower)) {
    name = 'Appointment Request';
    clientName = 'Appointments';
    submitLabel = 'Request Appointment';
  } else if (/property|real estate|inspect|rental|appraisal|home|house/i.test(lower)) {
    name = 'Property Enquiry';
    clientName = 'Real Estate';
    submitLabel = 'Send Property Enquiry';
  } else if (/event|table|wedding|function|cater|restaurant|venue|party|guest/i.test(lower)) {
    name = 'Event & Booking Enquiry';
    clientName = 'Bookings';
    submitLabel = 'Check Availability';
  } else if (/support|warranty|claim|ticket|bug|issue|return|refund/i.test(lower)) {
    name = 'Support & Warranty Request';
    clientName = 'Support';
    submitLabel = 'Submit Request';
  } else if (/onboard|brief|project|agency|design|web|audit|workshop/i.test(lower)) {
    name = 'Project Discovery Brief';
    clientName = 'Client Intake';
    submitLabel = 'Submit Brief';
  }

  // Extract explicit title if user wrote "called X" or "named X" or "for X"
  const calledMatch = raw.match(/(?:called|named|titled)\s+["']?([^"',.\n]{3,42})["']?/i);
  if (calledMatch) {
    name = calledMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const fields = [];
  const addedKeys = new Set();
  const addField = (f) => {
    if (addedKeys.has(f.name)) return;
    addedKeys.add(f.name);
    fields.push(f);
  };

  // Detect domain-specific fields from natural language keywords
  if (/service|job type|work type|repair|install|quote/i.test(lower)) {
    addField({
      name: 'service_type',
      label: 'Service Needed',
      type: 'select',
      required: true,
      options: ['New Installation', 'Repair or Maintenance', 'Custom Quote', 'General Enquiry'],
    });
  }
  if (/roof/i.test(lower)) {
    addField({
      name: 'roof_type',
      label: 'Roof Material / Type',
      type: 'select',
      required: true,
      options: ['Colorbond / Metal', 'Terracotta / Concrete Tile', 'Flat / Commercial Roof', 'Not Sure'],
    });
  }
  if (/solar/i.test(lower)) {
    addField({
      name: 'has_solar',
      label: 'Are solar panels installed?',
      type: 'select',
      required: false,
      options: ['Yes', 'No', 'Planning to add solar'],
    });
  }
  if (/suburb|postcode|zip|location|address/i.test(lower)) {
    addField({
      name: 'suburb',
      label: 'Suburb or Postcode',
      type: 'text',
      required: true,
      placeholder: 'e.g. Surry Hills 2010',
    });
  }
  if (/ndis|participant/i.test(lower)) {
    addField({
      name: 'ndis_number',
      label: 'NDIS Participant Number (Optional)',
      type: 'text',
      required: false,
      placeholder: 'e.g. 430 123 456',
    });
  }
  if (/date|day|when|schedule|time|appointment|booking/i.test(lower)) {
    addField({
      name: 'preferred_date',
      label: 'Preferred Day & Time',
      type: 'select',
      required: true,
      options: ['Next Available', 'Weekday Morning', 'Weekday Afternoon', 'Saturday Morning'],
    });
  }
  if (/guest|people|pax|attendee/i.test(lower)) {
    addField({
      name: 'guest_count',
      label: 'Number of Guests',
      type: 'text',
      required: true,
      placeholder: 'e.g. 12 guests',
    });
  }
  if (/dietary|allerg/i.test(lower)) {
    addField({
      name: 'dietary_notes',
      label: 'Dietary Requirements',
      type: 'text',
      required: false,
      placeholder: 'e.g. Gluten-free, vegetarian',
    });
  }
  if (/budget|price|spend|cost/i.test(lower)) {
    addField({
      name: 'budget',
      label: 'Approximate Budget',
      type: 'select',
      required: false,
      options: ['Under $1,500', '$1,500 to $5,000', '$5,000 to $15,000', '$15,000+'],
    });
  }
  if (/urgen|timeframe|timeline|asap|soon/i.test(lower)) {
    addField({
      name: 'urgency',
      label: 'Timeframe / Urgency',
      type: 'select',
      required: true,
      options: ['Urgent (Today or Tomorrow)', 'Within 7 Days', 'Within 2 to 4 Weeks', 'Flexible'],
    });
  }
  if (/order|invoice|receipt|serial|model/i.test(lower)) {
    addField({
      name: 'order_reference',
      label: 'Order or Invoice Number',
      type: 'text',
      required: true,
      placeholder: 'e.g. INV-10482',
    });
  }
  if (/company|business name|organisation|website|url/i.test(lower)) {
    addField({
      name: 'company',
      label: 'Business Name or Website',
      type: 'text',
      required: false,
      placeholder: 'e.g. Harbour Plumbing Co',
    });
  }

  // Always include core contact fields
  addField({ name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Alex Mercer' });
  addField({ name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'alex@example.com.au' });
  if (/phone|mobile|call|sms|quote|appoint|book|property|event/i.test(lower) || fields.length < 5) {
    addField({ name: 'phone', label: 'Mobile Number', type: 'tel', required: true, placeholder: '0412 345 678' });
  }
  addField({
    name: 'message',
    label: 'Additional Details',
    type: 'textarea',
    required: true,
    placeholder: 'Tell us a little more about what you need...',
  });

  if (fields.length >= 6) multiStep = 1;

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 6);

  return {
    id: slug,
    name,
    client_name: clientName,
    submit_label: submitLabel,
    multi_step: multiStep,
    fields,
  };
}

/**
 * Optional BYOK LLM Form Generator (Gemini Free Tier or OpenAI).
 * Falls back cleanly to parseNaturalLanguageForm if no key or API error.
 */
export async function generateFormWithByok(prompt, byok = {}) {
  const provider = String(byok.provider || '').toLowerCase();
  const apiKey = String(byok.apiKey || '').trim();
  if (!apiKey) return parseNaturalLanguageForm(prompt);

  const systemInstruction = `You are an AskForms form designer. Return ONLY valid JSON with keys: name (string), client_name (string), submit_label (string), multi_step (0 or 1), fields (array of { name, label, type: "text"|"email"|"tel"|"select"|"textarea", required: boolean, placeholder?: string, options?: string[] }). No markdown fences.`;

  try {
    let text = '';
    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstruction}\n\nUser request: ${prompt}` }] }],
          }),
        }
      );
      const data = await res.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });
      const data = await res.json();
      text = data?.choices?.[0]?.message?.content || '';
    }

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && parsed.name && Array.isArray(parsed.fields) && parsed.fields.length > 0) {
      const slug =
        String(parsed.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') +
        '-' +
        Math.random().toString(36).slice(2, 6);
      return {
        id: slug,
        name: String(parsed.name).slice(0, 60),
        client_name: String(parsed.client_name || 'Website').slice(0, 40),
        submit_label: String(parsed.submit_label || 'Send Enquiry').slice(0, 32),
        multi_step: parsed.multi_step ? 1 : 0,
        fields: parsed.fields.slice(0, 12),
        generatedBy: provider,
      };
    }
  } catch {}

  return parseNaturalLanguageForm(prompt);
}

/**
 * Built-in Zero-Cost Assistant Router:
 * Scoped strictly to:
 *   1. Creating a custom form from natural language
 *   2. Querying the user's inbox
 *   3. Summarising form analytics
 */
export async function runScopedAssistant({ message, forms = [], submissions = [], stats = {}, byok = {} }) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  // Intent 1: Analytics & Performance Summary
  if (/analytic|stat|metric|how many|count|performance|top form|conversion|spam|summary|report/i.test(lower)) {
    const activeForms = forms.filter((f) => !f.is_archived);
    const sorted = [...activeForms].sort((a, b) => (b.submission_count || 0) - (a.submission_count || 0));
    const top = sorted[0];
    const totalValid = stats.validSubmissions ?? submissions.filter((s) => !s.is_spam).length;
    const totalSpam = stats.spamBlocked ?? submissions.filter((s) => s.is_spam).length;
    const unread = submissions.filter((s) => !s.is_spam && (s.status || 'new') === 'new').length;

    const breakdown = sorted
      .slice(0, 5)
      .map((f) => `• ${f.name}: ${f.submission_count || 0} enquiries`)
      .join('\n');

    return {
      intent: 'analytics',
      reply:
        `Here is your live workspace analytics summary:\n\n` +
        `• Active forms: ${activeForms.length}\n` +
        `• Total enquiries captured: ${totalValid} (${unread} unread)\n` +
        `• Spam bots blocked: ${totalSpam}\n` +
        (top ? `• Top performing form: ${top.name} (${top.submission_count || 0} enquiries)\n` : '') +
        (breakdown ? `\nBreakdown by form:\n${breakdown}` : ''),
    };
  }

  // Intent 2: Query Inbox / Submissions
  if (/inbox|enquir|submission|lead|message|unread|new|find|search|from|urgent|recent|latest/i.test(lower) && !/create|build|make|new form|design|generate/i.test(lower)) {
    const cleanSubs = submissions.filter((s) => !s.is_spam);
    const wantsUnread = /unread|new|open/i.test(lower);
    const stopWords = new Set(['show', 'me', 'find', 'search', 'my', 'the', 'inbox', 'enquiries', 'enquiry', 'submissions', 'leads', 'messages', 'recent', 'latest', 'from', 'all', 'list', 'get', 'unread', 'new', 'in', 'for', 'with']);
    const keywords = lower
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const matches = cleanSubs.filter((s) => {
      if (wantsUnread && (s.status || 'new') !== 'new') return false;
      if (keywords.length === 0) return true;
      const hay = `${s.sender_name || ''} ${s.sender_email || ''} ${s.form_name || ''} ${JSON.stringify(s.data || {})}`.toLowerCase();
      return keywords.some((kw) => hay.includes(kw));
    });

    if (matches.length === 0) {
      return {
        intent: 'inbox',
        reply: 'No matching enquiries were found in your inbox for that search. Try asking for "recent enquiries" or "unread leads".',
        matches: [],
      };
    }

    const preview = matches
      .slice(0, 5)
      .map((s) => {
        const msg = s.data?.message || Object.values(s.data || {}).find((v) => typeof v === 'string' && v.length > 6) || 'Form submission';
        return `• ${s.sender_name || s.sender_email || 'Visitor'} (${s.form_name || s.form_id}) [${s.status || 'new'}]: "${String(msg).slice(0, 90)}"`;
      })
      .join('\n');

    return {
      intent: 'inbox',
      reply: `Found ${matches.length} matching enquir${matches.length === 1 ? 'y' : 'ies'}:\n\n${preview}`,
      matches: matches.slice(0, 5),
    };
  }

  // Intent 3: Create a Custom Form from Natural Language
  const draftForm = await generateFormWithByok(text, byok);
  const fieldList = draftForm.fields.map((f) => `• ${f.label} (${f.type}${f.required ? ', required' : ''})`).join('\n');

  return {
    intent: 'create_form',
    draftForm,
    reply:
      `I designed "${draftForm.name}" (${draftForm.multi_step ? '2-Step Layout' : 'Single-Step Layout'}) with ${draftForm.fields.length} custom fields:\n\n` +
      `${fieldList}\n\n` +
      `Click "Create Form Now" below to add it straight to your workspace.`,
  };
}

export const MCP_TOOLS_MANIFEST = [
  {
    name: 'list_forms',
    description: 'List all active AskForms forms and their submission counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_form',
    description: 'Create a new custom AskForms pop-out form from a natural language description or explicit field definitions.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Plain-English description of the form to create.' },
        name: { type: 'string', description: 'Optional explicit form title.' },
        client_name: { type: 'string', description: 'Optional project or group name.' },
        fields: { type: 'array', description: 'Optional explicit field array.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'get_recent_enquiries',
    description: 'Search and retrieve recent non-spam enquiries from the AskForms inbox.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional keyword filter (name, email, or message).' },
        limit: { type: 'number', description: 'Max enquiries to return (default 10).' },
      },
    },
  },
  {
    name: 'get_analytics',
    description: 'Return live form counts, total enquiries captured, unread leads, and spam blocked.',
    inputSchema: { type: 'object', properties: {} },
  },
];
