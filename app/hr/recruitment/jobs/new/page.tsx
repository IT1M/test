'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/schema';
import type { Department, Position, Employee } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewJobPostingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    positionId: '',
    description: '',
    responsibilities: [''],
    requirements: [''],
    qualifications: [''],
    skills: [''],
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    benefits: [''],
    location: '',
    workType: 'on-site' as 'on-site' | 'remote' | 'hybrid',
    closingDate: '',
    hiringManagerId: '',
    publishedOn: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deptData, posData, empData] = await Promise.all([
        db.departments.where('isActive').equals(1).toArray(),
        db.positions.where('isActive').equals(1).toArray(),
        db.employees.where('status').equals('active').toArray(),
      ]);
      
      setDepartments(deptData);
      setPositions(posData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleArrayFieldChange = (
    field: 'responsibilities' | 'requirements' | 'qualifications' | 'skills' | 'benefits',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayField = (field: 'responsibilities' | 'requirements' | 'qualifications' | 'skills' | 'benefits') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (
    field: 'responsibilities' | 'requirements' | 'qualifications' | 'skills' | 'benefits',
    index: number
  ) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault();

    if (!formData.title || !formData.departmentId || !formData.positionId || !formData.hiringManagerId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const jobId = `JOB-${new Date().getFullYear()}-${String(await db.jobPostings.count() + 1).padStart(3, '0')}`;

      const jobPosting = {
        id: uuidv4(),
        jobId,
        title: formData.title,
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        description: formData.description,
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ''),
        requirements: formData.requirements.filter(r => r.trim() !== ''),
        qualifications: formData.qualifications.filter(q => q.trim() !== ''),
        skills: formData.skills.filter(s => s.trim() !== ''),
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
        currency: formData.currency,
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        location: formData.location,
        workType: formData.workType,
        postedDate: new Date(),
        closingDate: formData.closingDate ? new Date(formData.closingDate) : undefined,
        status,
        views: 0,
        applicationsCount: 0,
        publishedOn: formData.publishedOn,
        hiringManagerId: formData.hiringManagerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.jobPostings.add(jobPosting);

      toast.success(`Job posting ${status === 'draft' ? 'saved as draft' : 'published'} successfully`);
      router.push('/hr/recruitment/jobs');
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast.error('Failed to create job posting');
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = positions.filter(p => 
    !formData.departmentId || p.departmentId === formData.departmentId
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Job Posting</h1>
          <p className="text-gray-600 mt-1">Post a new job opening</p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value, positionId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) => setFormData({ ...formData, positionId: value })}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., New York, NY"
                required
              />
            </div>

            <div>
              <Label htmlFor="workType">Work Type *</Label>
              <Select
                value={formData.workType}
                onValueChange={(value: any) => setFormData({ ...formData, workType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Work Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hiringManager">Hiring Manager *</Label>
              <Select
                value={formData.hiringManagerId}
                onValueChange={(value) => setFormData({ ...formData, hiringManagerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Hiring Manager" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="closingDate">Closing Date</Label>
              <Input
                id="closingDate"
                type="date"
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a detailed description of the role..."
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Compensation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Compensation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="salaryMin">Minimum Salary</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                placeholder="50000"
              />
            </div>

            <div>
              <Label htmlFor="salaryMax">Maximum Salary</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                placeholder="80000"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Responsibilities */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Responsibilities</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('responsibilities')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={resp}
                  onChange={(e) => handleArrayFieldChange('responsibilities', index, e.target.value)}
                  placeholder="Enter responsibility..."
                />
                {formData.responsibilities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('responsibilities', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Requirements */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('requirements')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={req}
                  onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                  placeholder="Enter requirement..."
                />
                {formData.requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('requirements', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Qualifications */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Qualifications</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('qualifications')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {formData.qualifications.map((qual, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={qual}
                  onChange={(e) => handleArrayFieldChange('qualifications', index, e.target.value)}
                  placeholder="Enter qualification..."
                />
                {formData.qualifications.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('qualifications', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Required Skills</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('skills')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={skill}
                  onChange={(e) => handleArrayFieldChange('skills', index, e.target.value)}
                  placeholder="Enter skill..."
                />
                {formData.skills.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('skills', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Benefits */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Benefits</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('benefits')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => handleArrayFieldChange('benefits', index, e.target.value)}
                  placeholder="Enter benefit..."
                />
                {formData.benefits.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('benefits', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'active')}
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
