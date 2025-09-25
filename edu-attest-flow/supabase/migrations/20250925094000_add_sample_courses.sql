-- Add more sample courses for testing
INSERT INTO public.courses (course_id, title, syllabus_url, created_by)
VALUES 
  ('WEB101', 'Introduction to Web Development', 'https://example.com/web101-syllabus', '0xfc34AB6be08e8A18dc2a460a677C6878C79dbb88'),
  ('PYTHON101', 'Python Programming Basics', 'https://example.com/python101-syllabus', '0xfc34AB6be08e8A18dc2a460a677C6878C79dbb88'),
  ('BLOCKCHAIN101', 'Blockchain Fundamentals', 'https://example.com/blockchain101-syllabus', '0xfc34AB6be08e8A18dc2a460a677C6878C79dbb88')
ON CONFLICT (course_id) DO NOTHING;

-- Add modules for the new courses
INSERT INTO public.modules (course_id, module_id, passing_rule_json, is_checkpoint)
VALUES 
  ('WEB101', 'html_basics', '{"minScore":7,"maxTime":300}', true),
  ('WEB101', 'css_fundamentals', '{"minScore":6,"maxTime":240}', false),
  ('PYTHON101', 'python_syntax', '{"minScore":8,"maxTime":180}', true),
  ('PYTHON101', 'data_structures', '{"minScore":7,"maxTime":300}', false),
  ('BLOCKCHAIN101', 'crypto_basics', '{"minScore":9,"maxTime":360}', true),
  ('BLOCKCHAIN101', 'smart_contracts', '{"minScore":8,"maxTime":420}', false)
ON CONFLICT (course_id, module_id) DO NOTHING;