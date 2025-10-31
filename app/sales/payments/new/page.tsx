'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PaymentsService } from '@/services/database/payments';
import { db } from '@/lib/db/schema';
import type { Invoice, Customer } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function NewPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedInvoiceId = searchParams.get('invoiceId');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId || '');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find(i => i.id === selectedInvoiceId);
      setSelectedInvoice(invoice || null);
      if (invoice) {
        setAmount(invoice.balanceAmount.toString());
      }
    } else {
      setSelectedInvoice(null);
      setAmount('');
    }
  }, [selectedInvoiceId, invoices]);

  const loadData = async () => {
    try {
      // Load unpaid/partially paid invoices
      const invoicesData = await db.invoices
        .where('status')
        .anyOf(['unpaid', 'partially-paid', 'overdue'])
        .toArray();

      setInvoices(invoicesData);

      // Load customers
      const customersData = await db.customers.toArray();
      const customersMap = new Map(customersData.map(c => [c.id, c]));
      setCustomers(customersMap);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validation
      if (!selectedInvoiceId) {
        toast.error('Please select an invoice');
        return;
      }

      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      if (!selectedInvoice) {
        toast.error('Selected invoice not found');
        return;
      }

      if (paymentAmount > selectedInvoice.balanceAmount) {
        toast.error('Payment amount exceeds invoice balance');
        return;
      }

      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }

      if (!referenceNumber.trim()) {
        toast.error('Please enter a reference number');
        return;
      }

      setSaving(true);

      // Record payment
      const payment = await PaymentsService.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: paymentAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim() || undefined,
      });

      toast.success('Payment recorded successfully');
      router.push(`/sales/invoices/${selectedInvoiceId}`);
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const customer = selectedInvoice ? customers.get(selectedInvoice.customerId) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-600 mt-1">Record a payment for an invoice</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Invoice Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoice">Select Invoice *</Label>
                  <select
                    id="invoice"
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md mt-1"
                    required
                  >
                    <option value="">Select an invoice</option>
                    {invoices.map((invoice) => {
                      const cust = customers.get(invoice.customerId);
                      return (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceId} - {cust?.name} - Balance: $
                          {invoice.balanceAmount.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedInvoice && customer && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Customer</div>
                        <div className="font-medium">{customer.name}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Invoice ID</div>
                        <div className="font-medium">{selectedInvoice.invoiceId}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Amount</div>
                        <div className="font-medium">
                          ${selectedInvoice.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Paid Amount</div>
                        <div className="font-medium text-green-600">
                          ${selectedInvoice.paidAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Balance Due</div>
                        <div className="font-medium text-orange-600">
                          ${selectedInvoice.balanceAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Due Date</div>
                        <div className="font-medium">
                          {format(new Date(selectedInvoice.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      max={selectedInvoice?.balanceAmount}
                      className="pl-10"
                      required
                    />
                  </div>
                  {selectedInvoice && parseFloat(amount) > selectedInvoice.balanceAmount && (
                    <p className="text-sm text-red-600 mt-1">
                      Amount exceeds invoice balance
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md mt-1"
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="wire_transfer">Wire Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="referenceNumber">Reference Number *</Label>
                  <Input
                    id="referenceNumber"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Transaction ID, Check number, etc."
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-md mt-1"
                    placeholder="Additional notes about this payment..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {saving ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPaymentContent />
    </Suspense>
  );
}
