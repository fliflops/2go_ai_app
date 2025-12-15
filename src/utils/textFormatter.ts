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