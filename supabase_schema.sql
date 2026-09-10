-- Supabase Schema and RLS Policies for QR Access and File Uploads

-- 1. Create Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    qrToken TEXT UNIQUE NOT NULL,
    dob TEXT,
    gender TEXT,
    bloodType TEXT,
    phone TEXT,
    address TEXT,
    emergencyContact TEXT,
    medicalNotes TEXT,
    userId TEXT, -- If linked to an authenticated user
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Medical Records (Documents) Table
CREATE TABLE IF NOT EXISTS public.medical_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT,
    doctorOrClinic TEXT,
    description TEXT,
    fileName TEXT,
    fileSize TEXT,
    fileType TEXT,
    imageUrl TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create QR Access Requests Table
CREATE TABLE IF NOT EXISTS public.qr_access_requests (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    qrToken TEXT,
    requesterName TEXT,
    requesterRole TEXT,
    requesterLocation TEXT,
    requestedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'allowed', 'not_allowed'
    deviceId TEXT
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_access_requests ENABLE ROW LEVEL SECURITY;

-- Patients RLS Policies
-- Patients can view and update their own records
CREATE POLICY "Users can manage their own patient record"
    ON public.patients FOR ALL
    TO authenticated
    USING (userId = auth.uid()::text)
    WITH CHECK (userId = auth.uid()::text);

-- QR Access Requests RLS Policies
-- Patients can read and update requests targeted at them
CREATE POLICY "Patients can view requests for their profile"
    ON public.qr_access_requests FOR SELECT
    TO authenticated
    USING (patientId IN (SELECT id FROM public.patients WHERE userId = auth.uid()::text));

CREATE POLICY "Patients can update requests for their profile"
    ON public.qr_access_requests FOR UPDATE
    TO authenticated
    USING (patientId IN (SELECT id FROM public.patients WHERE userId = auth.uid()::text));

-- Anyone (including doctors scanning) can insert a new request
CREATE POLICY "Anyone can submit a QR access request"
    ON public.qr_access_requests FOR INSERT
    TO public
    WITH CHECK (true);

-- Storage configuration for Medical Documents (PDFs, Images)
-- Ensure you have created a storage bucket named "app.files" in your Supabase dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app.files', 'app.files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can upload files to their own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'app.files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update and delete their own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'app.files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'app.files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Since QR scans require doctors to view the files once access is granted, 
-- and the app uses the public URL, we allow public read access to the bucket.
-- If strict privacy is required on the storage level, you would use signed URLs 
-- and change this policy to only allow authenticated reads or reads where the 
-- request status is 'allowed'.
CREATE POLICY "Public Read Access for Documents"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'app.files');
