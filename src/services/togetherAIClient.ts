
import Together from "together-ai";

// Initialize the Together AI client
const initTogetherAIClient = (): Together | null => {
  const apiKey = localStorage.getItem("together_api_key");
  
  if (!apiKey) {
    console.error("Together.ai API key is missing");
    return null;
  }
  
  return new Together({
    apiKey: apiKey,
  });
};

// Helper function to perform a chat completion request
export const performChatCompletion = async (
  message: string,
  systemMessage?: string,
  model: string = "meta-llama-4-maverik-v0:8b-parallel-2"
): Promise<string | null> => {
  try {
    const together = initTogetherAIClient();
    
    if (!together) {
      throw new Error("Together.ai client could not be initialized");
    }
    
    const messages = systemMessage 
      ? [
          { role: "system", content: systemMessage },
          { role: "user", content: message }
        ]
      : [{ role: "user", content: message }];
    
    const response = await together.chat.completions.create({
      messages,
      model,
      safety_model: "meta-llama/Meta-Llama-Guard-3-8B"
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error performing chat completion:", error);
    return null;
  }
};

// Function for handling multimodal requests with images
export const performMultimodalRequest = async (
  message: string,
  imageBase64: string,
  model: string = "meta-llama-4-maverik-v0:8b-parallel-2"
): Promise<string | null> => {
  try {
    const together = initTogetherAIClient();
    
    if (!together) {
      throw new Error("Together.ai client could not be initialized");
    }
    
    const response = await together.chat.completions.create({
      messages: [
        { 
          role: "user", 
          content: [
            { type: "text", text: message },
            { type: "image_url", image_url: { url: imageBase64 } }
          ] 
        }
      ],
      model,
      safety_model: "meta-llama/Meta-Llama-Guard-3-8B"
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error performing multimodal request:", error);
    return null;
  }
};

// Function to test the API connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await performChatCompletion("Hello! This is a test message.");
    return result !== null;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
};
