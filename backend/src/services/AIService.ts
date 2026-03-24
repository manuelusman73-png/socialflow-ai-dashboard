import { GoogleGenerativeAI } from '@google/genai';
import { circuitBreakerService } from './CircuitBreakerService';

/**
 * AIService - Wrapper for Google Gemini AI with circuit breaker protection
 * 
 * Provides resilient AI operations with automatic failure handling
 * and fallback strategies.
 */
class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initializeAI();
  }

  /**
   * Initialize Google Gemini AI
   */
  private initializeAI(): void {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      } catch (error) {
        console.warn('Failed to initialize Gemini AI:', error);
      }
    }
  }

  /**
   * Check if AI is available
   */
  public isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Generate content with circuit breaker protection
   */
  public async generateContent(
    prompt: string,
    fallbackResponse?: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please configure API_KEY.');
    }

    return circuitBreakerService.execute(
      'ai',
      async () => {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error('Empty response from Gemini AI');
        }
        
        return text;
      },
      async () => {
        // Fallback strategy
        if (fallbackResponse) {
          console.warn('AI circuit breaker open, using fallback response');
          return fallbackResponse;
        }
        throw new Error('AI service temporarily unavailable. Please try again later.');
      }
    );
  }

  /**
   * Generate caption for social media
   */
  public async generateCaption(
    topic: string,
    platform: string,
    tone: string = 'professional'
  ): Promise<string> {
    const prompt = `Write a ${tone} social media caption for ${platform} about: "${topic}". Include relevant hashtags. Keep it engaging and concise.`;
    
    const fallback = `Check out our latest update about ${topic}! #${platform} #update`;
    
    return this.generateContent(prompt, fallback);
  }

  /**
   * Generate reply suggestions
   */
  public async generateReplies(conversationHistory: string): Promise<string[]> {
    const prompt = `You are a social media manager. Based on this conversation history, suggest 3 short, professional, and friendly quick replies for the last message.
    
History:
${conversationHistory}

Format output as a simple list of 3 strings separated by newlines. No numbering.`;

    try {
      const response = await this.generateContent(prompt);
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    } catch (error) {
      // Fallback replies
      return [
        'Thank you for reaching out!',
        "We'll get back to you shortly.",
        'Could you provide more details?'
      ];
    }
  }

  /**
   * Analyze content sentiment and topics
   */
  public async analyzeContent(content: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: string[];
    keywords: string[];
  }> {
    const prompt = `Analyze this social media content and provide:
1. Sentiment (positive/neutral/negative)
2. Main topics (2-3 topics)
3. Key keywords (3-5 keywords)

Content: "${content}"

Format as JSON: {"sentiment": "...", "topics": [...], "keywords": [...]}`;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Fallback analysis
      return {
        sentiment: 'neutral',
        topics: ['general'],
        keywords: content.split(' ').slice(0, 5),
      };
    }
  }

  /**
   * Get circuit breaker status
   */
  public getCircuitStatus() {
    return circuitBreakerService.getStats('ai');
  }
}

export const aiService = new AIService();
