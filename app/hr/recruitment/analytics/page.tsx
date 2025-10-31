'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import type { Applicant, JobPosting, Interview, RecruitmentPipeline } from '@/types/database';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

export default function RecruitmentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [pipeline, setPipeline] = useState<RecruitmentPipeline[]>([]);

  const [analytics, setAnalytics] = useState({
    timeToHire: 0,
    costPerHire: 0,
    sourceEffectiveness: [] as Array<{ source: string; count: number; hiredCount: number }>,
    conversionRates: {
      appliedToScreening: 0,
      screeningToInterview: 0,
      interviewToOffer: 0,
      offerToHired: 0,
    },
    diversityMetrics: {
      totalApplicants: 0,
      genderDistribution: {} as Record<string, number>,
    },
    hiringManagerPerformance: [] as Array<{
      managerId: string;
      jobsPosted: number;
      applicants: number;
      hired: number;
      avgTimeToHire: number;
    }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [applicantsData, jobsData, interviewsData, pipelineData] = await Promise.all([
        db.applicants.toArray(),
        db.jobPostings.toArray(),
        db.interviews.toArray(),
        db.recruitmentPipeline.toArray(),
      ]);
      
      setApplicants(applicantsData);
      setJobPostings(jobsData);
      setInterviews(interviewsData);
      setPipeline(pipelineData);

      calculateAnalytics(applicantsData, jobsData, interviewsData, pipelineData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    applicantsData: Applicant[],
    jobsData: JobPosting[],
    interviewsData: Interview[],
    pipelineData: RecruitmentPipeline[]
  ) => {
    // Calculate time to hire (average days from application to hired)
    const hiredApplicants = applicantsData.filter(a => a.status === 'hired');
    const timeToHire = hiredApplicants.length > 0
      ? hiredApplicants.reduce((sum, app) => {
          const days = Math.floor(
            (new Date().getTime() - new Date(app.applicationDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / hiredApplicants.length
      : 0;

    // Calculate cost per hire (simplified - would need actual cost data)
    const costPerHire = 5000; // Placeholder

    // Source effectiveness
    const sourceMap = new Map<string, { count: number; hiredCount: number }>();
    applicantsData.forEach(app => {
      const current = sourceMap.get(app.source) || { count: 0, hiredCount: 0 };
      current.count++;
      if (app.status === 'hired') current.hiredCount++;
      sourceMap.set(app.source, current);
    });
    const sourceEffectiveness = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      ...data,
    }));

    // Conversion rates
    const totalApplicants = applicantsData.length;
    const screeningCount = applicantsData.filter(a => 
      ['screening', 'interview', 'assessment', 'offer', 'hired'].includes(a.status)
    ).length;
    const interviewCount = applicantsData.filter(a => 
      ['interview', 'assessment', 'offer', 'hired'].includes(a.status)
    ).length;
    const offerCount = applicantsData.filter(a => 
      ['offer', 'hired'].includes(a.status)
    ).length;
    const hiredCount = hiredApplicants.length;

    const conversionRates = {
      appliedToScreening: totalApplicants > 0 ? (screeningCount / totalApplicants) * 100 : 0,
      screeningToInterview: screeningCount > 0 ? (interviewCount / screeningCount) * 100 : 0,
      interviewToOffer: interviewCount > 0 ? (offerCount / interviewCount) * 100 : 0,
      offerToHired: offerCount > 0 ? (hiredCount / offerCount) * 100 : 0,
    };

    // Diversity metrics (simplified)
    const diversityMetrics = {
      totalApplicants: applicantsData.length,
      genderDistribution: {},
    };

    // Hiring manager performance
    const managerMap = new Map<string, {
      jobsPosted: number;
      applicants: number;
      hired: number;
      totalDays: number;
    }>();

    jobsData.forEach(job => {
      const current = managerMap.get(job.hiringManagerId) || {
        jobsPosted: 0,
        applicants: 0,
        hired: 0,
        totalDays: 0,
      };
      current.jobsPosted++;
      
      const jobApplicants = applicantsData.filter(a => a.jobId === job.id);
      current.applicants += jobApplicants.length;
      
      const jobHired = jobApplicants.filter(a => a.status === 'hired');
      current.hired += jobHired.length;
      
      jobHired.forEach(app => {
        const days = Math.floor(
          (new Date().getTime() - new Date(app.applicationDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        current.totalDays += days;
      });
      
      managerMap.set(job.hiringManagerId, current);
    });

    const hiringManagerPerformance = Array.from(managerMap.entries()).map(([managerId, data]) => ({
      managerId,
      jobsPosted: data.jobsPosted,
      applicants: data.applicants,
      hired: data.hired,
      avgTimeToHire: data.hired > 0 ? data.totalDays / data.hired : 0,
    }));

    setAnalytics({
      timeToHire,
      costPerHire,
      sourceEffectiveness,
      conversionRates,
      diversityMetrics,
      hiringManagerPerformance,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Analytics</h1>
        <p className="text-gray-600 mt-1">Track recruitment performance and identify improvements</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time to Hire</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(analytics.timeToHire)}
              </p>
              <p className="text-xs text-gray-500 mt-1">days average</p>
            </div>
            <Clock className="w-12 h-12 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cost per Hire</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.costPerHire)}
              </p>
              <p className="text-xs text-gray-500 mt-1">average cost</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Applicants</p>
              <p className="text-3xl font-bold text-gray-900">
                {applicants.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">all time</p>
            </div>
            <Users className="w-12 h-12 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hired</p>
              <p className="text-3xl font-bold text-gray-900">
                {applicants.filter(a => a.status === 'hired').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">successful hires</p>
            </div>
            <Award className="w-12 h-12 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Applicant Funnel Conversion Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {analytics.conversionRates.appliedToScreening.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Applied → Screening</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {analytics.conversionRates.screeningToInterview.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Screening → Interview</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {analytics.conversionRates.interviewToOffer.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Interview → Offer</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analytics.conversionRates.offerToHired.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Offer → Hired</p>
          </div>
        </div>
      </Card>

      {/* Source Effectiveness */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Source Effectiveness
        </h2>
        <div className="space-y-4">
          {analytics.sourceEffectiveness.map(source => {
            const hireRate = source.count > 0 ? (source.hiredCount / source.count) * 100 : 0;
            
            return (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">
                      {source.source.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {source.hiredCount} hired / {source.count} applicants ({hireRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${hireRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {analytics.sourceEffectiveness.length === 0 && (
            <p className="text-center text-gray-500 py-4">No data available</p>
          )}
        </div>
      </Card>

      {/* Hiring Manager Performance */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Hiring Manager Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Manager ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Jobs Posted
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Applicants
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Hired
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Avg Time to Hire
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.hiringManagerPerformance.map(manager => (
                <tr key={manager.managerId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {manager.managerId.substring(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {manager.jobsPosted}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {manager.applicants}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {manager.hired}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {Math.round(manager.avgTimeToHire)} days
                  </td>
                </tr>
              ))}
              {analytics.hiringManagerPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          AI-Powered Insights
        </h2>
        <div className="space-y-3">
          {analytics.timeToHire > 45 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Long Time to Hire</p>
                <p className="text-sm text-gray-600">
                  Your average time to hire ({Math.round(analytics.timeToHire)} days) is above industry average. 
                  Consider streamlining your interview process or adding more interviewers.
                </p>
              </div>
            </div>
          )}
          
          {analytics.conversionRates.screeningToInterview < 30 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Low Screening Conversion</p>
                <p className="text-sm text-gray-600">
                  Only {analytics.conversionRates.screeningToInterview.toFixed(1)}% of screened candidates 
                  move to interviews. Review your screening criteria or job requirements.
                </p>
              </div>
            </div>
          )}

          {analytics.sourceEffectiveness.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Top Performing Source</p>
                <p className="text-sm text-gray-600">
                  {analytics.sourceEffectiveness.sort((a, b) => 
                    (b.hiredCount / b.count) - (a.hiredCount / a.count)
                  )[0]?.source.replace('-', ' ')} is your most effective recruitment source. 
                  Consider increasing investment in this channel.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
