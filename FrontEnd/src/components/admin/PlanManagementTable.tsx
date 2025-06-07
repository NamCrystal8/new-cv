import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, Users, Crown, Settings } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Plan data interface
interface SubscriptionPlan {
  id: number;
  name: string;
  tier: string;
  price_monthly: number;
  price_yearly: number;
  cv_analyses_per_month: number;
  job_analyses_per_month: number;
  cv_storage_limit: number;
  advanced_analytics: boolean;
  priority_support: boolean;
  custom_templates: boolean;
  api_access: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Plan form data interface
interface PlanFormData {
  name: string;
  tier: string;
  price_monthly: number;
  price_yearly: number;
  cv_analyses_per_month: number;
  job_analyses_per_month: number;
  cv_storage_limit: number;
  advanced_analytics: boolean;
  priority_support: boolean;
  custom_templates: boolean;
  api_access: boolean;
  is_active: boolean;
}

const defaultFormData: PlanFormData = {
  name: '',
  tier: '',
  price_monthly: 0,
  price_yearly: 0,
  cv_analyses_per_month: 0,
  job_analyses_per_month: 0,
  cv_storage_limit: 0,
  advanced_analytics: false,
  priority_support: false,
  custom_templates: false,
  api_access: false,
  is_active: true,
};

export const PlanManagementTable: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch plans from API
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle create plan
  const handleCreatePlan = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create plan');
      }

      toast({
        title: "Success",
        description: "Subscription plan created successfully.",
        variant: "default",
      });

      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit plan
  const handleEditPlan = async () => {
    if (!editingPlan) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      toast({
        title: "Success",
        description: "Subscription plan updated successfully.",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      setEditingPlan(null);
      setFormData(defaultFormData);
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete plan
  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      toast({
        title: "Success",
        description: "Subscription plan deleted successfully.",
        variant: "default",
      });

      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscription plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      tier: plan.tier,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      cv_analyses_per_month: plan.cv_analyses_per_month,
      job_analyses_per_month: plan.job_analyses_per_month,
      cv_storage_limit: plan.cv_storage_limit,
      advanced_analytics: plan.advanced_analytics,
      priority_support: plan.priority_support,
      custom_templates: plan.custom_templates,
      api_access: plan.api_access,
      is_active: plan.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get plan tier badge with dynamic colors
  const getPlanBadge = (tier: string) => {
    const tierColors = {
      'FREE': 'bg-gray-100 text-gray-600 border-gray-300',
      'BASIC': 'bg-blue-100 text-blue-800 border-blue-200',
      'PREMIUM': 'bg-purple-100 text-purple-800 border-purple-200',
      'PRO': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'BUSINESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ENTERPRISE': 'bg-red-100 text-red-800 border-red-200',
      'ULTIMATE': 'bg-green-100 text-green-800 border-green-200',
    };
    
    const colorClass = tierColors[tier.toUpperCase() as keyof typeof tierColors] || 'bg-gray-100 text-gray-600';
    
    return (
      <Badge variant="outline" className={`${colorClass} font-medium`}>
        <Crown className="h-3 w-3 mr-1" />
        {tier}
      </Badge>
    );
  };

  // Define table columns
  const columns: Column<SubscriptionPlan>[] = [
    {
      key: 'name',
      header: 'Plan Name',
      width: '200px',
      render: (plan) => (
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <div>
            <div className="font-medium text-gray-900">{plan.name}</div>
            <div className="text-sm text-gray-500">ID: {plan.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      width: '120px',
      render: (plan) => getPlanBadge(plan.tier),
    },
    {
      key: 'price_monthly',
      header: 'Monthly Price',
      width: '120px',
      render: (plan) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600">
            {formatCurrency(plan.price_monthly)}
          </span>
        </div>
      ),
    },
    {
      key: 'price_yearly',
      header: 'Yearly Price',
      width: '120px',
      render: (plan) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-600">
            {formatCurrency(plan.price_yearly)}
          </span>
        </div>
      ),
    },
    {
      key: 'cv_analyses_per_month',
      header: 'CV Analyses',
      width: '100px',
      render: (plan) => (
        <span className="text-sm">
          {plan.cv_analyses_per_month === -1 ? 'Unlimited' : plan.cv_analyses_per_month}
        </span>
      ),
    },
    {
      key: 'job_analyses_per_month',
      header: 'Job Analyses',
      width: '100px',
      render: (plan) => (
        <span className="text-sm">
          {plan.job_analyses_per_month === -1 ? 'Unlimited' : plan.job_analyses_per_month}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '100px',
      render: (plan) => (
        plan.is_active ? 
          <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge> :
          <Badge variant="destructive">Inactive</Badge>
      ),
    },
  ];

  // Define actions
  const getActions = (plan: SubscriptionPlan) => [
    {
      label: 'View Details',
      onClick: () => {
        // TODO: Implement plan detail view
        console.log('View plan:', plan);
        toast({
          title: "Info",
          description: "Plan detail view coming soon.",
          variant: "default",
        });
      },
      icon: <Eye className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    {
      label: 'Edit',
      onClick: () => openEditDialog(plan),
      icon: <Edit className="h-4 w-4" />,
      variant: 'outline' as const,
    },
    {
      label: 'Delete',
      onClick: () => handleDeletePlan(plan.id),
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
    },
  ];

  // Load plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Subscription Plan Management</h2>
          <p className="text-lg text-gray-600 mt-2">Create and manage subscription plans</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Subscription Plan</DialogTitle>
              <DialogDescription>
                Create a new subscription plan with custom features and pricing.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium Plan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      <SelectItem value="ULTIMATE">Ultimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cv_analyses">CV Analyses/Month</Label>
                  <Input
                    id="cv_analyses"
                    type="number"
                    min="-1"
                    value={formData.cv_analyses_per_month}
                    onChange={(e) => setFormData({ ...formData, cv_analyses_per_month: parseInt(e.target.value) || 0 })}
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_analyses">Job Analyses/Month</Label>
                  <Input
                    id="job_analyses"
                    type="number"
                    min="-1"
                    value={formData.job_analyses_per_month}
                    onChange={(e) => setFormData({ ...formData, job_analyses_per_month: parseInt(e.target.value) || 0 })}
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv_storage">CV Storage Limit</Label>
                  <Input
                    id="cv_storage"
                    type="number"
                    min="-1"
                    value={formData.cv_storage_limit}
                    onChange={(e) => setFormData({ ...formData, cv_storage_limit: parseInt(e.target.value) || 0 })}
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="advanced_analytics"
                      checked={formData.advanced_analytics}
                      onCheckedChange={(checked) => setFormData({ ...formData, advanced_analytics: checked })}
                    />
                    <Label htmlFor="advanced_analytics">Advanced Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="priority_support"
                      checked={formData.priority_support}
                      onCheckedChange={(checked) => setFormData({ ...formData, priority_support: checked })}
                    />
                    <Label htmlFor="priority_support">Priority Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom_templates"
                      checked={formData.custom_templates}
                      onCheckedChange={(checked) => setFormData({ ...formData, custom_templates: checked })}
                    />
                    <Label htmlFor="custom_templates">Custom Templates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="api_access"
                      checked={formData.api_access}
                      onCheckedChange={(checked) => setFormData({ ...formData, api_access: checked })}
                    />
                    <Label htmlFor="api_access">API Access</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Plan</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
            
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription>
                Update the subscription plan details and features.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name">Plan Name</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium Plan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_tier">Tier</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      <SelectItem value="ULTIMATE">Ultimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_price_monthly">Monthly Price ($)</Label>
                  <Input
                    id="edit_price_monthly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_price_yearly">Yearly Price ($)</Label>
                  <Input
                    id="edit_price_yearly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_cv_analyses">CV Analyses/Month</Label>
                  <Input
                    id="edit_cv_analyses"
                    type="number"
                    min="-1"
                    value={formData.cv_analyses_per_month}
                    onChange={(e) => setFormData({ ...formData, cv_analyses_per_month: parseInt(e.target.value) || 0 })}
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_job_analyses">Job Analyses/Month</Label>
                  <Input
                    id="edit_job_analyses"
                    type="number"
                    min="-1"
                    value={formData.job_analyses_per_month}
                    onChange={(e) => setFormData({ ...formData, job_analyses_per_month: parseInt(e.target.value) || 0 })}
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_cv_storage">CV Storage Limit</Label>
                  <Input
                    id="edit_cv_storage"
                    type="number"
                    min="-1"
                    value={formData.cv_storage_limit}
                    onChange={(e) => setFormData({ ...formData, cv_storage_limit: parseInt(e.target.value) || 0 })}
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_advanced_analytics"
                      checked={formData.advanced_analytics}
                      onCheckedChange={(checked) => setFormData({ ...formData, advanced_analytics: checked })}
                    />
                    <Label htmlFor="edit_advanced_analytics">Advanced Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_priority_support"
                      checked={formData.priority_support}
                      onCheckedChange={(checked) => setFormData({ ...formData, priority_support: checked })}
                    />
                    <Label htmlFor="edit_priority_support">Priority Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_custom_templates"
                      checked={formData.custom_templates}
                      onCheckedChange={(checked) => setFormData({ ...formData, custom_templates: checked })}
                    />
                    <Label htmlFor="edit_custom_templates">Custom Templates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_api_access"
                      checked={formData.api_access}
                      onCheckedChange={(checked) => setFormData({ ...formData, api_access: checked })}
                    />
                    <Label htmlFor="edit_api_access">API Access</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">Active Plan</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPlan} disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full">
        <DataTable
          data={plans}
          columns={columns}
          title="Subscription Plans"
          searchable={false}
          pagination={null}
          actions={getActions}
          selectable={false}
          loading={loading}
          emptyMessage="No subscription plans found"
          getItemId={(plan) => plan.id.toString()}
        />
      </div>
    </div>
  );
};
