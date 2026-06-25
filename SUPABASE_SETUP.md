# Supabase Setup Guide for Aleyart Academy

## Step 1: Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/login
3. Click "New Project"
4. Enter project details:
   - Name: `aleyart-academy`
   - Database Password: (generate a strong password)
   - Region: Choose closest to Ghana (e.g., Frankfurt or London)
5. Click "Create new project" and wait for it to initialize

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

## Step 3: Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the following SQL, then click "Run":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (teachers and admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  full_name TEXT NOT NULL,
  assigned_class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE,
  parent_name TEXT,
  parent_phone TEXT,
  total_fees DECIMAL(10,2) DEFAULT 0,
  fees_paid DECIMAL(10,2) DEFAULT 0,
  fees_balance DECIMAL(10,2) DEFAULT 0,
  fee_status TEXT DEFAULT 'pending' CHECK (fee_status IN ('pending', 'partial', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_score INTEGER DEFAULT 0,
  exam_score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  grade TEXT,
  remark TEXT,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject, term, academic_year)
);

-- Fee payments table
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terminal reports table
CREATE TABLE terminal_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  assessments JSONB,
  total_score INTEGER DEFAULT 0,
  position INTEGER,
  total_students INTEGER,
  interest TEXT,
  conduct TEXT,
  class_teacher_remark TEXT,
  attendance TEXT,
  aggregate INTEGER,
  subject_positions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, term, academic_year)
);

-- Create indexes for better performance
CREATE INDEX idx_students_class ON students(class_name);
CREATE INDEX idx_assessments_class ON assessments(class_name, term, academic_year);
CREATE INDEX idx_assessments_student ON assessments(student_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_terminal_reports_class ON terminal_reports(class_name, term, academic_year);

-- Insert default admin user
INSERT INTO users (username, password, role, full_name) 
VALUES ('admin', 'admin123', 'admin', 'Administrator');

-- Enable Row Level Security (RLS) - but allow all for simplicity
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_reports ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for simplicity in school environment)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for assessments" ON assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for fee_payments" ON fee_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for terminal_reports" ON terminal_reports FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE fee_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE terminal_reports;
```

## Step 4: Update Your Application

After running the SQL, update the file `src/lib/supabase.ts` with your actual Supabase credentials:

```typescript
const supabaseUrl = 'YOUR_PROJECT_URL';  // e.g., https://xxxxx.supabase.co
const supabaseAnonKey = 'YOUR_ANON_KEY'; // Your anon public key
```

## Step 5: Deploy for Free

### Option A: Deploy on Vercel (Recommended)
1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Deploy!

### Option B: Deploy on Netlify
1. Push your code to GitHub
2. Go to [https://netlify.com](https://netlify.com)
3. Import your repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables in Site settings
7. Deploy!

### Option C: Deploy on Cloudflare Pages
1. Push your code to GitHub
2. Go to [https://pages.cloudflare.com](https://pages.cloudflare.com)
3. Connect your repository
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

## Testing Real-time Sync

1. Open the app in two different browser windows
2. Login as admin in both
3. Add a student in one window
4. Watch it appear instantly in the other window!

## Troubleshooting

- **Real-time not working?** Make sure you ran the `ALTER PUBLICATION` commands
- **Can't connect?** Check your Supabase URL and anon key are correct
- **Getting RLS errors?** Make sure you created the policies

## Support

For Supabase issues: [https://supabase.com/docs](https://supabase.com/docs)
