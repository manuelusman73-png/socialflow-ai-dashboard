/**
 * @fileoverview Gemini AI Service for content generation and intelligent automation
 * @module services/geminiService
 * @requires @google/genai
 */

import { GoogleGenAI } from "@google/genai";

/**
 * API key for Google Gemini AI service
 * @constant {string}
 * @private
 */
const apiKey = process.env.API_KEY || '';

/**
 * Initialized Google Generative AI client instance
 * @constant {GoogleGenAI}
 * @private
 */
const ai = new GoogleGenAI({ apiKey });

/**
 * Error codes for Gemini service operations
 * @enum {string}
 */
export enum GeminiErrorCode {
  /** API key is missing or invalid */
  INVALID_API_KEY = 'GEMINI_INVALID_API_KEY',
  /** Network request failed */
  NETWORK_ERROR = 'GEMINI_NETWORK_ERROR',
  /** Rate limit exceeded */
  RATE_LIMIT = 'GEMINI_RATE_LIMIT',
  /** Invalid input parameters */
  INVALID_INPUT = 'GEMINI_INVALID_INPUT',
  /** Model generation failed */
  GENERATION_FAILED = 'GEMINI_GENERATION_FAILED'
}

/**
 * Custom error class for Gemini service operations
 * @class GeminiServiceError
 * @extends Error
 */
export class GeminiServiceError extends Error {
  constructor(
    public code: GeminiErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

/**
 * Generates AI-powered social media captions optimized for specific platforms
 * 
 * @async
 * @function generateCaption
 * @param {string} topic - The subject or theme for the caption
 * @param {string} platform - Target social media platform (e.g., 'instagram', 'tiktok', 'linkedin')
 * @param {string} [tone='professional'] - Desired tone of voice ('professional', 'casual', 'friendly', 'formal')
 * @returns {Promise<string>} Generated caption with relevant hashtags
 * @throws {GeminiServiceError} When API key is invalid or generation fails
 * 
 * @example
 * ```typescript
 * const caption = await generateCaption(
 *   'New product launch',
 *   'instagram',
 *   'exciting'
 * );
 * console.log(caption); // "🚀 Exciting news! Our new product is here..."
 * ```
 */
export const generateCaption = async (topic: string, platform: string, tone: string = 'professional'): Promise<string> => {
  try {
    if (!apiKey) {
      throw new GeminiServiceError(
        GeminiErrorCode.INVALID_API_KEY,
        'API key is not configured. Please set API_KEY environment variable.'
      );
    }

    if (!topic || !platform) {
      throw new GeminiServiceError(
        GeminiErrorCode.INVALID_INPUT,
        'Topic and platform are required parameters.'
      );
    }

    const model = 'gemini-2.5-flash';
    const prompt = `Write a ${tone} social media caption for ${platform} about: "${topic}". Include relevant hashtags. Keep it engaging and concise.`;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could not generate caption.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    if (error instanceof GeminiServiceError) {
      throw error;
    }
    
    throw new GeminiServiceError(
      GeminiErrorCode.GENERATION_FAILED,
      'Error generating caption. Please check your API key and try again.',
      error
    );
  }
};

/**
 * Generates intelligent quick reply suggestions based on conversation context
 * 
 * @async
 * @function generateReply
 * @param {string} conversationHistory - Complete conversation thread for context analysis
 * @returns {Promise<string[]>} Array of 3 suggested reply messages
 * @throws {GeminiServiceError} When API key is invalid or generation fails
 * 
 * @example
 * ```typescript
 * const history = "User: When will my order arrive?\nYou: We're checking on that.";
 * const replies = await generateReply(history);
 * console.log(replies);
 * // ["Your order should arrive within 2-3 business days.", 
 * //  "Let me get you the tracking number.",
 * //  "I'll follow up with our shipping team."]
 * ```
 */
export const generateReply = async (conversationHistory: string): Promise<string[]> => {
  try {
    if (!apiKey) {
      throw new GeminiServiceError(
        GeminiErrorCode.INVALID_API_KEY,
        'API key is not configured. Please set API_KEY environment variable.'
      );
    }

    if (!conversationHistory) {
      throw new GeminiServiceError(
        GeminiErrorCode.INVALID_INPUT,
        'Conversation history is required.'
      );
    }

    const model = 'gemini-2.5-flash';
    const prompt = `You are a social media manager. Based on this conversation history, suggest 3 short, professional, and friendly quick replies for the last message.
    
    History:
    ${conversationHistory}
    
    Format output as a simple list of 3 strings separated by newlines. No numbering.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = response.text || "";
    return text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    if (error instanceof GeminiServiceError) {
      throw error;
    }
    
    return ["Thank you!", "We'll get back to you shortly.", "Could you provide more details?"];
  }
};