INSERT OR IGNORE INTO forms (
  id, name, client_name, theme_preset, email_recipients, allowed_origins, fields_json, submit_label, multi_step
) VALUES (
  'centella-audit-enquiry',
  'AI Readiness Audit & Consultation',
  'Centella',
  'teagee',
  'admin@sintiro.com.au',
  'https://centella.com.au,https://www.centella.com.au',
  '[{"name":"service","label":"How would you like to start?","type":"select","required":true,"options":["$99 AI Readiness Audit","Initial Conversation","2-3 Hour Workshop"]},{"name":"industry","label":"Industry","type":"select","required":true,"options":["Health Services & NDIS","Real Estate & Property","Construction & Trades","Other Small Business"]},{"name":"name","label":"Full Name","type":"text","required":true},{"name":"email","label":"Email Address","type":"email","required":true},{"name":"phone","label":"Phone Number","type":"tel","required":true},{"name":"message","label":"Tell us about your team","type":"textarea","required":true}]',
  'Send Enquiry',
  1
);

INSERT OR IGNORE INTO forms (
  id, name, client_name, theme_preset, email_recipients, allowed_origins, fields_json, submit_label, multi_step
) VALUES (
  'teagee-project-enquiry',
  'Project & Software Enquiry',
  'TeaGee Labs',
  'teagee',
  'admin@teageelabs.com',
  'https://teageelabs.com,https://www.teageelabs.com',
  '[{"name":"project_type","label":"What are we building?","type":"select","required":true,"options":["Custom Web App","Website & AskForms Setup","Partner Integration","Support Enquiry"]},{"name":"name","label":"Full Name","type":"text","required":true},{"name":"email","label":"Email Address","type":"email","required":true},{"name":"phone","label":"Phone Number","type":"tel","required":false},{"name":"message","label":"Project Details","type":"textarea","required":true}]',
  'Send Enquiry',
  0
);
