import { GoogleGenAI, Type } from "@google/genai";
import { FinancialAnalysis, Transaction, TransactionType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to calculate summary locally to save AI token generation time
const calculateSummary = (transactions: Transaction[]) => {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === TransactionType.INCOME) {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      const cat = t.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    }
  });

  let topExpenseCategory = 'None';
  let maxCatVal = 0;
  
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > maxCatVal) {
      maxCatVal = val;
      topExpenseCategory = cat;
    }
  });

  return {
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    topExpenseCategory
  };
};

export const analyzeStatement = async (base64Pdf: string): Promise<FinancialAnalysis> => {
  const modelId = "gemini-2.5-flash"; 
  
  const prompt = `
    You are an expert financial analyst. Analyze the attached PDF statement (INR currency).
    
    1. Identify the statement period (e.g., "October 2023").
    2. Extract all transactions with date, description, amount, and categorize them.
       - General Categories: Groceries, Utilities, Dining, Travel, Rent, Salary, UPI/Transfer, Investment, Shopping, Medical.
       - **CRITICAL - Fee Categorization**: You MUST categorize any bank charges, fees, or taxes into one of these EXACT categories:
         - "Late Payment Fee" (for late penalties)
         - "Interest Charge" (for finance charges/interest)
         - "Forex Fee" (for currency markup)
         - "Annual/Renewal Fee"
         - "Service Charge" (for processing fees, atm fees, etc)
         - "Tax/GST" (for IGST, CGST, SGST, or generic taxes)
         - "Overlimit Fee"
    3. Identify if a transaction is INCOME (Credit) or EXPENSE (Debit).
    4. Provide specific "scope for reduction" (savings opportunities) based on spending patterns.
    5. Summarize spending habits in brief bullet points.

    Do not calculate totals. Just extract the raw data accurately.
    Return data strictly in JSON. Dates as YYYY-MM-DD.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            statementPeriod: { type: Type.STRING },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] }
                }
              }
            },
            savingsOpportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedMonthlySavings: { type: Type.NUMBER },
                  impact: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] }
                }
              }
            },
            spendingHabits: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const partialData = JSON.parse(text);
    
    // Ensure arrays exist
    const transactions = partialData.transactions || [];
    
    // Calculate summary locally
    const summary = calculateSummary(transactions);

    return {
      statementPeriod: partialData.statementPeriod || 'Unknown Period',
      transactions: transactions,
      savingsOpportunities: partialData.savingsOpportunities || [],
      spendingHabits: partialData.spendingHabits || [],
      summary
    } as FinancialAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the document. Please ensure it is a clear PDF statement.");
  }
};