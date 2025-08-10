"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface BusinessRule {
  id: number
  name: string
  description: string
  rule_type: string
  constraint_text: string
  severity: string
  is_active: boolean
  model_name?: string
  test_run_id?: number
  created_at: string
  updated_at: string
}

interface DefaultRule {
  name: string
  description: string
  rule_type: string
  constraint_text: string
  severity: string
}

const RULE_TYPES = [
  { value: "safety", label: "Safety", icon: Shield, color: "destructive" },
  { value: "privacy", label: "Privacy", icon: Shield, color: "warning" },
  { value: "compliance", label: "Compliance", icon: AlertTriangle, color: "warning" },
  { value: "quality", label: "Quality", icon: CheckCircle, color: "success" },
  { value: "business", label: "Business", icon: Info, color: "primary" },
]

const SEVERITY_LEVELS = [
  { value: "LOW", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-800" },
]

const AVAILABLE_MODELS = [
  { value: "all", label: "All Models" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "llama-3-8b", label: "Llama 3 8B" },
  { value: "llama-3-70b", label: "Llama 3 70B" },
]

export function BusinessRulesManager() {
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [defaultRules, setDefaultRules] = useState<DefaultRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null)


  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rule_type: "",
    constraint_text: "",
    severity: "MEDIUM",
    model_name: "all",
  })

  useEffect(() => {
    fetchRules()
    fetchDefaultRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/business-rules/")
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error("Error fetching rules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDefaultRules = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/business-rules/defaults")
      console.log("Default rules response:", response)
      if (response.ok) {
        const data = await response.json()
        console.log("Default rules data:", data)
        setDefaultRules(data)
      } else {
        console.error("Failed to fetch default rules:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching default rules:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRule 
        ? `http://localhost:8000/api/v1/business-rules/${editingRule.id}`
        : "http://localhost:8000/api/v1/business-rules/"
      
      const method = editingRule ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingRule ? "Rule Updated" : "Rule Created")
        
        setIsDialogOpen(false)
        resetForm()
        fetchRules()
      } else {
        throw new Error("Failed to save rule")
      }
    } catch (error) {
      toast.error("Failed to save business rule. Please try again.")
    }
  }

  const handleEdit = (rule: BusinessRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      rule_type: rule.rule_type,
      constraint_text: rule.constraint_text,
      severity: rule.severity,
      model_name: rule.model_name || "all",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (ruleId: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/business-rules/${ruleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Business rule has been deleted successfully.")
        fetchRules()
      }
    } catch (error) {
      toast.error("Failed to delete business rule.")
    }
  }

  const handleToggleActive = async (rule: BusinessRule) => {
    try {
      const endpoint = rule.is_active ? "deactivate" : "activate"
      const response = await fetch(`http://localhost:8000/api/v1/business-rules/${rule.id}/${endpoint}`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success(`Business rule "${rule.name}" has been ${rule.is_active ? "deactivated" : "activated"}.`)
        fetchRules()
      }
    } catch (error) {
      toast.error("Failed to update rule status.")
    }
  }

  const createFromDefault = async (defaultRule: DefaultRule) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/business-rules/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultRule),
      })

      if (response.ok) {
        toast.success(`Default rule "${defaultRule.name}" has been added to your custom rules.`)
        fetchRules()
      }
    } catch (error) {
      toast.error("Failed to create rule from default.")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rule_type: "",
      constraint_text: "",
      severity: "MEDIUM",
      model_name: "all",
    })
    setEditingRule(null)
  }

  const getRuleTypeIcon = (type: string) => {
    const ruleType = RULE_TYPES.find(rt => rt.value === type)
    return ruleType ? ruleType.icon : Info
  }

  const getSeverityColor = (severity: string) => {
    const severityLevel = SEVERITY_LEVELS.find(s => s.value === severity)
    return severityLevel ? severityLevel.color : "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Business Rule" : "Create New Business Rule"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., No Harmful Content"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type *</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this rule enforces"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraint_text">Constraint Text *</Label>
                <Textarea
                  id="constraint_text"
                  value={formData.constraint_text}
                  onChange={(e) => setFormData({ ...formData, constraint_text: e.target.value })}
                  placeholder="The actual rule/constraint to enforce"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_name">Model Name (Optional)</Label>
                  <Select
                    value={formData.model_name}
                    onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model (optional)" />
                    </SelectTrigger>
                                <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Default Business Rules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pre-configured rules that cover common safety and compliance requirements.
          </p>
        </CardHeader>
        <CardContent>
          {defaultRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading default rules...</p>
              <p className="text-xs mt-2">If this persists, check the browser console for errors.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {defaultRules.map((rule, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {React.createElement(getRuleTypeIcon(rule.rule_type), { className: "h-4 w-4" })}
                        <Badge variant="outline" className="text-xs">
                          {rule.rule_type}
                        </Badge>
                      </div>
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm">{rule.name}</h4>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">
                      {rule.description}
                    </p>
                    <div className="text-xs bg-muted p-2 rounded mb-3">
                      {rule.constraint_text}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createFromDefault(rule)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add to Custom Rules
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Business Rules Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">During Test Execution</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Business rules are applied in real-time as each test case runs</li>
                  <li>• The LLM evaluates responses against your defined constraints</li>
                  <li>• Policy violations are detected immediately, not after failure</li>
                  <li>• Rules can be model-specific or apply to all models</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Integration Points</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Rules are injected into the LLM's system prompt</li>
                  <li>• Violations are categorized as POLICY failures</li>
                  <li>• Dashboard shows policy violation rates and trends</li>
                  <li>• Rules can be enabled/disabled per test run</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Business rules are applied proactively during test execution, 
                not retroactively after failures. This ensures your AI models meet safety and 
                compliance requirements in real-time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Custom Business Rules ({rules.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your custom business rules and constraints.
          </p>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom rules yet. Create your first rule or add from defaults above.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rules.map((rule) => (
                <Card key={rule.id} className={`relative ${!rule.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {React.createElement(getRuleTypeIcon(rule.rule_type), { className: "h-4 w-4" })}
                        <Badge variant="outline" className="text-xs">
                          {rule.rule_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm">{rule.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      Model: {rule.model_name || "All Models"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">
                      {rule.description}
                    </p>
                    <div className="text-xs bg-muted p-2 rounded mb-3">
                      {rule.constraint_text}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={rule.is_active ? "outline" : "default"}
                        onClick={() => handleToggleActive(rule)}
                        className="flex-1"
                      >
                        {rule.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rule.id)}
                        className="px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
