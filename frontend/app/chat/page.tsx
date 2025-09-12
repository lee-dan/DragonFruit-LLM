"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Settings,
  Plus,
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    max_tokens: 256,
    temperature: 0.7,
    top_p: 0.9,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setShowSettingsDropdown(false);

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
    <div className="h-screen bg-white">
      {/* Main Chat Area - Centered */}
      <div className="h-full flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-start justify-center h-full pt-40 px-6">
              <div className="text-center w-full max-w-5xl mx-auto">
                <div className="mb-6">
                  <img 
                    src="/fulllogo_transparent.png" 
                    alt="FailProof LLM" 
                    className="mx-auto h-52 w-auto"
                  />
                </div>
                
                {/* Centered Input Box */}
                <div className="relative">
                  <div className="bg-white border border-gray-300 rounded-2xl px-8 py-4 shadow-sm hover:shadow-md transition-shadow w-full max-w-3xl mx-auto">
                    <div className="flex items-start">
                      <Plus className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                      <textarea
                        placeholder="Ask anything"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 resize-none min-h-[1.5rem] max-h-32 overflow-y-auto"
                        rows={1}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-end mt-3 space-x-2">
                      <div className="relative">
                        <Button
                          type="button"
                          onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                          className="bg-transparent hover:bg-gray-200 text-gray-600 rounded-lg w-8 h-8 p-0"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        
                        {/* Settings Dropdown */}
                        {showSettingsDropdown && (
                          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 z-50">
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label htmlFor="max_tokens_initial" className="text-xs text-gray-600">Max Tokens</Label>
                                <Input
                                  id="max_tokens_initial"
                                  type="number"
                                  value={advancedSettings.max_tokens}
                                  onChange={(e) => setAdvancedSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 256 }))}
                                  min={1}
                                  max={1024}
                                  className="h-8 !bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="temperature_initial" className="text-xs text-gray-600">Temperature</Label>
                                <Input
                                  id="temperature_initial"
                                  type="number"
                                  step="0.1"
                                  value={advancedSettings.temperature}
                                  onChange={(e) => setAdvancedSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                                  min={0}
                                  max={2}
                                  className="h-8 !bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="top_p_initial" className="text-xs text-gray-600">Top P</Label>
                                <Input
                                  id="top_p_initial"
                                  type="number"
                                  step="0.1"
                                  value={advancedSettings.top_p}
                                  onChange={(e) => setAdvancedSettings(prev => ({ ...prev, top_p: parseFloat(e.target.value) || 0.9 }))}
                                  min={0}
                                  max={1}
                                  className="h-8 !bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleSubmit}
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <p className="text-sm text-red-600 mt-4">{error}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 p-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? '' : ''}`}>
                    {message.type === 'user' ? (
                      <div className="bg-gray-200 rounded-2xl px-4 py-3 min-h-fit">
                        <p className="text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    ) : (
                      <div className="min-h-fit">
                        <p className="text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
                      
                      {/* Hallucination Analysis for Assistant Messages */}
                      {message.type === 'assistant' && message.hallucinationResult && (
                        <div className="mt-4 space-y-4">
                          <Separator className="bg-gray-200" />
                          

                          {/* Charts Side by Side */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Pie Chart */}
                            <div className="text-center">
                              <div className="text-center mb-2">
                                {(() => {
                                  const trueProb = message.hallucinationResult.class_probabilities[0];
                                  const falseProb = message.hallucinationResult.class_probabilities[1];
                                  const isTrue = trueProb >= falseProb;
                                  const color = isTrue ? 'text-green-600' : 'text-red-600';
                                  
                                  return (
                                    <span className={`text-lg font-bold ${color}`}>
                                      {(trueProb * 100).toFixed(1)}% confidence
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
                                <div className="text-xs font-medium mb-2 text-gray-600">Entropy Sequence</div>
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
                                          background: "white",
                                          border: "1px solid #e5e7eb",
                                          borderRadius: "8px",
                                          color: "#2563eb",
                                        }}
                                        formatter={(value: any) => [`${value.toFixed(3)}`, 'Entropy']}
                                        labelFormatter={(label) => `Token ${label}`}
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="entropy" 
                                        stroke="#2563eb" 
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
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area - Only show when there are messages */}
        {messages.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <textarea
                    placeholder="Send a message"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 resize-none min-h-[1.5rem] max-h-32 overflow-y-auto"
                    rows={1}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                  <div className="flex items-center justify-end mt-3 space-x-2">
                    <div className="relative" ref={dropdownRef}>
                      <Button
                        type="button"
                        onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                        className="bg-transparent hover:bg-gray-200 text-gray-600 rounded-lg w-8 h-8 p-0"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      
                      {/* Settings Dropdown */}
                      {showSettingsDropdown && (
                        <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 z-50">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor="max_tokens" className="text-xs text-gray-600">Max Tokens</Label>
                              <Input
                                id="max_tokens"
                                type="number"
                                value={advancedSettings.max_tokens}
                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 256 }))}
                                min={1}
                                max={1024}
                                className="h-8 !bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="temperature" className="text-xs text-gray-600">Temperature</Label>
                              <Input
                                id="temperature"
                                type="number"
                                step="0.1"
                                value={advancedSettings.temperature}
                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                                min={0}
                                max={2}
                                className="h-8 !bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="top_p" className="text-xs text-gray-600">Top P</Label>
                              <Input
                                id="top_p"
                                type="number"
                                step="0.1"
                                value={advancedSettings.top_p}
                                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, top_p: parseFloat(e.target.value) || 0.9 }))}
                                min={0}
                                max={1}
                                className="h-8 !bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg w-8 h-8 p-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
