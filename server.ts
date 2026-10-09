import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Generous body limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data and upload directories exist
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

const STORE_FILE = path.join(DATA_DIR, 'store.json');

// ============================================================================
// INITIAL SEED DATA
// ============================================================================
const initialPosters = [
  {
    id: 'poster-1',
    title: 'Admissions Open 2026-2027: Matric & Intermediate Programs',
    category: 'Admissions',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    description: 'Admissions open for Class 9, Class 10, FSc Pre-Medical, Pre-Engineering, and ICS. Merit scholarships up to 100% available.',
    event_date: 'Deadline: 15 November 2026',
    target_audience: 'Aspiring Female Scholars & Parents',
    is_active: true,
    display_order: 1,
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'poster-2',
    title: 'Annual Science & Robotics Exhibition 2026',
    category: 'Competition',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    description: 'Showcasing revolutionary STEM prototypes, artificial intelligence applications, and renewable energy research projects designed by our students.',
    event_date: '28 October 2026',
    target_audience: 'All Students, Teachers & Guests',
    is_active: true,
    display_order: 2,
    created_at: '2026-10-02T10:00:00Z',
  },
  {
    id: 'poster-3',
    title: 'Federal Board High Achievers & Gold Medalist Ceremony',
    category: 'Academic Notice',
    image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    description: 'Honoring top position holders and distinction awardees of Federal Board SSC & HSSC examinations 2026.',
    event_date: '10 November 2026',
    target_audience: 'High Achievers & Proud Families',
    is_active: true,
    display_order: 3,
    created_at: '2026-10-03T10:00:00Z',
  },
  {
    id: 'poster-4',
    title: 'Inter-College Women Athletics & Badminton Championship',
    category: 'Sports Gala',
    image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    description: 'Annual sports festival encouraging physical fitness, leadership qualities, and teamwork in female youth.',
    event_date: '05 December 2026',
    target_audience: 'College Athletes & Enthusiasts',
    is_active: true,
    display_order: 4,
    created_at: '2026-10-04T10:00:00Z',
  }
];

const initialAdmissions = [
  {
    id: 'adm-001',
    student_name: 'Mahnoor Fatima',
    date_of_birth: '2010-04-12',
    gender: 'Female',
    email: 'mahnoor.f@example.com',
    phone: '0300-1234567',
    address: 'House 14, Street 25, Sector G-10/2',
    city: 'Islamabad',
    province: 'Islamabad Capital Territory',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    previous_school: 'Islamabad Model College for Girls',
    previous_class: 'Class 8 (Matric Track)',
    previous_grade: 'Class 8 (Grade A+)',
    parent_name: 'Muhammad Tariq',
    guardian_relationship: 'Father',
    parent_relationship: 'Father',
    parent_phone: '0300-1234567',
    whatsapp_number: '0300-1234567',
    parent_whatsapp: '0300-1234567',
    parent_email: 'tariq.m@example.com',
    parent_occupation: 'Senior Accounts Officer (Govt of Pakistan)',
    cnic_number: '61101-1234567-1',
    parent_cnic: '61101-1234567-1',
    program_applied: 'Matric Science (Class 9 & 10)',
    class_grade_applying: 'Class 9 (Matric Science)',
    class_applying_for: 'Class 9 (Matric Science)',
    documents_url: [
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'pending',
    admin_notes: 'Previous marksheet shows 94% marks in Federal Board middle examinations. Interview scheduled.',
    created_at: '2026-10-05T14:32:00Z',
    updated_at: '2026-10-05T14:32:00Z'
  },
  {
    id: 'adm-002',
    student_name: 'Ayesha Tariq',
    date_of_birth: '2009-08-20',
    gender: 'Female',
    email: 'ayesha.t@example.com',
    phone: '0321-9876543',
    address: 'B-42, Westridge 1, Peshawar Road',
    city: 'Rawalpindi',
    province: 'Punjab',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    previous_school: 'Army Public School & College (APS)',
    previous_class: 'Class 10 Matric',
    previous_grade: 'Matric (1045/1100)',
    parent_name: 'Brigadier (R) Tariq Bilal',
    guardian_relationship: 'Father',
    parent_relationship: 'Father',
    parent_phone: '0321-9876543',
    whatsapp_number: '0321-9876543',
    parent_whatsapp: '0321-9876543',
    parent_email: 'tariq.bilal@example.com',
    parent_occupation: 'Retired Army Officer & Consultant',
    cnic_number: '37405-9876543-1',
    parent_cnic: '37405-9876543-1',
    program_applied: 'FSc Pre-Medical (Intermediate Part 1 & 2)',
    class_grade_applying: 'FSc Pre-Medical Part 1',
    class_applying_for: 'FSc Pre-Medical Part 1',
    documents_url: [
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'approved',
    admin_notes: 'Academic dossier verified. Qualified for Merit Scholarship for FBISE High Achievers.',
    created_at: '2026-10-03T11:15:00Z',
    updated_at: '2026-10-06T09:40:00Z'
  }
];

const initialTestimonials = [
  {
    id: 'test-1',
    student_name: 'Fatima Zahra',
    author: 'Fatima Zahra',
    student_class: 'FSc Pre-Medical (FBISE Position Holder)',
    role: 'FSc Pre-Medical (FBISE Position Holder)',
    quote: 'Girls Academy Islamabad transformed my academic foundation. The dedicated female faculty and competitive lab environment gave me the discipline to top the Federal Board examinations with 1,096 marks.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    is_active: true,
    is_approved: true,
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'test-2',
    student_name: 'Dr. Shahida Parveen',
    author: 'Dr. Shahida Parveen',
    student_class: 'Mother of Ayesha (Matric Science Gold Medalist)',
    role: 'Mother of Ayesha (Matric Science Gold Medalist)',
    quote: 'As parents, finding an educational institute that balances top-tier STEM academics with Islamic values and total safety for young women was our priority. Girls Academy exceeded all our expectations.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    is_active: true,
    is_approved: true,
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'test-3',
    student_name: 'Zainab Khan',
    author: 'Zainab Khan',
    student_class: 'ICS Computer Science (Software Engineering Aspirant)',
    role: 'ICS Computer Science (Software Engineering Aspirant)',
    quote: 'The computer science laboratories and robotics mentoring at Girls Academy are second to none. We were encouraged to code, innovate, and participate in national tech Olympiads.',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    is_active: true,
    is_approved: true,
    created_at: '2026-09-25T10:00:00Z',
  }
];

const initialTerms = [
  { id: 'term-1', name: 'Term 1 (First Term): April – June', academic_year: '2026-2027', start_date: '2026-04-01', end_date: '2026-06-30', is_active: true },
  { id: 'term-2', name: 'Mid-Year Exams: October', academic_year: '2026-2027', start_date: '2026-10-01', end_date: '2026-10-25', is_active: false },
  { id: 'term-3', name: 'Term 2 (Second Term / Annual): February – March', academic_year: '2026-2027', start_date: '2027-02-01', end_date: '2027-03-31', is_active: false },
];

const initialClasses = [
  { id: 'class-1', name: 'Class 9 (Science)', course_id: 'c-3', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-2', name: 'Class 10 (Science)', course_id: 'c-3', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-3', name: 'Class 9 (Arts)', course_id: 'c-4', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-4', name: 'Class 10 (Arts)', course_id: 'c-4', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-5', name: 'Class 9 (Commerce)', course_id: 'c-5', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-6', name: 'Class 10 (Commerce)', course_id: 'c-5', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-7', name: 'FSc Pre-Medical (1st Year)', course_id: 'c-6', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-8', name: 'FSc Pre-Medical (2nd Year)', course_id: 'c-6', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-9', name: 'FSc Pre-Engineering (1st Year)', course_id: 'c-7', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-10', name: 'FSc Pre-Engineering (2nd Year)', course_id: 'c-7', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-11', name: 'FA — Faculty of Arts (1st Year)', course_id: 'c-8', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-12', name: 'FA — Faculty of Arts (2nd Year)', course_id: 'c-8', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-13', name: 'ICS — Computer Science (1st Year)', course_id: 'c-9', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-14', name: 'ICS — Computer Science (2nd Year)', course_id: 'c-9', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-15', name: 'I.Com — Commerce (1st Year)', course_id: 'c-10', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-16', name: 'I.Com — Commerce (2nd Year)', course_id: 'c-10', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-17', name: 'Class 8 (Middle)', course_id: 'c-2', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-18', name: 'Class 7 (Middle)', course_id: 'c-2', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-19', name: 'Class 6 (Middle)', course_id: 'c-2', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-20', name: 'Class 5 (Primary)', course_id: 'c-1', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-21', name: 'Nursery / KG', course_id: 'c-1', term_id: 'term-1', created_at: '2026-01-01T00:00:00Z' },
];

const initialCourses = [
  {
    id: 'c-1',
    title: 'Primary Program (Nursery – Class 5)',
    description: 'Primary Education — Core Subjects: English, Mathematics, General Science, Social Studies, and Ethics',
    level: 'Primary',
    category: 'School',
    duration: '7 Years',
    schedule: 'Mon-Sat, 8:00 AM – 1:00 PM',
    fee_info: 'Rs. 2,500 – 3,000/month',
    instructor_name: 'Primary Section Head',
    thumbnail_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-2',
    title: 'Middle School (Class 6 – 8)',
    description: 'Middle School — English, Mathematics, Science, Social Studies, and Computer Science',
    level: 'Middle',
    category: 'School',
    duration: '3 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 3,500/month',
    instructor_name: 'Middle Section Head',
    thumbnail_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-3',
    title: 'Matric Science (Class 9 – 10)',
    description: 'Matric Science — Physics, Chemistry, Biology, Mathematics | BISE Board',
    level: 'Secondary',
    category: 'Matric',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 4,500/month',
    instructor_name: 'Science Department (BISE Specialist)',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-4',
    title: 'Matric Arts (Class 9 – 10)',
    description: 'Matric Arts — English, General Science, Civics, History | BISE Board',
    level: 'Secondary',
    category: 'Matric',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 4,000/month',
    instructor_name: 'Arts Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-5',
    title: 'Matric Commerce (Class 9 – 10)',
    description: 'Matric Commerce — Principles of Accounting, Economics, Commerce | BISE Board',
    level: 'Secondary',
    category: 'Matric',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 4,000/month',
    instructor_name: 'Commerce Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-6',
    title: 'FSc Pre-Medical (1st & 2nd Year)',
    description: 'FSc Pre-Medical — Physics, Chemistry, Biology | MDCAT Preparation',
    level: 'Higher Secondary',
    category: 'FSc',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 5,500/month',
    instructor_name: 'FSc Science Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-7',
    title: 'FSc Pre-Engineering (1st & 2nd Year)',
    description: 'FSc Pre-Engineering — Physics, Chemistry, Mathematics | ECAT Preparation',
    level: 'Higher Secondary',
    category: 'FSc',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 5,500/month',
    instructor_name: 'FSc Science Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-8',
    title: 'FA — Faculty of Arts (1st & 2nd Year)',
    description: 'FA Arts — English, Psychology, Civics, Education, Literature',
    level: 'Higher Secondary',
    category: 'FA',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 4,500/month',
    instructor_name: 'Arts Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-9',
    title: 'ICS Computer Science (1st & 2nd Year)',
    description: 'ICS — Computer Science, Mathematics, Physics / Statistics | Software Foundations',
    level: 'Higher Secondary',
    category: 'ICS',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 5,500/month',
    instructor_name: 'Computer Science Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    is_active: true
  },
  {
    id: 'c-10',
    title: 'I.Com Commerce (1st & 2nd Year)',
    description: 'I.Com — Accounting, Banking, Commercial Geography, Economics',
    level: 'Higher Secondary',
    category: 'I.Com',
    duration: '2 Years',
    schedule: 'Mon-Sat, 8:00 AM – 2:00 PM',
    fee_info: 'Rs. 4,500/month',
    instructor_name: 'Commerce Department',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    is_active: true
  }
];

const initialSubjects = [
  { id: 'subj-1', name: 'Physics', course_id: 'c-3' },
  { id: 'subj-2', name: 'Chemistry', course_id: 'c-3' },
  { id: 'subj-3', name: 'Biology', course_id: 'c-3' },
  { id: 'subj-4', name: 'Mathematics', course_id: 'c-3' },
  { id: 'subj-5', name: 'Urdu Literature & Language', course_id: 'c-3' },
  { id: 'subj-6', name: 'English Compulsory & Composition', course_id: 'c-3' },
  { id: 'subj-7', name: 'Ethics & Values Compulsory', course_id: 'c-3' },
  { id: 'subj-pm1', name: 'Biology (HSSC Pre-Medical)', course_id: 'c-6' },
  { id: 'subj-pm2', name: 'Physics (HSSC Part 1 & 2)', course_id: 'c-6' },
  { id: 'subj-pm3', name: 'Chemistry (HSSC Organic & Inorganic)', course_id: 'c-6' },
  { id: 'subj-ics1', name: 'Computer Science & Programming (C/C++)', course_id: 'c-9' },
  { id: 'subj-ics2', name: 'Mathematics (Calculus & Analytical Geometry)', course_id: 'c-9' },
];

const initialSiteSettings: Record<string, string> = {
  academy_name: 'Girls Academy',
  school_name: 'Girls Academy',
  academy_tagline: 'Quality Education — Inspiring Women Leaders',
  tagline: 'Quality Education — Inspiring Women Leaders',
  academy_email: 'info@girlsacademy.edu.pk',
  admissions_email: 'info@girlsacademy.edu.pk',
  contact_email: 'info@girlsacademy.edu.pk',
  academy_phone: '051-4861234',
  phone_number: '051-4861234',
  contact_phone: '051-4861234',
  academy_whatsapp: '0300-4861234',
  academy_address: 'Street 5, Sector G-11/2, Islamabad, Pakistan',
  campus_address: 'Street 5, Sector G-11/2, Islamabad, Pakistan',
  address: 'Street 5, Sector G-11/2, Islamabad, Pakistan',
  academy_city: 'Islamabad',
  city_state: 'Islamabad, ICT',
  academy_province: 'Islamabad Capital Territory',
  facebook_url: 'https://facebook.com/girlsacademy',
  instagram_url: 'https://instagram.com/girlsacademy',
  youtube_url: 'https://youtube.com/girlsacademy',
  whatsapp_url: 'https://wa.me/923004861234',
  hero_title: 'Welcome to Girls Academy',
  hero_subtitle: 'Premier College for Women in Islamabad — Academic Excellence and Leadership',
  hero_image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
  total_students: '1250',
  total_teachers: '48',
  total_courses: '10',
  years_of_excellence: '18',
  about_story: 'Empowering future women leaders through academic excellence and values-based mentorship',
  principal_name: 'Mrs. Raheela Perveen',
  principal_designation: 'Principal & Head of Institution (M.Ed, University of the Punjab)',
  principal_message: 'We firmly believe that every young woman possesses limitless potential that blooms with dedicated mentorship.',
  principal_photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  admission_open: 'true',
  admissions_open: 'true',
  admission_last_date: '31/03/2026',
  admission_instructions: 'Online admissions for Session 2026-2027 are now open. Please upload student B-Form, previous report card, and father/guardian CNIC.',
  academic_year: '2026-2027',
  logo_text_first: 'Girls',
  logo_text_second: 'Academy'
};

interface AppStore {
  posters: any[];
  admissions: any[];
  testimonials: any[];
  classes: any[];
  terms?: any[];
  courses: any[];
  subjects: any[];
  site_settings: Record<string, string>;
  events?: any[];
  blogs?: any[];
  gallery?: any[];
  banners?: any[];
  hero_slides?: any[];
  announcements?: any[];
  popups?: any[];
  supabase_config?: { url: string; anon_key: string };
}

function loadStore(): AppStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        posters: Array.isArray(parsed.posters) && parsed.posters.length > 0 ? parsed.posters : initialPosters,
        admissions: Array.isArray(parsed.admissions) ? parsed.admissions : initialAdmissions,
        testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : initialTestimonials,
        classes: Array.isArray(parsed.classes) && parsed.classes.length > 0 ? parsed.classes : initialClasses,
        terms: Array.isArray(parsed.terms) && parsed.terms.length > 0 ? parsed.terms : initialTerms,
        courses: Array.isArray(parsed.courses) && parsed.courses.length > 0 ? parsed.courses : initialCourses,
        subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0 ? parsed.subjects : initialSubjects,
        site_settings: parsed.site_settings && typeof parsed.site_settings === 'object' ? parsed.site_settings : initialSiteSettings,
        events: Array.isArray(parsed.events) ? parsed.events : [],
        blogs: Array.isArray(parsed.blogs) ? parsed.blogs : [],
        gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
        banners: Array.isArray(parsed.banners) ? parsed.banners : [],
        hero_slides: Array.isArray(parsed.hero_slides) ? parsed.hero_slides : [],
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        popups: Array.isArray(parsed.popups) ? parsed.popups : [],
        supabase_config: parsed.supabase_config || {
          url: process.env.VITE_SUPABASE_URL || '',
          anon_key: process.env.VITE_SUPABASE_ANON_KEY || ''
        }
      };
    }
  } catch (err) {
    console.warn('Error reading store file, creating fresh:', err);
  }
  const defaultStore: AppStore = {
    posters: initialPosters,
    admissions: initialAdmissions,
    testimonials: initialTestimonials,
    classes: initialClasses,
    terms: initialTerms,
    courses: initialCourses,
    subjects: initialSubjects,
    site_settings: initialSiteSettings,
    events: [],
    blogs: [],
    gallery: [],
    banners: [],
    hero_slides: [],
    announcements: [],
    popups: [],
    supabase_config: {
      url: process.env.VITE_SUPABASE_URL || '',
      anon_key: process.env.VITE_SUPABASE_ANON_KEY || ''
    }
  };
  saveStore(defaultStore);
  return defaultStore;
}

function saveStore(store: AppStore): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store file:', err);
  }
}

// Global in-memory cache synchronized with disk
let dbStore = loadStore();

// ============================================================================
// IMAGE / FILE UPLOAD API
// ============================================================================
app.post('/api/upload', (req, res) => {
  try {
    const { image, dataUrl, filename } = req.body;
    const rawData = image || dataUrl;

    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({ error: 'Image data URL is required' });
    }

    // If it's already an HTTP URL or local uploads path, return it directly
    if (rawData.startsWith('http://') || rawData.startsWith('https://') || rawData.startsWith('/uploads/')) {
      return res.json({ url: rawData, success: true });
    }

    // Match data URI scheme: data:image/jpeg;base64,....
    const matches = rawData.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('svg')) ext = 'svg';

    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    res.json({ url: publicUrl, success: true });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// ============================================================================
// POSTERS API
// ============================================================================
app.get('/api/posters', (req, res) => {
  const { activeOnly } = req.query;
  let list = [...dbStore.posters].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });
  if (activeOnly === 'true') {
    list = list.filter(p => p.is_active);
  }
  res.json(list);
});

app.post('/api/posters', (req, res) => {
  try {
    const posterData = req.body;
    const newPoster = {
      ...posterData,
      id: posterData.id || `poster-${Date.now()}`,
      created_at: posterData.created_at || new Date().toISOString(),
      is_active: posterData.is_active !== undefined ? posterData.is_active : true,
      display_order: posterData.display_order || 1
    };

    dbStore.posters = [newPoster, ...dbStore.posters.filter(p => p.id !== newPoster.id)];
    saveStore(dbStore);
    res.status(201).json(newPoster);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/posters/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = dbStore.posters.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Poster not found' });
  }
  dbStore.posters[idx] = { ...dbStore.posters[idx], ...updates, updated_at: new Date().toISOString() };
  saveStore(dbStore);
  res.json(dbStore.posters[idx]);
});

app.delete('/api/posters/:id', (req, res) => {
  const { id } = req.params;
  dbStore.posters = dbStore.posters.filter(p => p.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// TESTIMONIALS / REVIEWS API
// ============================================================================
app.get('/api/testimonials', (req, res) => {
  const { approvedOnly } = req.query;
  let list = [...dbStore.testimonials].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });
  if (approvedOnly === 'true') {
    list = list.filter(t => t.is_approved !== false && t.is_active !== false);
  }
  res.json(list);
});

app.post('/api/testimonials', (req, res) => {
  try {
    const item = req.body;
    const authorName = item.student_name || item.author || 'Anonymous Scholar';
    const newTestimonial = {
      ...item,
      id: item.id || `test-${Date.now()}`,
      student_name: authorName,
      author: authorName,
      student_class: item.student_class || item.role || 'Visitor / Scholar',
      role: item.student_class || item.role || 'Visitor / Scholar',
      quote: item.quote || item.feedback || '',
      avatar_url: item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: item.rating || 5,
      is_active: item.is_active !== undefined ? item.is_active : true,
      is_approved: item.is_approved !== undefined ? item.is_approved : true, // Visible immediately
      created_at: item.created_at || new Date().toISOString()
    };

    dbStore.testimonials.unshift(newTestimonial);
    saveStore(dbStore);
    res.status(201).json(newTestimonial);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/testimonials/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = dbStore.testimonials.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Testimonial not found' });
  }
  dbStore.testimonials[idx] = { ...dbStore.testimonials[idx], ...updates, updated_at: new Date().toISOString() };
  saveStore(dbStore);
  res.json(dbStore.testimonials[idx]);
});

app.delete('/api/testimonials/:id', (req, res) => {
  const { id } = req.params;
  dbStore.testimonials = dbStore.testimonials.filter(t => t.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// CLASSES API
// ============================================================================
app.get('/api/classes', (_req, res) => {
  // Always return newest/recently created classes first
  const sorted = [...dbStore.classes].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });
  res.json(sorted);
});

app.post('/api/classes', (req, res) => {
  try {
    const data = req.body;
    const newClass = {
      ...data,
      id: data.id || `class-${Date.now()}`,
      created_at: data.created_at || new Date().toISOString(),
    };
    dbStore.classes = [newClass, ...dbStore.classes.filter(c => c.id !== newClass.id)];
    saveStore(dbStore);
    res.status(201).json(newClass);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = dbStore.classes.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }
  dbStore.classes[idx] = { ...dbStore.classes[idx], ...updates };
  saveStore(dbStore);
  res.json(dbStore.classes[idx]);
});

app.delete('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  dbStore.classes = dbStore.classes.filter(c => c.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// TERMS API
// ============================================================================
app.get('/api/terms', (_req, res) => {
  res.json(Array.isArray(dbStore.terms) && dbStore.terms.length > 0 ? dbStore.terms : initialTerms);
});

app.post('/api/terms', (req, res) => {
  try {
    const data = req.body;
    const newTerm = {
      ...data,
      id: data.id || `term-${Date.now()}`,
    };
    if (!Array.isArray(dbStore.terms)) dbStore.terms = [...initialTerms];
    dbStore.terms = [newTerm, ...dbStore.terms.filter(t => t.id !== newTerm.id)];
    saveStore(dbStore);
    res.status(201).json(newTerm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/terms/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!Array.isArray(dbStore.terms)) dbStore.terms = [...initialTerms];
  const idx = dbStore.terms.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Term not found' });
  dbStore.terms[idx] = { ...dbStore.terms[idx], ...updates };
  saveStore(dbStore);
  res.json(dbStore.terms[idx]);
});

app.delete('/api/terms/:id', (req, res) => {
  const { id } = req.params;
  if (!Array.isArray(dbStore.terms)) dbStore.terms = [...initialTerms];
  dbStore.terms = dbStore.terms.filter(t => t.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// COURSES API
// ============================================================================
app.get('/api/courses', (req, res) => {
  const { activeOnly } = req.query;
  let list = [...dbStore.courses].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });
  if (activeOnly === 'true') {
    list = list.filter(c => c.is_active);
  }
  res.json(list);
});

app.post('/api/courses', (req, res) => {
  try {
    const data = req.body;
    const newCourse = {
      ...data,
      id: data.id || `course-${Date.now()}`,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: data.created_at || new Date().toISOString(),
    };
    dbStore.courses = [newCourse, ...dbStore.courses.filter(c => c.id !== newCourse.id)];
    saveStore(dbStore);
    res.status(201).json(newCourse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = dbStore.courses.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  dbStore.courses[idx] = { ...dbStore.courses[idx], ...updates };
  saveStore(dbStore);
  res.json(dbStore.courses[idx]);
});

app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  dbStore.courses = dbStore.courses.filter(c => c.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// SUBJECTS API
// ============================================================================
app.get('/api/subjects', (req, res) => {
  const { course_id } = req.query;
  let list = dbStore.subjects;
  if (course_id) {
    list = list.filter(s => s.course_id === course_id);
  }
  res.json(list);
});

app.post('/api/subjects', (req, res) => {
  try {
    const data = req.body;
    const newSubj = {
      ...data,
      id: data.id || `subj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    dbStore.subjects = [newSubj, ...dbStore.subjects.filter(s => s.id !== newSubj.id)];
    saveStore(dbStore);
    res.status(201).json(newSubj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = dbStore.subjects.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Subject not found' });
  dbStore.subjects[idx] = { ...dbStore.subjects[idx], ...updates };
  saveStore(dbStore);
  res.json(dbStore.subjects[idx]);
});

app.delete('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  dbStore.subjects = dbStore.subjects.filter(s => s.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// ADMISSIONS API
// ============================================================================
app.get('/api/admissions', (req, res) => {
  const { status, search } = req.query;
  let records = [...dbStore.admissions].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  if (status && status !== 'all') {
    records = records.filter(r => (r.status || '').toLowerCase() === String(status).toLowerCase());
  }

  if (search) {
    const s = String(search).toLowerCase();
    records = records.filter(r =>
      (r.student_name && r.student_name.toLowerCase().includes(s)) ||
      (r.email && r.email.toLowerCase().includes(s)) ||
      (r.phone && r.phone.toLowerCase().includes(s)) ||
      (r.program_applied && r.program_applied.toLowerCase().includes(s))
    );
  }

  res.json(records);
});

app.post('/api/admissions', (req, res) => {
  try {
    const data = req.body;
    const newAdmission = {
      ...data,
      id: data.id || `adm-${Date.now().toString().slice(-6)}`,
      status: data.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.admissions = [newAdmission, ...dbStore.admissions.filter(a => a.id !== newAdmission.id)];
    saveStore(dbStore);
    res.status(201).json(newAdmission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admissions/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = dbStore.admissions.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Admission application not found' });
  }
  dbStore.admissions[idx] = {
    ...dbStore.admissions[idx],
    ...updates,
    updated_at: new Date().toISOString()
  };
  saveStore(dbStore);
  res.json(dbStore.admissions[idx]);
});

app.delete('/api/admissions/:id', (req, res) => {
  const { id } = req.params;
  dbStore.admissions = dbStore.admissions.filter(a => a.id !== id);
  saveStore(dbStore);
  res.json({ success: true });
});

// ============================================================================
// SITE SETTINGS API
// ============================================================================
app.get('/api/site-settings', (_req, res) => {
  res.json(dbStore.site_settings || initialSiteSettings);
});

app.put('/api/site-settings', (req, res) => {
  try {
    const updates = req.body;
    dbStore.site_settings = { ...(dbStore.site_settings || initialSiteSettings), ...updates };
    saveStore(dbStore);
    res.json(dbStore.site_settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DATABASE & SYNC STATUS & CONFIG API
// ============================================================================
app.get('/api/database/status', (_req, res) => {
  res.json({
    status: 'connected',
    engine: 'full-stack-live-sync',
    storage_file: STORE_FILE,
    supabase_configured: Boolean(dbStore.supabase_config?.url && dbStore.supabase_config?.anon_key),
    counts: {
      posters: dbStore.posters.length,
      testimonials: dbStore.testimonials.length,
      classes: dbStore.classes.length,
      courses: dbStore.courses.length,
      subjects: dbStore.subjects.length,
      admissions: dbStore.admissions.length,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/database/config', (_req, res) => {
  res.json({
    supabase_url: dbStore.supabase_config?.url || process.env.VITE_SUPABASE_URL || '',
    has_key: Boolean(dbStore.supabase_config?.anon_key || process.env.VITE_SUPABASE_ANON_KEY),
  });
});

app.post('/api/database/config', (req, res) => {
  try {
    const { supabase_url, supabase_anon_key } = req.body;
    dbStore.supabase_config = {
      url: (supabase_url || '').trim(),
      anon_key: (supabase_anon_key || '').trim(),
    };
    saveStore(dbStore);
    res.json({ success: true, message: 'Database configuration saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// GEMINI AI CHATBOT API
// ============================================================================
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ACADEMY_SYSTEM_INSTRUCTION = `
You are the official 24/7 AI Counselor and Student Admissions Advisor for "Girls Academy Islamabad".
Your goal is to assist students, parents, and prospective applicants with accurate, courteous, and detailed information about the academy.

Campus Profile & Key Information:
- Institution: Girls Academy Islamabad (Premier Girls Educational Institute).
- Campus Location: Street 5, Sector G-11/2, Islamabad, Pakistan.
- Affiliation: Officially affiliated with Federal Board of Intermediate and Secondary Education (FBISE) and BISE Islamabad.
- Contact Number: 051-4861234 / 0300-4861234.
- Official Email: info@girlsacademy.edu.pk / admissions@girlsacademy.edu.pk.
- Campus Timings: Monday to Friday: 8:00 AM – 2:00 PM. Saturday: Tutorial & Doubt-clearing sessions (9:00 AM – 1:00 PM). Sunday: Closed.

Academic Programs Offered:
1. Primary School (Class 1 to 5): English, Urdu, Math, General Knowledge, Ethics & Quranic Studies.
2. Middle School (Class 6 to 8): English, Urdu, Math, General Science, Social Studies, Islamiat, Computer.
3. Matriculation (Class 9 & 10):
   - Science Group (Physics, Chemistry, Biology / Computer Science, Math)
   - Arts & Humanities Group (General Science, Civics, Islamic Studies, Education)
   - Commerce Group (Principles of Accounting, General Math, Commercial Geography)
4. Intermediate / College (Class 11 & 12):
   - FSc Pre-Medical (Biology, Physics, Chemistry)
   - FSc Pre-Engineering (Mathematics, Physics, Chemistry)
   - ICS (Computer Science, Physics / Statistics, Mathematics)
   - I.Com (Accounting, Commerce, Economics, Banking)
   - FA (Fine Arts, Psychology, English Literature, Islamic History)

Fee Structure (Monthly Tuition):
- Primary (Class 1-5): Rs. 3,000 / month
- Middle (Class 6-8): Rs. 3,500 / month
- Matric (Class 9-10): Rs. 4,000 to Rs. 4,500 / month
- Intermediate / College (FSc, ICS, FA, I.Com): Rs. 4,500 to Rs. 5,500 / month
- Admission Registration: One-time nominal fee.
- Merit Scholarships & Need-Based Concessions: Available for top achievers (85%+ marks in previous exams).

Facilities & Features:
- Modern Science Labs (Physics, Chemistry, Biology) and Computer Lab with high-speed internet.
- Safe, gated, GPS-tracked Pick & Drop van service covering all major sectors of Islamabad & Rawalpindi.
- All-female faculty and secure female-only campus environment with CCTV surveillance and security guards.
- Library, sports ground, debate clubs, and STEM competitions.
- Regular BISE Position Holders and 98%+ pass rate in board examinations.

Language Guidelines:
- You must respond in the same language the user uses.
- If the user asks in English, respond in clear, professional English.
- If the user asks in Roman Urdu (e.g., "admission kab khulenge", "fees kitni hai", "timing kya hai"), respond in polite, natural Roman Urdu!
- If the user asks in Urdu script (اردو), respond in polite, natural Urdu script!
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      return res.json({ reply: getLocalBotResponse(message) });
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user' && item.text) {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'bot' && item.text) {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: ACADEMY_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || getLocalBotResponse(message);
    res.json({ reply });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    res.json({ reply: getLocalBotResponse(req.body.message || '') });
  }
});

function getLocalBotResponse(query: string): string {
  const q = query.toLowerCase().trim();

  if (/^(hi|hello|hey|salam|assalam|aoa|asalam|kese|kaise|kia haal|kya hal)/.test(q)) {
    return "Walaikum Assalam & Welcome to Girls Academy Islamabad! How can I assist you today with admissions, fee details, academic courses, or campus timings?";
  }
  if (q.includes('admiss') || q.includes('dakhla') || q.includes('apply') || q.includes('form') || q.includes('seat')) {
    return "Admissions for Session 2026-2027 are currently OPEN! You can apply directly through our online Admissions form on this website. Phone: 051-4861234.";
  }
  if (q.includes('fee') || q.includes('fees') || q.includes('kharacha') || q.includes('charges') || q.includes('cost') || q.includes('scholarship')) {
    return "Girls Academy Monthly Tuition Fees:\n• Primary (Class 1-5): Rs. 3,000 / month\n• Middle (Class 6-8): Rs. 3,500 / month\n• Matric (Science/Arts): Rs. 4,000 - 4,500 / month\n• Intermediate (FSc / ICS / I.Com): Rs. 4,500 - 5,500 / month\n\nMerit scholarships (up to 50% discount) available for 85%+ marks!";
  }
  if (q.includes('timing') || q.includes('time') || q.includes('auqat') || q.includes('schedule') || q.includes('chutti') || q.includes('subah')) {
    return "Girls Academy Campus Timings:\n• Regular Classes: Monday to Friday, 8:00 AM – 2:00 PM\n• Saturday: Tutorial & Mentorship Classes, 9:00 AM – 1:00 PM\n• Sunday: Closed.";
  }
  if (q.includes('course') || q.includes('program') || q.includes('subject') || q.includes('matric') || q.includes('fsc') || q.includes('ics') || q.includes('icom') || q.includes('class')) {
    return "We offer comprehensive academic programs:\n1. Matriculation: Science Group (Biology / Computer) & Arts/Commerce Groups\n2. Intermediate: FSc Pre-Medical, FSc Pre-Engineering, ICS (Computer Science), and I.Com\n3. Middle & Primary Wing with female-supervised environment.";
  }
  if (q.includes('address') || q.includes('location') || q.includes('kahan') || q.includes('sector') || q.includes('place')) {
    return "Girls Academy is located at Street 5, Sector G-11/2, Islamabad, Pakistan. We offer safe, GPS-monitored pick and drop transport across Islamabad and Rawalpindi.";
  }
  if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('rabta') || q.includes('whatsapp') || q.includes('email')) {
    return "Official Contact:\n• Phone: 051-4861234\n• WhatsApp / Cell: 0300-4861234\n• Email: info@girlsacademy.edu.pk\n• Campus: Sector G-11/2, Islamabad.";
  }
  return "Thank you for reaching out to Girls Academy Islamabad! Admissions for 2026-2027 are open. You can apply online or call our front desk at 051-4861234. How else may I assist you?";
}

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Girls Academy Server is running on port ${PORT}`);
  });
}

startServer();
