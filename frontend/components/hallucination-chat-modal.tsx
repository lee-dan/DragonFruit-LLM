"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Settings,
  CheckCircle,
  XCircle,
  User,
  Bot,
  Brain,
} from "lucide-react";
import { detectHallucination, HallucinationResponse } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hallucinationResult?: HallucinationResponse;
}

interface HallucinationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HallucinationChatModal({ isOpen, onClose }: HallucinationChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    max_tokens: 256,
    temperature: 0.7,
    top_p: 0.9,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await detectHallucination({
        prompt: inputValue.trim(),
        ...advancedSettings,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        hallucinationResult: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-red-600";
    if (confidence >= 0.6) return "text-orange-600";
    if (confidence >= 0.4) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col font-sans">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Hallucination Detection Chat</span>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Start a conversation to analyze responses for hallucinations
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Hallucination Analysis for Assistant Messages */}
                    {message.type === 'assistant' && message.hallucinationResult && (
                      <div className="mt-4 space-y-4">
                        <Separator />
                        
                        {/* Hallucination Detection Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Analysis Result</span>
                          <Badge 
                            variant={message.hallucinationResult.is_hallucination ? "destructive" : "default"}
                            className="flex items-center space-x-1"
                          >
                            {message.hallucinationResult.is_hallucination ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Hallucination Detected</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Likely Truthful</span>
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Charts Side by Side */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Pie Chart */}
                          <div className="text-center">
                            <div className="text-center mb-2">
                              {(() => {
                                const trueProb = message.hallucinationResult.class_probabilities[0];
                                const falseProb = message.hallucinationResult.class_probabilities[1];
                                const isTrue = trueProb >= falseProb;
                                const percentage = isTrue ? trueProb : falseProb;
                                const label = isTrue ? 'TRUE' : 'FALSE';
                                const color = isTrue ? 'text-green-600' : 'text-red-600';
                                
                                return (
                                  <span className={`text-lg font-bold ${color}`}>
                                    {(percentage * 100).toFixed(1)}% {label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="w-32 h-32 mx-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Truthful', value: message.hallucinationResult.class_probabilities[0] * 100, color: '#22c55e' },
                                      { name: 'Hallucinated', value: message.hallucinationResult.class_probabilities[1] * 100, color: '#ef4444' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={50}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {[
                                      { name: 'Truthful', value: message.hallucinationResult.class_probabilities[0] * 100, color: '#22c55e' },
                                      { name: 'Hallucinated', value: message.hallucinationResult.class_probabilities[1] * 100, color: '#ef4444' }
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>

                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Entropy Chart */}
                          {message.hallucinationResult.entropy_sequence && message.hallucinationResult.entropy_sequence.length > 0 && (
                            <div className="text-center">
                              <div className="text-xs font-medium mb-2">Entropy Sequence</div>
                              <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={message.hallucinationResult.entropy_sequence
                                    .map((entropy, index) => ({ token: index + 1, entropy: entropy }))
                                    .filter(item => item.entropy >= 0)
                                  }>
                                    <XAxis 
                                      dataKey="token" 
                                      tick={{ fontSize: 10 }}
                                      hide
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 10 }}
                                      hide
                                    />
                                    <Tooltip 
                                      contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                      }}
                                      formatter={(value: any) => [`${value.toFixed(3)} bits`, 'Entropy']}
                                      labelFormatter={(label) => `Token ${label}`}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="entropy" 
                                      stroke="hsl(var(--primary))" 
                                      strokeWidth={1.5}
                                      dot={false}
                                      activeDot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-lg p-3 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Ask a question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={2}
                  disabled={isLoading}
                  className="resize-none"
                />
              </div>
              <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Advanced</span>
              </Button>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-3 gap-4 p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="max_tokens" className="text-xs">Max Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={advancedSettings.max_tokens}
                    onChange={(e) => setAdvancedSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 256 }))}
                    min={1}
                    max={1024}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="temperature" className="text-xs">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={advancedSettings.temperature}
                    onChange={(e) => setAdvancedSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                    min={0}
                    max={2}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="top_p" className="text-xs">Top P</Label>
                  <Input
                    id="top_p"
                    type="number"
                    step="0.1"
                    value={advancedSettings.top_p}
                    onChange={(e) => setAdvancedSettings(prev => ({ ...prev, top_p: parseFloat(e.target.value) || 0.9 }))}
                    min={0}
                    max={1}
                    className="h-8"
                  />
                </div>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 