"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Pill,
  Activity,
  Loader2
} from "lucide-react";
import type { Patient, MedicalRecord } from "@/types/database";
import { PatientService } from "@/services/database/patients";

interface MedicalAIInsightsProps {
  patient: Patient;
  medicalHistory: MedicalRecord[];
}

export function MedicalAIInsights({ patient, medicalHistory }: MedicalAIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [healthSummary, setHealthSummary] = useState<string>("");
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [medicationInteractions, setMedicationInteractions] = useState<any[]>([]);
  const [recommendedFollowUps, setRecommendedFollowUps] = useState<any[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<any[]>([]);

  useEffect(() => {
    generateAIInsights();
  }, [patient.id, medicalHistory.length]);

  const generateAIInsights = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would call the Gemini AI service
      // For now, we'll generate mock insights based on the patient data
      
      // Generate health summary
      const summary = generateHealthSummary();
      setHealthSummary(summary);

      // Generate risk assessment
      const risks = generateRiskAssessment();
      setRiskAssessment(risks);

      // Check medication interactions
      const interactions = checkMedicationInteractions();
      setMedicationInteractions(interactions);

      // Generate follow-up recommendations
      const followUps = generateFollowUpRecommendations();
      setRecommendedFollowUps(followUps);

      // Link to relevant products
      const products = await linkRelevantProducts();
      setLinkedProducts(products);

    } catch (error) {
      console.error("Error generating AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateHealthSummary = (): string => {
    const age = patient.age || 0;
    const recordCount = medicalHistory.length;
    const hasChronicConditions = patient.chronicConditions && patient.chronicConditions.length > 0;
    const hasAllergies = patient.allergies && patient.allergies.length > 0;

    let summary = `${patient.firstName} ${patient.lastName} is a ${age}-year-old ${patient.gender} patient `;
    
    if (recordCount > 0) {
      summary += `with ${recordCount} medical record${recordCount > 1 ? 's' : ''} on file. `;
    } else {
      summary += `with no medical records on file yet. `;
    }

    if (hasChronicConditions) {
      summary += `The patient has ${patient.chronicConditions!.length} chronic condition${patient.chronicConditions!.length > 1 ? 's' : ''}: ${patient.chronicConditions!.join(', ')}. `;
    }

    if (hasAllergies) {
      summary += `Known allergies include: ${patient.allergies!.join(', ')}. `;
    }

    if (medicalHistory.length > 0) {
      const recentRecord = medicalHistory[0];
      summary += `Most recent visit was on ${new Date(recentRecord.visitDate).toLocaleDateString()} for ${recentRecord.title}.`;
    }

    return summary;
  };

  const generateRiskAssessment = () => {
    const risks = [];

    // Age-based risks
    const age = patient.age || 0;
    if (age > 65) {
      risks.push({
        level: "medium",
        category: "Age-Related",
        description: "Increased risk for age-related conditions",
        recommendation: "Regular health screenings recommended"
      });
    }

    // Chronic condition risks
    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
      risks.push({
        level: "high",
        category: "Chronic Conditions",
        description: `Managing ${patient.chronicConditions.length} chronic condition(s)`,
        recommendation: "Regular monitoring and medication compliance essential"
      });
    }

    // Allergy risks
    if (patient.allergies && patient.allergies.length > 0) {
      risks.push({
        level: "medium",
        category: "Allergies",
        description: `${patient.allergies.length} known allergy/allergies`,
        recommendation: "Always verify medications and treatments for allergens"
      });
    }

    // If no risks identified
    if (risks.length === 0) {
      risks.push({
        level: "low",
        category: "General Health",
        description: "No significant risk factors identified",
        recommendation: "Continue regular health maintenance"
      });
    }

    return risks;
  };

  const checkMedicationInteractions = () => {
    const interactions = [];

    // Get all medications from recent records
    const allMedications = medicalHistory
      .filter(r => r.medications && r.medications.length > 0)
      .flatMap(r => r.medications!)
      .slice(0, 10); // Last 10 medications

    // In a real implementation, this would check against a drug interaction database
    // For now, we'll create mock warnings if there are multiple medications
    if (allMedications.length > 3) {
      interactions.push({
        severity: "warning",
        medications: [allMedications[0].name, allMedications[1].name],
        description: "Potential interaction detected - consult with physician",
        action: "Review medication timing and dosages"
      });
    }

    return interactions;
  };

  const generateFollowUpRecommendations = () => {
    const recommendations = [];

    // Based on chronic conditions
    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
      recommendations.push({
        type: "Routine Check-up",
        priority: "high",
        timeframe: "Within 3 months",
        reason: "Chronic condition monitoring",
        description: "Regular monitoring of chronic conditions is recommended"
      });
    }

    // Based on last visit
    if (medicalHistory.length > 0) {
      const lastVisit = new Date(medicalHistory[0].visitDate);
      const daysSinceLastVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastVisit > 180) {
        recommendations.push({
          type: "General Check-up",
          priority: "medium",
          timeframe: "Within 1 month",
          reason: "Last visit was over 6 months ago",
          description: "Schedule a general health assessment"
        });
      }
    }

    // Age-based recommendations
    const age = patient.age || 0;
    if (age > 50) {
      recommendations.push({
        type: "Preventive Screening",
        priority: "medium",
        timeframe: "Annually",
        reason: "Age-appropriate preventive care",
        description: "Annual health screenings recommended for age group"
      });
    }

    return recommendations;
  };

  const linkRelevantProducts = async () => {
    // In a real implementation, this would use Gemini AI to match
    // medical conditions with relevant products
    const products = [];

    // Mock product linking based on conditions
    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
      products.push({
        id: "mock-1",
        name: "Blood Pressure Monitor",
        category: "Medical Devices",
        relevance: "Recommended for chronic condition management"
      });
    }

    return products;
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating AI insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Generated Health Summary
          </CardTitle>
          <CardDescription>
            Comprehensive overview based on medical history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm leading-relaxed">{healthSummary}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={generateAIInsights}
          >
            Regenerate Summary
          </Button>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
          <CardDescription>
            AI-identified health risk factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskAssessment && riskAssessment.map((risk: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getRiskLevelColor(risk.level)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{risk.category}</span>
                      <Badge variant={risk.level === "high" ? "destructive" : risk.level === "medium" ? "default" : "secondary"}>
                        {risk.level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                    <p className="text-sm font-medium text-blue-600">{risk.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medication Interactions */}
      {medicationInteractions.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Medication Interaction Warnings</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {medicationInteractions.map((interaction, idx) => (
                <div key={idx} className="text-sm">
                  <div className="font-medium">
                    {interaction.medications.join(" + ")}
                  </div>
                  <div>{interaction.description}</div>
                  <div className="text-xs mt-1 text-red-800">
                    Action: {interaction.action}
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Recommended Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recommended Follow-ups
          </CardTitle>
          <CardDescription>
            AI-suggested appointments and screenings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendedFollowUps.map((followUp, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{followUp.type}</div>
                  <Badge variant={getPriorityColor(followUp.priority) as any}>
                    {followUp.priority}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  {followUp.timeframe}
                </div>
                <p className="text-sm mb-1">{followUp.description}</p>
                <p className="text-xs text-muted-foreground">Reason: {followUp.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Linked Products */}
      {linkedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Recommended Products
            </CardTitle>
            <CardDescription>
              Products relevant to patient's conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {linkedProducts.map((product, idx) => (
                <div key={idx} className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.category}</div>
                  <div className="text-xs text-blue-600 mt-1">{product.relevance}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
