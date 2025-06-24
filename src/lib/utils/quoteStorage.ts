import { QuoteDetails, QuoteMeasurement } from "@/lib/types/providerMatch";

/**
 * Calcula as quantidades de itens baseados em metro quadrado e linear
 * usando as medições fornecidas
 */
const calculateAreaBasedQuantities = (
  quote: QuoteDetails
): { [itemId: string]: number } => {
  // Se não houver medições ou itens, retorna um objeto vazio
  if (!quote.measurements || !quote.items) return {};

  // Cria uma cópia dos itens existentes
  const updatedItems = { ...quote.items };
  const totalArea = quote.measurements.reduce((sum, room) => sum + (room.width * room.length), 0);
  const totalPerimeter = quote.measurements.reduce((sum, room) => sum + (2 * room.width + 2 * room.length), 0);

  // Esta é uma função temporária que será substituída quando adicionarmos 
  // a tabela que relaciona itens e seus tipos no banco de dados
  const getItemType = (itemId: string): string => {
    // Na versão atual, infelizmente não podemos determinar o tipo do item aqui,
    // esta informação deve vir do formulário quando os itens são selecionados
    // Vamos manter a estrutura para quando essa informação estiver disponível
    return "unknown";
  };

  // Percorre os metadados dos itens, se disponíveis
  if (quote._itemTypes) {
    // Itens de área e perímetro
    Object.entries(quote._itemTypes).forEach(([itemId, type]) => {
      if (type === "square_meter") {
        updatedItems[itemId] = totalArea;
      } else if (type === "linear_meter") {
        updatedItems[itemId] = totalPerimeter;
      }
      // Nota: os itens regulares (quantity) mantêm seus valores originais
    });

    // Itens de medida máxima (m²)
    const maxSquareItems = Object.entries(quote._itemTypes)
      .filter(([_, type]) => type === 'max_square_meter')
      .map(([itemId]) => ({
        itemId,
        referenceValue: quote._itemReferenceValues?.[itemId],
      }))
      .filter(item => typeof item.referenceValue === 'number');
    if (maxSquareItems.length > 0) {
      // Seleciona o item com menor referenceValue >= totalArea
      const valid = maxSquareItems.filter(item => totalArea <= item.referenceValue);
      if (valid.length > 0) {
        const selected = valid.reduce((min, curr) => curr.referenceValue < min.referenceValue ? curr : min, valid[0]);
        updatedItems[selected.itemId] = 1; // Marca como selecionado (quantidade 1)
      }
    }
    // Itens de medida máxima (m)
    const maxLinearItems = Object.entries(quote._itemTypes)
      .filter(([_, type]) => type === 'max_linear_meter')
      .map(([itemId]) => ({
        itemId,
        referenceValue: quote._itemReferenceValues?.[itemId],
      }))
      .filter(item => typeof item.referenceValue === 'number');
    if (maxLinearItems.length > 0) {
      const valid = maxLinearItems.filter(item => totalPerimeter <= item.referenceValue);
      if (valid.length > 0) {
        const selected = valid.reduce((min, curr) => curr.referenceValue < min.referenceValue ? curr : min, valid[0]);
        updatedItems[selected.itemId] = 1;
      }
    }
  }

  return updatedItems;
};

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

    // Calcula as quantidades baseadas em área, se aplicável
    if (quote.measurements && quote.measurements.length > 0) {
      // Atualiza os itens baseados em medidas
      quote.items = calculateAreaBasedQuantities(quote);
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
    
    // Recalcula as quantidades baseadas em área, se aplicável
    if (parsedQuote.measurements && parsedQuote.measurements.length > 0 && parsedQuote._itemTypes) {
      parsedQuote.items = calculateAreaBasedQuantities(parsedQuote);
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

/**
 * Retrieve provider IDs that have already received quotes in the current session
 * This helps show "Quote Sent" status for providers even when the user hasn't logged in yet
 */
export const getQuoteSentProviders = (): string[] => {
  try {
    const sentProvidersString = sessionStorage.getItem('quoteSentProviders');
    if (!sentProvidersString) return [];
    
    return JSON.parse(sentProvidersString);
  } catch (error) {
    console.error('Error retrieving sent providers:', error);
    return [];
  }
};

/**
 * Mark a provider as having received a quote in the current session
 */
export const markQuoteSentToProvider = (providerId: string): void => {
  try {
    if (!providerId) return;
    
    const currentProviders = getQuoteSentProviders();
    if (!currentProviders.includes(providerId)) {
      currentProviders.push(providerId);
      sessionStorage.setItem('quoteSentProviders', JSON.stringify(currentProviders));
    }
  } catch (error) {
    console.error('Error marking quote as sent:', error);
  }
};
