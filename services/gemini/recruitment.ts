// Gemini AI Service for Recruitment and Resume Screening

import { GeminiService } from './client';
import type { 
  Applicant, 
  JobPosting, 
  Position,
  Qualification,
  WorkExperience 
} from '@/types/database';

export class RecruitmentAIService {
  private gemini: GeminiService;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    this.gemini = new GeminiService({ apiKey });
  }

  /**
   * Parse resume and extract structured data
   */
  async parseResume(resumeText: string): Promise<{
    personalInfo: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    summary: string;
    education: Qualification[];
    experience: WorkExperience[];
    skills: string[];
    certifications: string[];
    confidence: number;
  }> {
    const prompt = `
You are an expert resume parser. Analyze the following resume text and extract structured information.

Resume Text:
${resumeText}

Extract and return the following information in JSON format:
{
  "personalInfo": {
    "name": "Full name",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State/Country"
  },
  "summary": "Professional summary or objective (2-3 sentences)",
  "education": [
    {
      "degree": "Degree name",
      "institution": "University/College name",
      "fieldOfStudy": "Major/Field",
      "graduationYear": 2020,
      "grade": "GPA or grade if mentioned"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "description": "Brief description of responsibilities",
      "isCurrent": false
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certifications": ["certification1", "certification2"],
  "confidence": 0.95
}

Important:
- Extract all information accurately
- For dates, use MM/YYYY format
- Mark current positions with isCurrent: true
- List skills as an array of strings
- Confidence should be between 0 and 1
- If information is not found, use empty string or empty array
`;

    try {
      const parsed = await this.gemini.generateJSON(prompt);
      
      return {
        personalInfo: parsed.personalInfo || {},
        summary: parsed.summary || '',
        education: parsed.education || [],
        experience: parsed.experience || [],
        skills: parsed.skills || [],
        certifications: parsed.certifications || [],
        confidence: parsed.confidence || 0.7,
      };
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume');
    }
  }

  /**
   * Match applicant qualifications against job requirements
   */
  async matchApplicantToJob(
    applicant: Applicant,
    jobPosting: JobPosting,
    position: Position
  ): Promise<{
    compatibilityScore: number;
    strengths: string[];
    concerns: string[];
    recommendation: string;
    confidence: number;
  }> {
    const prompt = `
You are an expert recruiter. Analyze how well this applicant matches the job requirements.

Job Details:
- Title: ${jobPosting.title}
- Department: ${position.departmentId}
- Required Skills: ${jobPosting.skills.join(', ')}
- Requirements: ${jobPosting.requirements.join(', ')}
- Qualifications: ${jobPosting.qualifications.join(', ')}
- Responsibilities: ${jobPosting.responsibilities.join(', ')}

Applicant Profile:
- Name: ${applicant.firstName} ${applicant.lastName}
- Education: ${JSON.stringify(applicant.parsedData?.education || [])}
- Experience: ${JSON.stringify(applicant.parsedData?.experience || [])}
- Skills: ${applicant.parsedData?.skills.join(', ') || 'Not specified'}
- Certifications: ${applicant.parsedData?.certifications.join(', ') || 'None'}
- Summary: ${applicant.parsedData?.summary || 'Not provided'}

Analyze the match and return a JSON response with:
{
  "compatibilityScore": 85,
  "strengths": [
    "Strong technical background in required technologies",
    "Relevant industry experience",
    "Advanced certifications"
  ],
  "concerns": [
    "Limited experience with specific tool X",
    "No mention of skill Y"
  ],
  "recommendation": "Strong candidate - recommend for interview. Has most required skills and relevant experience.",
  "confidence": 0.9
}

Scoring Guidelines:
- 90-100: Excellent match, highly recommended
- 75-89: Good match, recommend for interview
- 60-74: Moderate match, consider if other candidates are limited
- Below 60: Poor match, not recommended

Be objective and specific in your analysis.
`;

    try {
      const analysis = await this.gemini.generateJSON(prompt);
      
      return {
        compatibilityScore: analysis.compatibilityScore || 0,
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        recommendation: analysis.recommendation || 'Unable to generate recommendation',
        confidence: analysis.confidence || 0.7,
      };
    } catch (error) {
      console.error('Error matching applicant to job:', error);
      throw new Error('Failed to analyze applicant match');
    }
  }

  /**
   * Identify red flags in applicant profile
   */
  async identifyRedFlags(applicant: Applicant): Promise<{
    redFlags: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    overallRisk: 'low' | 'medium' | 'high';
  }> {
    const prompt = `
You are an expert recruiter analyzing an applicant's profile for potential red flags.

Applicant Profile:
- Name: ${applicant.firstName} ${applicant.lastName}
- Education: ${JSON.stringify(applicant.parsedData?.education || [])}
- Experience: ${JSON.stringify(applicant.parsedData?.experience || [])}
- Skills: ${applicant.parsedData?.skills.join(', ') || 'Not specified'}

Analyze for red flags such as:
- Frequent job changes (job hopping)
- Unexplained employment gaps
- Inconsistent career progression
- Lack of relevant experience
- Missing critical information
- Overqualification concerns

Return JSON:
{
  "redFlags": [
    {
      "type": "Employment Gap",
      "description": "6-month gap between positions in 2022",
      "severity": "medium"
    }
  ],
  "overallRisk": "low"
}

Be fair and objective. Not all gaps or changes are red flags - consider context.
`;

    try {
      const analysis = await this.gemini.generateJSON(prompt);
      
      return {
        redFlags: analysis.redFlags || [],
        overallRisk: analysis.overallRisk || 'low',
      };
    } catch (error) {
      console.error('Error identifying red flags:', error);
      return {
        redFlags: [],
        overallRisk: 'low',
      };
    }
  }

  /**
   * Rank multiple applicants for a job
   */
  async rankApplicants(
    applicants: Applicant[],
    jobPosting: JobPosting
  ): Promise<Array<{
    applicantId: string;
    rank: number;
    score: number;
    reasoning: string;
  }>> {
    const applicantSummaries = applicants.map(app => ({
      id: app.id,
      name: `${app.firstName} ${app.lastName}`,
      education: app.parsedData?.education || [],
      experience: app.parsedData?.experience || [],
      skills: app.parsedData?.skills || [],
      aiScore: app.aiCompatibilityScore || 0,
    }));

    const prompt = `
You are an expert recruiter ranking applicants for a job position.

Job Details:
- Title: ${jobPosting.title}
- Required Skills: ${jobPosting.skills.join(', ')}
- Requirements: ${jobPosting.requirements.join(', ')}

Applicants:
${JSON.stringify(applicantSummaries, null, 2)}

Rank these applicants from best to worst match. Return JSON:
{
  "rankings": [
    {
      "applicantId": "uuid",
      "rank": 1,
      "score": 92,
      "reasoning": "Best match due to extensive experience and all required skills"
    }
  ]
}

Consider:
- Relevant experience
- Required skills match
- Education level
- Career progression
- Overall fit
`;

    try {
      const analysis = await this.gemini.generateJSON(prompt);
      
      return analysis.rankings || [];
    } catch (error) {
      console.error('Error ranking applicants:', error);
      return [];
    }
  }

  /**
   * Generate interview questions based on job requirements
   */
  async generateInterviewQuestions(
    jobPosting: JobPosting,
    applicant?: Applicant
  ): Promise<{
    behavioral: string[];
    technical: string[];
    situational: string[];
    customized: string[];
  }> {
    const applicantContext = applicant
      ? `
Applicant Background:
- Experience: ${JSON.stringify(applicant.parsedData?.experience || [])}
- Skills: ${applicant.parsedData?.skills.join(', ') || 'Not specified'}
`
      : '';

    const prompt = `
You are an expert interviewer. Generate relevant interview questions for this position.

Job Details:
- Title: ${jobPosting.title}
- Required Skills: ${jobPosting.skills.join(', ')}
- Requirements: ${jobPosting.requirements.join(', ')}
- Responsibilities: ${jobPosting.responsibilities.join(', ')}

${applicantContext}

Generate interview questions in JSON format:
{
  "behavioral": [
    "Tell me about a time when...",
    "Describe a situation where..."
  ],
  "technical": [
    "How would you approach...",
    "Explain your experience with..."
  ],
  "situational": [
    "What would you do if...",
    "How would you handle..."
  ],
  "customized": [
    "Questions specific to applicant's background if provided"
  ]
}

Generate 5-7 questions for each category. Make them specific to the role.
`;

    try {
      const questions = await this.gemini.generateJSON(prompt);
      
      return {
        behavioral: questions.behavioral || [],
        technical: questions.technical || [],
        situational: questions.situational || [],
        customized: questions.customized || [],
      };
    } catch (error) {
      console.error('Error generating interview questions:', error);
      return {
        behavioral: [],
        technical: [],
        situational: [],
        customized: [],
      };
    }
  }

  /**
   * Analyze interview feedback and generate candidate summary
   */
  async analyzeInterviewFeedback(
    applicant: Applicant,
    interviewFeedback: Array<{
      interviewer: string;
      rating: number;
      feedback: string;
      strengths: string[];
      concerns: string[];
    }>
  ): Promise<{
    overallAssessment: string;
    keyStrengths: string[];
    keyConcerns: string[];
    hiringRecommendation: 'strong-hire' | 'hire' | 'maybe' | 'no-hire';
    reasoning: string;
  }> {
    const prompt = `
You are an expert recruiter analyzing interview feedback for a candidate.

Candidate: ${applicant.firstName} ${applicant.lastName}

Interview Feedback:
${JSON.stringify(interviewFeedback, null, 2)}

Analyze all feedback and provide a comprehensive assessment in JSON:
{
  "overallAssessment": "Comprehensive summary of candidate performance",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "keyConcerns": ["concern1", "concern2"],
  "hiringRecommendation": "hire",
  "reasoning": "Detailed explanation of recommendation"
}

Hiring Recommendation Guidelines:
- strong-hire: Exceptional candidate, hire immediately
- hire: Good candidate, recommend hiring
- maybe: Mixed feedback, needs further evaluation
- no-hire: Not suitable for the position

Be objective and consider all interviewer feedback.
`;

    try {
      const analysis = await this.gemini.generateJSON(prompt);
      
      return {
        overallAssessment: analysis.overallAssessment || '',
        keyStrengths: analysis.keyStrengths || [],
        keyConcerns: analysis.keyConcerns || [],
        hiringRecommendation: analysis.hiringRecommendation || 'maybe',
        reasoning: analysis.reasoning || '',
      };
    } catch (error) {
      console.error('Error analyzing interview feedback:', error);
      throw new Error('Failed to analyze interview feedback');
    }
  }

  /**
   * Predict candidate success probability
   */
  async predictCandidateSuccess(
    applicant: Applicant,
    jobPosting: JobPosting,
    position: Position
  ): Promise<{
    successProbability: number;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
    recommendation: string;
  }> {
    const prompt = `
You are an expert in talent assessment. Predict the likelihood of this candidate's success in the role.

Job Details:
- Title: ${jobPosting.title}
- Level: ${position.level}
- Requirements: ${jobPosting.requirements.join(', ')}

Candidate Profile:
- Education: ${JSON.stringify(applicant.parsedData?.education || [])}
- Experience: ${JSON.stringify(applicant.parsedData?.experience || [])}
- Skills: ${applicant.parsedData?.skills.join(', ') || 'Not specified'}
- AI Compatibility Score: ${applicant.aiCompatibilityScore || 'Not calculated'}

Analyze and return JSON:
{
  "successProbability": 0.85,
  "factors": [
    {
      "factor": "Relevant Experience",
      "impact": "positive",
      "description": "5+ years in similar role"
    },
    {
      "factor": "Skill Gap",
      "impact": "negative",
      "description": "Limited experience with Tool X"
    }
  ],
  "recommendation": "High probability of success. Candidate has strong foundation and relevant experience."
}

Success probability should be between 0 and 1.
Consider: experience, skills, education, career trajectory, cultural fit indicators.
`;

    try {
      const prediction = await this.gemini.generateJSON(prompt);
      
      return {
        successProbability: prediction.successProbability || 0.5,
        factors: prediction.factors || [],
        recommendation: prediction.recommendation || '',
      };
    } catch (error) {
      console.error('Error predicting candidate success:', error);
      throw new Error('Failed to predict candidate success');
    }
  }
}

// Export singleton instance
export const recruitmentAI = new RecruitmentAIService();
