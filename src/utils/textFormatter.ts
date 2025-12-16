/**
 * Formats response text by converting escape sequences to actual characters
 * and optionally parsing JSON content
 */
export function formatResponseText(text: string): string {
  return text
    .replace(/\\n/g, '\n')  // Convert \n to actual newlines
    .replace(/\\t/g, '\t')  // Convert \t to actual tabs
    .replace(/\\r/g, '\r')  // Convert \r to actual carriage returns
    .replace(/\\\\/g, '\\') // Convert \\ to single backslash
    .replace(/\\"/g, '"')   // Convert \" to actual quotes
    .trim();
}

/**
 * Attempts to parse JSON from the formatted text
 * Returns parsed object if valid JSON, otherwise returns formatted text
 */
export function parseJsonResponse(text: string): any {
  const formattedText = formatResponseText(text);
  
  try {
    // Try to parse as JSON
    return JSON.parse(formattedText);
  } catch (error) {
    // If not valid JSON, return the formatted text
    return formattedText;
  }
}

/**
 * Converts response to properly formatted JSON output
 * Handles both JSON strings and regular text responses
 */
export function convertToJsonFormat(text: string): {
  formatted: string;
  isJson: boolean;
  parsed?: any;
} {
  const formattedText = formatResponseText(text);
  
  try {
    const parsed = JSON.parse(formattedText);
    return {
      formatted: JSON.stringify(parsed, null, 2),
      isJson: true,
      parsed: parsed
    };
  } catch (error) {
  
    return {
      formatted: formattedText,
      isJson: false
    };
  }
}

export function formatTextToJson<T = any>(text: string): T | null {
  try {
    // Step 1: Remove outer quotes if present
    let cleanedText = text.trim();
    if ((cleanedText.startsWith('"') && cleanedText.endsWith('"')) ||
        (cleanedText.startsWith("'") && cleanedText.endsWith("'"))) {
      cleanedText = cleanedText.slice(1, -1);
    }

    // Step 2: Unescape escaped characters
    cleanedText = cleanedText
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');

    // Step 3: Remove markdown code block syntax
    cleanedText = cleanedText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '');

    // Step 4: Trim whitespace
    cleanedText = cleanedText.trim();

    // Step 5: Parse JSON
    const jsonObject = JSON.parse(cleanedText);
    
    return jsonObject as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}