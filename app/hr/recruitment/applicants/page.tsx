'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/schema';
import type { Applicant, JobPosting, ApplicantStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  User, 
  Mail,
  Phone,
  FileText,
  Star,
  Eye,
  Filter
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

const PIPELINE_STAGES: ApplicantStatus[] = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offer',
  'hired',
  'rejected',
];

const STAGE_COLORS: Record<ApplicantStatus, string> = {
  applied: 'bg-blue-100 border-blue-300',
  screening: 'bg-yellow-100 border-yellow-300',
  interview: 'bg-purple-100 border-purple-300',
  assessment: 'bg-orange-100 border-orange-300',
  offer: 'bg-green-100 border-green-300',
  hired: 'bg-emerald-100 border-emerald-300',
  rejected: 'bg-red-100 border-red-300',
  withdrawn: 'bg-gray-100 border-gray-300',
};

export default function ApplicantsPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [draggedApplicant, setDraggedApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [applicantsData, jobsData] = await Promise.all([
        db.applicants.toArray(),
        db.jobPostings.toArray(),
      ]);
      
      // Sort by application date (newest first)
      applicantsData.sort((a, b) => 
        new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
      );
      
      setApplicants(applicantsData);
      setJobPostings(jobsData);
    } catch (error) {
      console.error('Error loading applicants:', error);
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const getJobTitle = (jobId: string) => {
    const job = jobPostings.find(j => j.id === jobId);
    return job?.title || 'Unknown Position';
  };

  const handleDragStart = (applicant: Applicant) => {
    setDraggedApplicant(applicant);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicantStatus) => {
    e.preventDefault();
    
    if (!draggedApplicant || draggedApplicant.status === newStatus) {
      setDraggedApplicant(null);
      return;
    }

    try {
      // Update applicant status
      await db.applicants.update(draggedApplicant.id, {
        status: newStatus,
        currentStage: newStatus,
        updatedAt: new Date(),
      });

      // Add to recruitment pipeline tracking
      await db.recruitmentPipeline.add({
        id: crypto.randomUUID(),
        applicantId: draggedApplicant.id,
        jobId: draggedApplicant.jobId,
        stage: newStatus,
        enteredAt: new Date(),
      });

      toast.success(`Moved ${draggedApplicant.firstName} ${draggedApplicant.lastName} to ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating applicant status:', error);
      toast.error('Failed to update applicant status');
    }

    setDraggedApplicant(null);
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = 
      app.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJob = jobFilter === 'all' || app.jobId === jobFilter;

    return matchesSearch && matchesJob;
  });

  const getApplicantsByStage = (stage: ApplicantStatus) => {
    return filteredApplicants.filter(app => app.status === stage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applicant Tracking</h1>
          <p className="text-gray-600 mt-1">Manage candidates through the recruitment pipeline</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Applicants</p>
          <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">In Interview</p>
          <p className="text-2xl font-bold text-purple-600">
            {applicants.filter(a => a.status === 'interview').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Offers Extended</p>
          <p className="text-2xl font-bold text-green-600">
            {applicants.filter(a => a.status === 'offer').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Hired</p>
          <p className="text-2xl font-bold text-emerald-600">
            {applicants.filter(a => a.status === 'hired').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={jobFilter}
            onValueChange={setJobFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobPostings.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {PIPELINE_STAGES.map(stage => {
            const stageApplicants = getApplicantsByStage(stage);
            
            return (
              <div
                key={stage}
                className={`flex-shrink-0 w-80 ${STAGE_COLORS[stage]} border-2 rounded-lg p-4`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {stage.replace('-', ' ')}
                  </h3>
                  <Badge variant="outline" className="bg-white">
                    {stageApplicants.length}
                  </Badge>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {stageApplicants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No applicants in this stage
                    </div>
                  ) : (
                    stageApplicants.map(applicant => (
                      <Card
                        key={applicant.id}
                        className="p-4 cursor-move hover:shadow-lg transition-shadow bg-white"
                        draggable
                        onDragStart={() => handleDragStart(applicant)}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {applicant.firstName} {applicant.lastName}
                              </h4>
                              <p className="text-xs text-gray-600">{applicant.applicantId}</p>
                            </div>
                            {applicant.aiCompatibilityScore && (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-semibold">
                                  {applicant.aiCompatibilityScore}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              <span className="truncate">{getJobTitle(applicant.jobId)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{applicant.email}</span>
                            </div>
                            {applicant.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                <span>{applicant.phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-gray-500">
                              Applied {formatDate(applicant.applicationDate)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/hr/recruitment/applicants/${applicant.id}`)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
