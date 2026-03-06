export interface Patient {
  id: string;
  name: string;
  email: string;
}

export interface Entry {
  id: number;
  patient_id: string;
  type: 'journal' | 'mood' | 'voice' | 'sos';
  content: string;
  sentiment: string;
  risk_score: number;
  analysis_json: string;
  timestamp: string;
}

export interface Alert {
  id: number;
  patient_id: string;
  patient_name: string;
  reason: string;
  risk_level: 'HIGH' | 'CRITICAL';
  timestamp: string;
  resolved: number;
}

export interface AIAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  emotions: {
    sadness: number;
    anger: number;
    fear: number;
    joy: number;
  };
  psychologicalProfile: {
    anxietyIndicator: number;
    depressionIndicator: number;
    emotionalInstability: number;
    cognitiveDistortions: string[];
    stressMarkers: string[];
  };
  riskScore: number;
  summary: string;
}
