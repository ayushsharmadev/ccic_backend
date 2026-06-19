// AI Service for text generation using Google Gemini SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
  constructor(apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    if (!apiKey) {
      console.warn('Gemini API key is not configured');
    }
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /**
   * Generate text using Gemini AI SDK
   * @param {string} systemPrompt - System instructions for AI
   * @param {string} userPrompt - User input/query
   * @param {number} temperature - Creativity level (0-1)
   * @returns {Promise<string>} - Generated text
   */
  async generateText(systemPrompt, userPrompt, temperature = 0.7) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API key is not configured');
      }

      // Get the generative model
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Combine system and user prompts
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      // Generate content
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const generatedText = response.text();

      return generatedText;
    } catch (error) {
      console.error('AI Service Error:', error);

      // Provide detailed error message
      let errorMessage = 'AI generation failed';

      if (error.message) {
        errorMessage = error.message;
      }

      // Check for specific Gemini API errors
      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.status === 500) {
        errorMessage = 'Gemini API server error. Please try again later.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API key error: ' + error.message;
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please contact administrator.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Clean HTML content from markdown code blocks
   * @param {string} text - Raw text with potential markdown
   * @returns {string} - Cleaned HTML content
   */
  cleanHTMLContent(text) {
    let cleanedText = text.trim();

    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```html')) {
      cleanedText = cleanedText.replace(/```html\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    return cleanedText.trim();
  }

  /**
   * Generate structured data (JSON object)
   * @param {string} systemPrompt - System instructions for AI
   * @param {string} userPrompt - User input/query
   * @returns {Promise<Object>} - Parsed JSON object
   */
  async generateStructuredData(systemPrompt, userPrompt) {
    try {
      const text = await this.generateText(systemPrompt, userPrompt, 0.5);

      // Extract JSON from response (handles markdown code blocks)
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      // Parse JSON
      const parsedData = JSON.parse(jsonText.trim());
      return parsedData;
    } catch (error) {
      console.error('AI Structured Data Error:', error);

      // Provide detailed error message
      let errorMessage = 'Failed to parse AI response';

      if (error instanceof SyntaxError) {
        errorMessage = `JSON parsing error: ${error.message}. AI returned invalid JSON format.`;
        console.error('Invalid JSON received:', jsonText);
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Generate SEO data for college
   * @param {Object} collegeData - College information
   * @returns {Promise<Object>} - SEO fields object
   */
  async generateCollegeSEO(collegeData) {
    const systemPrompt = `You are an expert SEO specialist for educational institutions in India, specifically MBBS (Bachelor of Bangladesh Medicine and Surgery) colleges.

Your task is to generate comprehensive SEO data based on the college information provided. Generate SEO-optimized content that:
1. Is relevant for Indian students searching for MBBS colleges
2. Includes location-based keywords (state, district, city)
3. Follows SEO best practices (character limits, keyword placement)
4. Is unique and compelling for search engines

IMPORTANT: Return ONLY a valid JSON object with the following structure (no additional text, no markdown):
{
  "metaTitle": "STRICTLY max 60 characters, include college name and location",
  "metaDescription": "STRICTLY max 160 characters, compelling description with keywords",
  "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "focusKeyword": "primary keyword for this college page (max 50 characters)",
  "ogTitle": "STRICTLY max 60 characters, engaging title for social media",
  "ogDescription": "STRICTLY max 160 characters, compelling description for social media",
  "twitterTitle": "STRICTLY max 60 characters, catchy title for Twitter",
  "twitterDescription": "STRICTLY max 160 characters, engaging description for Twitter"
}

CRITICAL CHARACTER LIMITS - DO NOT EXCEED:
- metaTitle: Maximum 60 characters (STRICT)
- metaDescription: Maximum 160 characters (STRICT)
- ogTitle: Maximum 60 characters (STRICT)
- ogDescription: Maximum 160 characters (STRICT)
- twitterTitle: Maximum 60 characters (STRICT)
- twitterDescription: Maximum 160 characters (STRICT)
- focusKeyword: Maximum 50 characters

Guidelines:
- Meta Title: Include college name + location + "MBBS College" (within 60 chars)
- Meta Description: Highlight key features (estd year, affiliation, courses, location) (within 160 chars)
- Keywords: Include MBBS, Ayurveda, college name, location, affiliation
- Focus Keyword: Most important search term for this college
- Social titles/descriptions: More engaging and action-oriented than meta tags (within character limits)`;

    const userPrompt = `Generate SEO data for the following college:

College Name: ${collegeData.name}
${collegeData.popularName ? `Popular Name: ${collegeData.popularName}` : ''}
${collegeData.estdYear ? `Established: ${collegeData.estdYear}` : ''}
${collegeData.state ? `State: ${collegeData.state}` : ''}
${collegeData.district ? `District: ${collegeData.district}` : ''}
${collegeData.location ? `Location: ${collegeData.location}` : ''}
${collegeData.ownership ? `Ownership: ${collegeData.ownership}` : ''}
${collegeData.affiliation ? `Affiliation: ${collegeData.affiliation}` : ''}
${collegeData.shortDescription ? `About: ${collegeData.shortDescription}` : ''}

Generate comprehensive SEO data following the JSON structure specified in the system prompt.`;

    try {
      const result = await this.generateStructuredData(systemPrompt, userPrompt);

      // Validate required fields
      const requiredFields = ['metaTitle', 'metaDescription', 'metaKeywords', 'focusKeyword', 'ogTitle', 'ogDescription', 'twitterTitle', 'twitterDescription'];
      const missingFields = requiredFields.filter(field => !result[field]);

      if (missingFields.length > 0) {
        throw new Error(`AI response missing fields: ${missingFields.join(', ')}`);
      }

      return result;
    } catch (error) {
      console.error('College SEO Generation Error:', error);
      throw new Error(`Failed to generate college SEO data: ${error.message}`);
    }
  }

  /**
   * Generate news article content and SEO data
   * @param {Object} newsData - News information (title, category)
   * @returns {Promise<Object>} - Generated content and SEO data
   */
  async generateNewsContent(newsData) {
    const systemPrompt = `You are an expert content and SEO specialist for MBBS (Bachelor of Bangladesh Medicine and Surgery) education in India.

Generate a complete news article with SEO data in JSON format.

Requirements:
1. content: HTML content (800-1500 characters) with proper tags (<p>, <h3>, <strong>, <ul>, <li>)
2. shortDescription: Compelling summary (STRICTLY max 200 characters)
3. metaTitle: SEO title (STRICTLY max 60 characters) 
4. metaDescription: SEO description (STRICTLY max 160 characters)
5. metaKeywords: 5-8 relevant keywords (comma-separated string)
6. focusKeyword: Primary keyword (STRICTLY max 50 characters)
7. ogTitle: Social media title (STRICTLY max 60 characters)
8. ogDescription: Social media description (STRICTLY max 160 characters)

CRITICAL CHARACTER LIMITS - DO NOT EXCEED:
- metaTitle: Maximum 60 characters (STRICT)
- metaDescription: Maximum 160 characters (STRICT)
- shortDescription: Maximum 200 characters (STRICT)
- ogTitle: Maximum 60 characters (STRICT)
- ogDescription: Maximum 160 characters (STRICT)
- focusKeyword: Maximum 50 characters (STRICT)

Context: MBBS colleges, Bangladesh education, admissions, healthcare in India

IMPORTANT: Return ONLY valid JSON object with all 8 fields, no markdown formatting.`;

    const userPrompt = `Generate complete news article data for:
Title: "${newsData.title}"
Category: ${newsData.category || 'General'}

Return JSON object with these exact fields: content, shortDescription, metaTitle, metaDescription, metaKeywords, focusKeyword, ogTitle, ogDescription`;

    try {
      const result = await this.generateStructuredData(systemPrompt, userPrompt);

      // Validate required fields
      const requiredFields = ['content', 'shortDescription', 'metaTitle', 'metaDescription', 'metaKeywords', 'focusKeyword', 'ogTitle', 'ogDescription'];
      const missingFields = requiredFields.filter(field => !result[field]);

      if (missingFields.length > 0) {
        throw new Error(`AI response missing fields: ${missingFields.join(', ')}`);
      }

      // Clean HTML content from markdown blocks
      if (result.content) {
        result.content = this.cleanHTMLContent(result.content);
      }

      // Set Twitter fields same as OG fields
      result.twitterTitle = result.ogTitle;
      result.twitterDescription = result.ogDescription;

      return result;
    } catch (error) {
      console.error('News Content Generation Error:', error);
      throw new Error(`Failed to generate news content: ${error.message}`);
    }
  }

  /**
   * Generate page content and SEO data
   * @param {Object} pageData - Page information (title, heading)
   * @returns {Promise<Object>} - Generated content and SEO data
   */
  async generatePageContent(pageData) {
    const systemPrompt = `You are an expert content and SEO specialist for educational websites, specifically MBBS (Bachelor of Bangladesh Medicine and Surgery) education in India.

Generate complete page content with SEO data in JSON format.

Requirements:
1. shortDescription: Compelling summary (STRICTLY max 500 characters)
2. longDescription: Comprehensive HTML content (1500-2500 characters) with proper tags (<h2>, <h3>, <p>, <strong>, <ul>, <li>)
3. metaTitle: SEO title (STRICTLY max 60 characters) 
4. metaDescription: SEO description (STRICTLY max 160 characters)
5. metaKeywords: 5-8 relevant keywords (comma-separated string)
6. focusKeyword: Primary keyword (STRICTLY max 50 characters)
7. ogTitle: Social media title (STRICTLY max 60 characters)
8. ogDescription: Social media description (STRICTLY max 160 characters)

CRITICAL CHARACTER LIMITS - DO NOT EXCEED:
- metaTitle: Maximum 60 characters (STRICT)
- metaDescription: Maximum 160 characters (STRICT)
- shortDescription: Maximum 500 characters (STRICT)
- ogTitle: Maximum 60 characters (STRICT)
- ogDescription: Maximum 160 characters (STRICT)
- focusKeyword: Maximum 50 characters (STRICT)

Style: Professional, informative, and engaging
Context: MBBS education, Bangladesh colleges, student resources, admission guidance

IMPORTANT: Return ONLY valid JSON object with all 8 fields, no markdown formatting.`;

    const userPrompt = `Generate complete page content for:
Title: "${pageData.title}"
${pageData.heading ? `Heading: "${pageData.heading}"` : ''}

Return JSON object with these exact fields: shortDescription, longDescription, metaTitle, metaDescription, metaKeywords, focusKeyword, ogTitle, ogDescription`;

    try {
      const result = await this.generateStructuredData(systemPrompt, userPrompt);

      // Validate required fields
      const requiredFields = ['shortDescription', 'longDescription', 'metaTitle', 'metaDescription', 'metaKeywords', 'focusKeyword', 'ogTitle', 'ogDescription'];
      const missingFields = requiredFields.filter(field => !result[field]);

      if (missingFields.length > 0) {
        throw new Error(`AI response missing fields: ${missingFields.join(', ')}`);
      }

      // Clean HTML content from markdown blocks
      if (result.longDescription) {
        result.longDescription = this.cleanHTMLContent(result.longDescription);
      }

      // Set Twitter fields same as OG fields
      result.twitterTitle = result.ogTitle;
      result.twitterDescription = result.ogDescription;

      return result;
    } catch (error) {
      console.error('Page Content Generation Error:', error);
      throw new Error(`Failed to generate page content: ${error.message}`);
    }
  }

  /**
   * Generate blog article content and SEO data
   * @param {Object} blogData - Blog information (title, category)
   * @returns {Promise<Object>} - Generated content and SEO data
   */
  async generateBlogContent(blogData) {
    const systemPrompt = `You are an expert content and SEO specialist for MBBS (Bachelor of Bangladesh Medicine and Surgery) education in India.

Generate a complete blog post with SEO data in JSON format.

Requirements:
1. content: HTML content (800-1500 characters) with proper tags (<p>, <h3>, <strong>, <ul>, <li>)
2. excerpt: Engaging summary (STRICTLY max 200 characters)
3. readTime: Estimated reading time in minutes (number between 3-10)
4. tags: 3-5 relevant tags for categorization (comma-separated string)
5. metaTitle: SEO title (STRICTLY max 60 characters) 
6. metaDescription: SEO description (STRICTLY max 160 characters)
7. metaKeywords: 5-8 relevant keywords (comma-separated string)
8. focusKeyword: Primary keyword (STRICTLY max 50 characters)
9. ogTitle: Social media title (STRICTLY max 60 characters)
10. ogDescription: Social media description (STRICTLY max 160 characters)

CRITICAL CHARACTER LIMITS - DO NOT EXCEED:
- metaTitle: Maximum 60 characters (STRICT)
- metaDescription: Maximum 160 characters (STRICT)
- excerpt: Maximum 200 characters (STRICT)
- ogTitle: Maximum 60 characters (STRICT)
- ogDescription: Maximum 160 characters (STRICT)
- focusKeyword: Maximum 50 characters (STRICT)

Style: Conversational, helpful, and reader-friendly
Context: MBBS colleges, Bangladesh education, student life, career guidance

IMPORTANT: Return ONLY valid JSON object with all 10 fields, no markdown formatting.`;

    const userPrompt = `Generate complete blog post data for:
Title: "${blogData.title}"
Category: ${blogData.category || 'General'}

Return JSON object with these exact fields: content, excerpt, readTime, tags, metaTitle, metaDescription, metaKeywords, focusKeyword, ogTitle, ogDescription`;

    try {
      const result = await this.generateStructuredData(systemPrompt, userPrompt);

      // Validate required fields
      const requiredFields = ['content', 'excerpt', 'readTime', 'tags', 'metaTitle', 'metaDescription', 'metaKeywords', 'focusKeyword', 'ogTitle', 'ogDescription'];
      const missingFields = requiredFields.filter(field => !result[field]);

      if (missingFields.length > 0) {
        throw new Error(`AI response missing fields: ${missingFields.join(', ')}`);
      }

      // Clean HTML content from markdown blocks
      if (result.content) {
        result.content = this.cleanHTMLContent(result.content);
      }

      // Set Twitter fields same as OG fields
      result.twitterTitle = result.ogTitle;
      result.twitterDescription = result.ogDescription;

      return result;
    } catch (error) {
      console.error('Blog Content Generation Error:', error);
      throw new Error(`Failed to generate blog content: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

