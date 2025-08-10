import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Types to be shared between frontend and backend
// In a larger project, these could be in a shared package
export interface TestRun {
  id: number;
  model_name: string;
  created_at: string;
  completed_at?: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  test_cases: TestCase[];
  mutators: string[];
  datasets: string[];
  use_evolved_cases: boolean;
  detect_hallucinations: boolean;
  detect_failures_llm: boolean;
  total_cases: number;
  completed_cases: number;
}

export interface TestCase {
  id: number;
  test_run_id: number;
  source_type: string;
  category: string;
  prompt: string;
  response: string;
  latency_ms: number;
  is_failure: boolean;
  failure_logs: FailureLog[];
}

export interface FailureLog {
  id: number;
  failure_type: "HALLUCINATION" | "SCHEMA" | "POLICY" | "REFUSAL" | "CRASH";
  log_message: string;
}

export interface DashboardMetrics {
  total_runs: number;
  total_test_cases: number;
  active_runs: number;
  success_rate: number;
  hallucination_rate: number;
  failure_breakdown: Record<string, number>;
  success_rate_trend: { date: string; rate: number }[];
}

export interface BigBenchTask {
  id: string;
  name: string;
  description: string;
}

export interface EvolvedTestCase {
  id: number;
  original_test_case_id: number;
  evolved_prompt: string;
  created_at: string;
}

export interface DeveloperInsight {
  title: string;
  description: string;
  recommendation: string;
  severity: string;
}

export interface HallucinationRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface HallucinationResponse {
  answer: string;
  is_hallucination: boolean;
  confidence: number;
  class_probabilities: number[];
  average_entropy?: number;
  entropy_std?: number;
  token_entropies: number[];
  entropy_sequence: number[];  // Clean entropy sequence for charting
  error?: string;

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  pricing: string;
  context_length: string;
  type: string;
  available: boolean;
}

export interface ModelsResponse {
  total_models: number;
  total_providers: number;
  vercel_bridge_available: boolean;
  models: AIModel[];
  by_provider: Record<string, AIModel[]>;
  providers: string[];
}

// API Functions
export const createTestRun = async (
    formData: any // Using 'any' for simplicity, could be a more specific type
): Promise<TestRun> => {
  const response = await apiClient.post("/test-runs/", formData);
  return response.data;
};

export const getTestRuns = async (): Promise<TestRun[]> => {
  const response = await apiClient.get("/test-runs/");
  return response.data;
};

export const getTestRun = async (run_id: number): Promise<TestRun> => {
  const response = await apiClient.get(`/test-runs/${run_id}`);
  return response.data;
};

export const getDashboardMetrics = async (timeRangeHours: number = 24): Promise<DashboardMetrics> => {
  const response = await apiClient.get("/test-runs/dashboard-metrics/", {
    params: { time_range_hours: timeRangeHours }
  });
  return response.data;
};

export const getDeveloperInsights = async (): Promise<DeveloperInsight[]> => {
    const response = await apiClient.get("/insights/");
    return response.data;
};

export const deleteTestRun = async (run_id: number): Promise<void> => {
  await apiClient.delete(`/test-runs/${run_id}`);
};

export const getBigBenchTasks = async (): Promise<BigBenchTask[]> => {
    const response = await apiClient.get("/datasets/bigbench");
    return response.data;
};

export const cancelTestRun = async (run_id: number): Promise<TestRun> => {
    const response = await apiClient.post(`/test-runs/${run_id}/cancel`);
    return response.data;
}

export const getEvolvedCases = async (run_id: number): Promise<EvolvedTestCase[]> => {
    const response = await apiClient.get(`/test-runs/${run_id}/evolved-cases`);
    return response.data;
}

export const detectHallucination = async (request: HallucinationRequest): Promise<HallucinationResponse> => {
    const response = await apiClient.post("/hallucinations/detect", request);
    return response.data;
};

export const getHallucinationHealth = async (): Promise<any> => {
    const response = await apiClient.get("/hallucinations/health");
    return response.data;
};

export const getAvailableModels = async (): Promise<ModelsResponse> => {
    // Use Next.js API route instead of backend
    const response = await fetch("/api/ai-bridge/models");
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch models');
    }
    
    // Transform the response to match the expected format
    const modelsData = data.data;
    return {
        total_models: modelsData.total,
        total_providers: modelsData.providers.length,
        vercel_bridge_available: true,
        models: modelsData.models,
        by_provider: modelsData.models.reduce((acc: Record<string, AIModel[]>, model: AIModel) => {
            if (!acc[model.provider]) {
                acc[model.provider] = [];
            }
            acc[model.provider].push(model);
            return acc;
        }, {}),
        providers: modelsData.providers
    };
}