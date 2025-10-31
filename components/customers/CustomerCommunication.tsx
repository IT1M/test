"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db/schema";
import type { Customer } from "@/types/database";
import { Mail, MessageSquare, Send, Clock, CheckCircle } from "lucide-react";
import { formatDate, formatRelativeDate } from "@/lib/utils/formatters";
import { v4 as uuidv4 } from "uuid";

interface CustomerCommunicationProps {
  customer: Customer;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  type: "email" | "sms";
  subject?: string;
  body: string;
}

interface CommunicationHistory {
  id: string;
  customerId: string;
  type: "email" | "sms";
  subject?: string;
  message: string;
  sentAt: Date;
  status: "sent" | "delivered" | "failed";
}

const EMAIL_TEMPLATES: CommunicationTemplate[] = [
  {
    id: "order-confirmation",
    name: "Order Confirmation",
    type: "email",
    subject: "Order Confirmation - {{orderId}}",
    body: "Dear {{customerName}},\n\nThank you for your order {{orderId}}. We have received your order and it is being processed.\n\nOrder Details:\n{{orderDetails}}\n\nTotal Amount: {{totalAmount}}\n\nWe will notify you once your order has been shipped.\n\nBest regards,\nMedical Products Management Team",
  },
  {
    id: "order-shipped",
    name: "Order Shipped",
    type: "email",
    subject: "Your Order Has Been Shipped - {{orderId}}",
    body: "Dear {{customerName}},\n\nGreat news! Your order {{orderId}} has been shipped and is on its way to you.\n\nTracking Information:\nTracking Number: {{trackingNumber}}\nEstimated Delivery: {{estimatedDelivery}}\n\nYou can track your shipment using the tracking number provided.\n\nBest regards,\nMedical Products Management Team",
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    type: "email",
    subject: "Payment Reminder - Invoice {{invoiceId}}",
    body: "Dear {{customerName}},\n\nThis is a friendly reminder that invoice {{invoiceId}} is due for payment.\n\nInvoice Details:\nInvoice Number: {{invoiceId}}\nAmount Due: {{amountDue}}\nDue Date: {{dueDate}}\n\nPlease arrange payment at your earliest convenience to avoid any service interruptions.\n\nIf you have already made the payment, please disregard this message.\n\nBest regards,\nMedical Products Management Team",
  },
  {
    id: "payment-overdue",
    name: "Payment Overdue Notice",
    type: "email",
    subject: "Overdue Payment Notice - Invoice {{invoiceId}}",
    body: "Dear {{customerName}},\n\nWe notice that invoice {{invoiceId}} is now overdue.\n\nInvoice Details:\nInvoice Number: {{invoiceId}}\nAmount Due: {{amountDue}}\nOriginal Due Date: {{dueDate}}\nDays Overdue: {{daysOverdue}}\n\nPlease contact us immediately to arrange payment or discuss payment terms.\n\nBest regards,\nMedical Products Management Team",
  },
  {
    id: "promotion",
    name: "Promotional Offer",
    type: "email",
    subject: "Special Offer Just for You!",
    body: "Dear {{customerName}},\n\nWe have a special offer exclusively for our valued customers!\n\n{{promotionDetails}}\n\nThis offer is valid until {{expiryDate}}.\n\nDon't miss out on this opportunity to save on your next order.\n\nBest regards,\nMedical Products Management Team",
  },
  {
    id: "thank-you",
    name: "Thank You Message",
    type: "email",
    subject: "Thank You for Your Business",
    body: "Dear {{customerName}},\n\nWe wanted to take a moment to thank you for your continued business and trust in our products.\n\nYour satisfaction is our top priority, and we're committed to providing you with the best service possible.\n\nIf you have any questions or need assistance, please don't hesitate to reach out.\n\nBest regards,\nMedical Products Management Team",
  },
];

const SMS_TEMPLATES: CommunicationTemplate[] = [
  {
    id: "order-update-sms",
    name: "Order Update",
    type: "sms",
    body: "Hi {{customerName}}, your order {{orderId}} has been {{status}}. Track at: {{trackingLink}}",
  },
  {
    id: "payment-reminder-sms",
    name: "Payment Reminder",
    type: "sms",
    body: "Reminder: Invoice {{invoiceId}} for {{amount}} is due on {{dueDate}}. Please arrange payment. Thank you!",
  },
  {
    id: "promotion-sms",
    name: "Promotion Alert",
    type: "sms",
    body: "Special offer for you! {{promotionDetails}} Valid until {{expiryDate}}. Order now!",
  },
];

export function CustomerCommunication({ customer }: CustomerCommunicationProps) {
  const [communicationType, setCommunicationType] = useState<"email" | "sms">("email");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<CommunicationHistory[]>([]);

  const templates = communicationType === "email" ? EMAIL_TEMPLATES : SMS_TEMPLATES;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (template.subject) {
        setSubject(template.subject.replace("{{customerName}}", customer.name));
      }
      setMessage(template.body.replace("{{customerName}}", customer.name));
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }

    setSending(true);

    try {
      // Simulate sending (in real implementation, this would call an API)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const communication: CommunicationHistory = {
        id: uuidv4(),
        customerId: customer.id,
        type: communicationType,
        subject: communicationType === "email" ? subject : undefined,
        message,
        sentAt: new Date(),
        status: "sent",
      };

      // In a real implementation, save to database
      setHistory([communication, ...history]);

      // Log to system logs
      await db.systemLogs.add({
        id: uuidv4(),
        action: "customer_communication_sent",
        entityType: "customer",
        entityId: customer.id,
        details: JSON.stringify({
          type: communicationType,
          template: selectedTemplate,
          subject: communicationType === "email" ? subject : undefined,
        }),
        userId: "system", // In real implementation, get from auth context
        timestamp: new Date(),
        status: "success",
      });

      // Reset form
      setSelectedTemplate("");
      setSubject("");
      setMessage("");

      alert(`${communicationType === "email" ? "Email" : "SMS"} sent successfully!`);
    } catch (error) {
      console.error("Error sending communication:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Communication Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Communication
          </CardTitle>
          <CardDescription>
            Send emails or SMS messages to {customer.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Communication Type */}
          <div className="space-y-2">
            <Label>Communication Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={communicationType === "email" ? "default" : "outline"}
                onClick={() => {
                  setCommunicationType("email");
                  setSelectedTemplate("");
                  setMessage("");
                }}
                className="flex-1"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                type="button"
                variant={communicationType === "sms" ? "default" : "outline"}
                onClick={() => {
                  setCommunicationType("sms");
                  setSelectedTemplate("");
                  setSubject("");
                  setMessage("");
                }}
                className="flex-1"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS
              </Button>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Select Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Recipient</div>
            <div className="text-sm text-muted-foreground">
              {communicationType === "email" ? (
                <>
                  <Mail className="inline h-3 w-3 mr-1" />
                  {customer.email}
                </>
              ) : (
                <>
                  <MessageSquare className="inline h-3 w-3 mr-1" />
                  {customer.phone}
                </>
              )}
            </div>
          </div>

          {/* Subject (Email only) */}
          {communicationType === "email" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter your ${communicationType} message...`}
              className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {communicationType === "sms" && (
              <div className="text-xs text-muted-foreground">
                Character count: {message.length} / 160
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim() || (communicationType === "email" && !subject.trim())}
            className="w-full"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send {communicationType === "email" ? "Email" : "SMS"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Communication History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Communication History
          </CardTitle>
          <CardDescription>
            Recent communications with this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No communication history yet
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((comm) => (
                <div key={comm.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {comm.type === "email" ? (
                        <Mail className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium">
                        {comm.type === "email" ? "Email" : "SMS"}
                      </span>
                      <Badge
                        variant={
                          comm.status === "sent"
                            ? "secondary"
                            : comm.status === "delivered"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          comm.status === "delivered"
                            ? "bg-green-500"
                            : comm.status === "sent"
                            ? "bg-blue-500"
                            : ""
                        }
                      >
                        {comm.status === "sent" && <Clock className="mr-1 h-3 w-3" />}
                        {comm.status === "delivered" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(comm.sentAt)}
                    </span>
                  </div>
                  {comm.subject && (
                    <div className="font-medium text-sm mb-1">{comm.subject}</div>
                  )}
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {comm.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Variables Help */}
      <Card>
        <CardHeader>
          <CardTitle>Template Variables</CardTitle>
          <CardDescription>
            Available variables you can use in your messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-mono text-xs bg-muted p-2 rounded">
              {"{{customerName}}"} - Customer name
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              {"{{orderId}}"} - Order ID
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              {"{{invoiceId}}"} - Invoice ID
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              {"{{totalAmount}}"} - Order total
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              {"{{dueDate}}"} - Payment due date
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded">
              {"{{trackingNumber}}"} - Tracking number
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
