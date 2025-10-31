'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Star, Award, TrendingUp, Calendar, FileText, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierService } from '@/services/database/suppliers';
import type { Supplier, SupplierEvaluation, SupplierContract } from '@/types/database';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
  const [contracts, setContracts] = useState<SupplierContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);

  useEffect(() => {
    loadSupplierData();
  }, [supplierId]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      const [supplierData, evaluationsData, contractsData, summary] = await Promise.all([
        SupplierService.getSupplierById(supplierId),
        SupplierService.getSupplierEvaluations(supplierId),
        SupplierService.getSupplierContracts(supplierId),
        SupplierService.getSupplierPerformanceSummary(supplierId),
      ]);

      setSupplier(supplierData || null);
      setEvaluations(evaluationsData);
      setContracts(contractsData);
      setPerformanceSummary(summary);
    } catch (error) {
      console.error('Error loading supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      blacklisted: 'destructive',
      draft: 'secondary',
      expired: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading supplier details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Supplier not found</h3>
              <p className="text-gray-600 mb-4">The supplier you're looking for doesn't exist.</p>
              <Link href="/supply-chain/suppliers">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Suppliers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/supply-chain/suppliers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              {supplier.isPreferred && (
                <Award className="w-6 h-6 text-yellow-500" title="Preferred Supplier" />
              )}
              {getStatusBadge(supplier.status)}
            </div>
            <p className="text-gray-600 mt-1">Supplier ID: {supplier.supplierId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/supply-chain/suppliers/${supplier.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/supply-chain/suppliers/${supplier.id}/evaluate`}>
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              New Evaluation
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Rating</CardDescription>
          </CardHeader>
          <CardContent>
            {getRatingStars(supplier.rating)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Score</CardDescription>
            <CardTitle className="text-3xl">{supplier.overallScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Based on {performanceSummary?.evaluationsCount || 0} evaluations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Contracts</CardDescription>
            <CardTitle className="text-3xl">{performanceSummary?.activeContracts || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {performanceSummary?.contractsCount || 0} total contracts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lead Time</CardDescription>
            <CardTitle className="text-3xl">{supplier.leadTime}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">days</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evaluations.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Contact Person</div>
                  <div className="font-medium">{supplier.contactPerson}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{supplier.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{supplier.phone}</div>
                </div>
                {supplier.website && (
                  <div>
                    <div className="text-sm text-gray-600">Website</div>
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium">
                    {supplier.address}
                    <br />
                    {supplier.city}, {supplier.country}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Business Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Supplier Type</div>
                  <div className="font-medium capitalize">{supplier.type.replace('-', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Terms</div>
                  <div className="font-medium">{supplier.paymentTerms}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Lead Time</div>
                  <div className="font-medium">{supplier.leadTime} days</div>
                </div>
                {supplier.minimumOrderQuantity && (
                  <div>
                    <div className="text-sm text-gray-600">Minimum Order Quantity</div>
                    <div className="font-medium">{supplier.minimumOrderQuantity}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Currency</div>
                  <div className="font-medium">{supplier.currency}</div>
                </div>
                {supplier.totalPurchaseValue && (
                  <div>
                    <div className="text-sm text-gray-600">Total Purchase Value</div>
                    <div className="font-medium">
                      {supplier.currency} {supplier.totalPurchaseValue.toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Certifications and Licenses */}
          {(supplier.certifications?.length > 0 || supplier.licenses?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications & Licenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.certifications && supplier.certifications.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Certifications</div>
                    <div className="flex flex-wrap gap-2">
                      {supplier.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {supplier.licenses && supplier.licenses.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Licenses</div>
                    <div className="flex flex-wrap gap-2">
                      {supplier.licenses.map((license, idx) => (
                        <Badge key={idx} variant="outline">
                          {license}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {supplier.insuranceExpiry && (
                  <div>
                    <div className="text-sm text-gray-600">Insurance Expiry</div>
                    <div className="font-medium">
                      {format(new Date(supplier.insuranceExpiry), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Quality Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(supplier.qualityScore)} p-4 rounded-lg text-center`}>
                  {supplier.qualityScore}%
                </div>
                {performanceSummary && (
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    Avg: {performanceSummary.averageScores.quality.toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Delivery Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(supplier.deliveryScore)} p-4 rounded-lg text-center`}>
                  {supplier.deliveryScore}%
                </div>
                {performanceSummary && (
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    Avg: {performanceSummary.averageScores.delivery.toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Price Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(supplier.priceScore)} p-4 rounded-lg text-center`}>
                  {supplier.priceScore}%
                </div>
                {performanceSummary && (
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    Avg: {performanceSummary.averageScores.price.toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {performanceSummary?.latestEvaluation && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Evaluation</CardTitle>
                <CardDescription>
                  {format(new Date(performanceSummary.latestEvaluation.evaluationDate), 'MMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Quality</div>
                    <div className="text-2xl font-bold">{performanceSummary.latestEvaluation.qualityScore}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Delivery</div>
                    <div className="text-2xl font-bold">{performanceSummary.latestEvaluation.deliveryScore}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Price</div>
                    <div className="text-2xl font-bold">{performanceSummary.latestEvaluation.priceScore}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Service</div>
                    <div className="text-2xl font-bold">{performanceSummary.latestEvaluation.serviceScore}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Compliance</div>
                    <div className="text-2xl font-bold">{performanceSummary.latestEvaluation.complianceScore}%</div>
                  </div>
                </div>

                {performanceSummary.latestEvaluation.strengths?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Strengths</div>
                    <ul className="list-disc list-inside space-y-1">
                      {performanceSummary.latestEvaluation.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-600">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {performanceSummary.latestEvaluation.weaknesses?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement</div>
                    <ul className="list-disc list-inside space-y-1">
                      {performanceSummary.latestEvaluation.weaknesses.map((weakness: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-600">{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No evaluations yet</h3>
                  <p className="text-gray-600 mb-4">Start evaluating this supplier's performance</p>
                  <Link href={`/supply-chain/suppliers/${supplier.id}/evaluate`}>
                    <Button>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Create Evaluation
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {evaluations.map(evaluation => (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{evaluation.period}</CardTitle>
                        <CardDescription>
                          {format(new Date(evaluation.evaluationDate), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(evaluation.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Overall</div>
                        <div className="text-xl font-bold">{evaluation.overallScore}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Quality</div>
                        <div className="text-xl font-bold">{evaluation.qualityScore}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Delivery</div>
                        <div className="text-xl font-bold">{evaluation.deliveryScore}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Price</div>
                        <div className="text-xl font-bold">{evaluation.priceScore}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Service</div>
                        <div className="text-xl font-bold">{evaluation.serviceScore}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Compliance</div>
                        <div className="text-xl font-bold">{evaluation.complianceScore}%</div>
                      </div>
                    </div>

                    {evaluation.recommendations?.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Recommendations</div>
                        <ul className="list-disc list-inside space-y-1">
                          {evaluation.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-600">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
                  <p className="text-gray-600 mb-4">Create a contract with this supplier</p>
                  <Link href={`/supply-chain/suppliers/${supplier.id}/contract/new`}>
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      Create Contract
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contracts.map(contract => (
                <Card key={contract.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{contract.title}</CardTitle>
                        <CardDescription>Contract ID: {contract.contractId}</CardDescription>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Type</div>
                        <div className="font-medium capitalize">{contract.contractType.replace('-', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Start Date</div>
                        <div className="font-medium">{format(new Date(contract.startDate), 'MMM dd, yyyy')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">End Date</div>
                        <div className="font-medium">{format(new Date(contract.endDate), 'MMM dd, yyyy')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Value</div>
                        <div className="font-medium">
                          {contract.currency} {contract.contractValue.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {contract.description && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <p className="text-sm">{contract.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
