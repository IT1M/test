'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { Department, Position, EmergencyContact, Qualification, Certification } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    departmentId: '',
    positionId: '',
    hireDate: new Date().toISOString().split('T')[0],
    contractType: 'permanent' as 'permanent' | 'contract' | 'part-time' | 'intern',
    basicSalary: '',
    currency: 'USD',
    paymentFrequency: 'monthly' as 'monthly' | 'bi-weekly' | 'weekly',
    bankAccount: '',
    annualLeaveBalance: '20',
    sickLeaveBalance: '10',
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phone: '',
    alternatePhone: '',
  });

  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [depts, pos] = await Promise.all([
        db.departments.where('isActive').equals(1).toArray(),
        db.positions.where('isActive').equals(1).toArray(),
      ]);
      setDepartments(depts);
      setPositions(pos);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load departments and positions');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.nationalId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.departmentId || !formData.positionId) {
      toast.error('Please select department and position');
      return;
    }

    if (!emergencyContact.name || !emergencyContact.phone) {
      toast.error('Please provide emergency contact information');
      return;
    }

    try {
      setLoading(true);

      // Check for duplicate national ID
      const existing = await db.employees.where('nationalId').equals(formData.nationalId).first();
      if (existing) {
        toast.error('An employee with this National ID already exists');
        return;
      }

      // Generate employee ID
      const employeeCount = await db.employees.count();
      const employeeId = `EMP-${String(employeeCount + 1).padStart(4, '0')}`;

      const newEmployee = {
        id: uuidv4(),
        employeeId,
        nationalId: formData.nationalId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        managerId: undefined,
        hireDate: new Date(formData.hireDate),
        contractType: formData.contractType,
        contractEndDate: undefined,
        probationEndDate: undefined,
        basicSalary: parseFloat(formData.basicSalary),
        currency: formData.currency,
        paymentFrequency: formData.paymentFrequency,
        bankAccount: formData.bankAccount || undefined,
        status: 'active' as const,
        terminationDate: undefined,
        terminationReason: undefined,
        emergencyContact,
        qualifications,
        certifications,
        photo: undefined,
        documents: [],
        performanceRating: undefined,
        lastReviewDate: undefined,
        nextReviewDate: undefined,
        annualLeaveBalance: parseFloat(formData.annualLeaveBalance),
        sickLeaveBalance: parseFloat(formData.sickLeaveBalance),
        userId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: undefined,
      };

      await db.employees.add(newEmployee);
      
      toast.success('Employee registered successfully');
      router.push(`/hr/employees/${newEmployee.id}`);
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to register employee');
    } finally {
      setLoading(false);
    }
  };

  const addQualification = () => {
    setQualifications([
      ...qualifications,
      {
        degree: '',
        institution: '',
        fieldOfStudy: '',
        graduationYear: new Date().getFullYear(),
        grade: '',
      },
    ]);
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, field: keyof Qualification, value: any) => {
    const updated = [...qualifications];
    updated[index] = { ...updated[index], [field]: value };
    setQualifications(updated);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push('/hr/employees')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Register New Employee</h1>
          <p className="text-gray-600 mt-1">Add a new employee to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nationalId">National ID *</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value: any) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Employment Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Employment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departmentId">Department *</Label>
              <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="positionId">Position *</Label>
              <Select value={formData.positionId} onValueChange={(value) => setFormData({ ...formData, positionId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contractType">Contract Type *</Label>
              <Select value={formData.contractType} onValueChange={(value: any) => setFormData({ ...formData, contractType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="basicSalary">Basic Salary *</Label>
              <Input
                id="basicSalary"
                type="number"
                step="0.01"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="annualLeaveBalance">Annual Leave Balance (days)</Label>
              <Input
                id="annualLeaveBalance"
                type="number"
                value={formData.annualLeaveBalance}
                onChange={(e) => setFormData({ ...formData, annualLeaveBalance: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sickLeaveBalance">Sick Leave Balance (days)</Label>
              <Input
                id="sickLeaveBalance"
                type="number"
                value={formData.sickLeaveBalance}
                onChange={(e) => setFormData({ ...formData, sickLeaveBalance: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyName">Name *</Label>
              <Input
                id="emergencyName"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="emergencyRelationship">Relationship *</Label>
              <Input
                id="emergencyRelationship"
                value={emergencyContact.relationship}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Phone *</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={emergencyContact.phone}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="emergencyAlternatePhone">Alternate Phone</Label>
              <Input
                id="emergencyAlternatePhone"
                type="tel"
                value={emergencyContact.alternatePhone}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, alternatePhone: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Qualifications */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Qualifications</h2>
            <Button type="button" variant="outline" size="sm" onClick={addQualification}>
              <Plus className="w-4 h-4 mr-2" />
              Add Qualification
            </Button>
          </div>
          {qualifications.length === 0 ? (
            <p className="text-gray-500">No qualifications added</p>
          ) : (
            <div className="space-y-4">
              {qualifications.map((qual, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium">Qualification {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQualification(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Degree</Label>
                      <Input
                        value={qual.degree}
                        onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Institution</Label>
                      <Input
                        value={qual.institution}
                        onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Field of Study</Label>
                      <Input
                        value={qual.fieldOfStudy}
                        onChange={(e) => updateQualification(index, 'fieldOfStudy', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Graduation Year</Label>
                      <Input
                        type="number"
                        value={qual.graduationYear}
                        onChange={(e) => updateQualification(index, 'graduationYear', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/hr/employees')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
