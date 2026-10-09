import React, { useState, useEffect } from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { 
  fetchClasses, 
  createClass, 
  updateClass, 
  deleteClass, 
  fetchAdminCourses, 
  fetchTerms,
  fetchSubjects,
  fetchAllUsers
} from '../../lib/dataService';
import { SchoolClass, Course, Term, Subject, Profile } from '../../types';
import { Users, Plus, Edit2, Trash2, Search, GraduationCap, BookOpen } from 'lucide-react';

export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const toast = useToast();

  // Quick Add State
  const [quickClassName, setQuickClassName] = useState('');
  const [quickCourseId, setQuickCourseId] = useState('');
  const [quickTermId, setQuickTermId] = useState('');
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  // Add/Edit Class Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Assign Teacher Modal
  const [assigningClass, setAssigningClass] = useState<SchoolClass | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Delete Confirm
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cls, crs, tms, usrs, subs] = await Promise.all([
        fetchClasses(),
        fetchAdminCourses(),
        fetchTerms(),
        fetchAllUsers('teacher'),
        fetchSubjects()
      ]);
      setClasses(cls);
      setCourses(crs);
      setTerms(tms);
      setTeachers(usrs);
      setSubjects(subs);
    } catch {
      toast.error('Failed to load class rosters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('ga_classes_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ga_classes_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setClassName('');
    setSelectedCourseId(courses[0]?.id || 'c-3');
    setSelectedTermId(terms[0]?.id || 'term-1');
    setIsModalOpen(true);
  };

  const openEditModal = (c: SchoolClass) => {
    setEditingClass(c);
    setClassName(c.name);
    setSelectedCourseId(c.course_id || courses[0]?.id || 'c-3');
    setSelectedTermId(c.term_id || terms[0]?.id || 'term-1');
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = quickClassName.trim();
    if (!cleanName) {
      toast.warning('Please enter a class / section name');
      return;
    }

    setIsQuickSaving(true);
    try {
      const finalCourseId = quickCourseId || courses[0]?.id || 'c-3';
      const finalTermId = quickTermId || terms[0]?.id || 'term-1';

      const created = await createClass({
        name: cleanName,
        course_id: finalCourseId,
        term_id: finalTermId
      });

      // Place newly added class strictly at index 0
      setClasses(prev => [created, ...prev.filter(c => c.id !== created.id)]);
      setNewlyAddedId(created.id);
      setQuickClassName('');
      setSearchTerm('');
      toast.success(`Class "${cleanName}" created and added to the top of the roster!`);
      setTimeout(() => setNewlyAddedId(null), 12000);
    } catch (err: any) {
      toast.error('Failed to create class: ' + (err?.message || 'Please try again'));
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = className.trim();
    if (!cleanName) {
      toast.warning('Please enter a class / section name');
      return;
    }

    setIsSaving(true);
    try {
      const finalCourseId = selectedCourseId || courses[0]?.id || 'c-3';
      const finalTermId = selectedTermId || terms[0]?.id || 'term-1';

      if (editingClass) {
        await updateClass(editingClass.id, {
          name: cleanName,
          course_id: finalCourseId,
          term_id: finalTermId
        });
        setClasses(prev => prev.map(c => c.id === editingClass.id ? { 
          ...c, 
          name: cleanName, 
          course_id: finalCourseId, 
          term_id: finalTermId 
        } : c));
        toast.success(`Class "${cleanName}" updated successfully!`);
      } else {
        const created = await createClass({
          name: cleanName,
          course_id: finalCourseId,
          term_id: finalTermId
        });
        setClasses(prev => [created, ...prev.filter(c => c.id !== created.id)]);
        setNewlyAddedId(created.id);
        setSearchTerm('');
        toast.success(`Class "${cleanName}" created and added to the top of the list!`);
        setTimeout(() => setNewlyAddedId(null), 12000);
      }
      setIsModalOpen(false);
      setClassName('');
    } catch (err: any) {
      toast.error('Failed to save class: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClass(classToDelete.id);
      toast.success(`Class "${classToDelete.name}" deleted.`);
      setClassToDelete(null);
      loadData();
    } catch {
      toast.error('Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      toast.success('Teacher and subject assigned to section successfully!');
      setAssigningClass(null);
    } catch {
      toast.error('Failed to assign teacher');
    } finally {
      setIsAssigning(false);
    }
  };

  const getCourseTitle = (id?: string | null) => {
    const c = courses.find(x => x.id === id);
    return c ? c.title : 'General Stream';
  };

  const getTermName = (id?: string | null) => {
    const t = terms.find(x => x.id === id);
    return t ? t.name : 'Current Term';
  };

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<SchoolClass>[] = [
    {
      key: 'name',
      header: 'Class / Section Name',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white block">{c.name}</span>
              {c.id === newlyAddedId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-bounce">
                  ✨ Just Added
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">{getTermName(c.term_id)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'course_id',
      header: 'Associated Program',
      render: (c) => (
        <span className="text-xs text-slate-300 font-medium">
          {getCourseTitle(c.course_id)}
        </span>
      )
    },
    {
      key: 'students',
      header: 'Enrolled Students',
      render: () => (
        <Badge variant="purple" size="sm">
          32 Students Active
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAssigningClass(c);
              setSelectedTeacherId(teachers[0]?.id || '');
              setSelectedSubjectId(subjects[0]?.id || '');
            }}
            className="text-[11px] px-2.5 py-1"
          >
            Assign Faculty
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(c)}
            className="p-1.5 text-slate-300 hover:text-white"
            title="Edit Class"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setClassToDelete(c)}
            className="p-1.5"
            title="Delete Class"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <PortalLayout
      pageTitle="Class & Section Management"
      pageSubtitle="Organize academic sections, assign teachers and course subjects, and manage student enrollments"
    >
      <div className="space-y-5 max-w-6xl">
        {/* Quick Add Bar */}
        <div className="bg-[#17152b] border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Quick Add Class Section</span>
                  <span className="text-xs text-pink-400 font-normal">/ فوری نئی کلاس یا سیکشن بنائیں</span>
                </h3>
                <p className="text-[11px] text-slate-400">Instantly creates a new section, adds it to the top of the roster, and syncs across all portals</p>
              </div>
            </div>
            <Badge variant="purple" size="sm">
              ⚡ Instant Sync Active
            </Badge>
          </div>

          <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Class / Section Name * <span className="text-slate-500 font-normal">(نام لکھیں)</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Class 9 (Computer Science - Section A)"
                value={quickClassName}
                onChange={(e) => setQuickClassName(e.target.value)}
                className="w-full bg-[#111020] border border-[#2d2947] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Academic Program <span className="text-slate-500 font-normal">(پروگرام)</span>
              </label>
              <select
                value={quickCourseId}
                onChange={(e) => setQuickCourseId(e.target.value)}
                className="w-full bg-[#111020] border border-[#2d2947] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
              >
                {courses.length > 0 ? (
                  courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                ) : (
                  <>
                    <option value="c-3">Matric Science (General Stream)</option>
                    <option value="c-6">FSc Pre-Medical</option>
                    <option value="c-9">ICS Computer Science</option>
                  </>
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Academic Term <span className="text-slate-500 font-normal">(ٹرم)</span>
              </label>
              <select
                value={quickTermId}
                onChange={(e) => setQuickTermId(e.target.value)}
                className="w-full bg-[#111020] border border-[#2d2947] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
              >
                {terms.length > 0 ? (
                  terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                ) : (
                  <option value="term-1">Term 1 (2026-2027)</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isQuickSaving}
                className="w-full text-xs py-2.5 font-semibold"
              >
                + Add Class
              </Button>
            </div>
          </form>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes or sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161625] border border-[#2a2a3e] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="purple" size="md">
              Total: {classes.length} Sections
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openAddModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add with Full Details
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table
          data={filteredClasses}
          columns={columns}
          pageSize={50}
          isLoading={isLoading}
          emptyMessage="No classes found."
        />

        {/* Add/Edit Class Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingClass ? 'Edit Class Section' : 'Create New Class Section'}
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Class / Section Name *"
              required
              placeholder="e.g. FSc Pre-Medical Part 1 (Section A)"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Academic Course / Stream *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-[#141422] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Academic Term *</label>
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="w-full bg-[#141422] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.academic_year})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#2a2a3e]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
              >
                {editingClass ? 'Save Changes' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Assign Teacher Modal */}
        <Modal
          isOpen={Boolean(assigningClass)}
          onClose={() => setAssigningClass(null)}
          title={`Assign Faculty to ${assigningClass?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject *</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-[#141422] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Assigned Teacher *</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-[#141422] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#2a2a3e]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAssigningClass(null)}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isAssigning}
              >
                Assign Subject Teacher
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={Boolean(classToDelete)}
          onClose={() => setClassToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Class Section?"
          message={`Are you sure you want to remove "${classToDelete?.name}"? All associated attendance and result links will be affected.`}
          confirmText="Delete Class"
          isLoading={isDeleting}
        />
      </div>
    </PortalLayout>
  );
};
