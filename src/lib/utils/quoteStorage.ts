
import { QuoteDetails } from "@/lib/types/providerMatch";

/**
 * Stores quote data in sessionStorage with validation
 */
export const storeQuoteData = (quote: QuoteDetails): boolean => {
  try {
    // Validate essential fields
    if (!quote.serviceId) {
      console.error("Cannot store quote: missing serviceId");
      return false;
    }
    
    if (!quote.address || !quote.address.street || !quote.address.city) {
      console.error("Cannot store quote: missing address information");
      return false;
    }
    
    // Add timestamp for debugging
    const quoteWithTimestamp = {
      ...quote,
      _storedAt: new Date().toISOString()
    };
    
    // Log the data we're storing
    console.log("Storing quote data:", quoteWithTimestamp);
    
    // Store the complete quote data
    sessionStorage.setItem('currentQuote', JSON.stringify(quoteWithTimestamp));
    return true;
  } catch (error) {
    console.error("Error storing quote data:", error);
    return false;
  }
};

/**
 * Retrieves and validates quote data from sessionStorage
 */
export const retrieveQuoteData = (): QuoteDetails | null => {
  try {
    const storedQuote = sessionStorage.getItem('currentQuote');
    if (!storedQuote) {
      console.log("No stored quote data found");
      return null;
    }
    
    const parsedQuote = JSON.parse(storedQuote) as QuoteDetails;
    
    // Validate essential fields
    if (!parsedQuote.serviceId) {
      console.error("Retrieved invalid quote: missing serviceId");
      return null;
    }
    
    console.log("Retrieved quote data:", parsedQuote);
    return parsedQuote;
  } catch (error) {
    console.error("Error retrieving quote data:", error);
    return null;
  }
};

/**
 * Clears stored quote data
 */
export const clearQuoteData = (): void => {
  try {
    sessionStorage.removeItem('currentQuote');
    console.log("Quote data cleared from storage");
  } catch (error) {
    console.error("Error clearing quote data:", error);
  }
};
