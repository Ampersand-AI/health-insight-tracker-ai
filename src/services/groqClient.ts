
// Initialize the Groq API client

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqImageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

interface GroqMultiModalMessage {
  role: "user" | "assistant" | "system";
  content: string | GroqImageContent[];
}

// Helper function to perform a chat completion request
export const performChatCompletion = async (
  message: string,
  systemMessage?: string,
  model: string = "llama-3.1-8b-instant"
): Promise<string | null> => {
  try {
    const apiKey = localStorage.getItem("groq_api_key");
    
    if (!apiKey) {
      console.error("Groq API key is missing");
      return null;
    }
    
    const messages: GroqMessage[] = systemMessage 
      ? [
          { role: "system", content: systemMessage },
          { role: "user", content: message }
        ]
      : [{ role: "user", content: message }];
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages,
        model,
        temperature: 0.1,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error performing chat completion:", error);
    return null;
  }
};

// Function for handling multimodal requests with images
export const performMultimodalRequest = async (
  message: string,
  imageBase64: string,
  model: string = "llama-3.1-8b-instant"
): Promise<string | null> => {
  try {
    const apiKey = localStorage.getItem("groq_api_key");
    
    if (!apiKey) {
      console.error("Groq API key is missing");
      return null;
    }
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
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
        temperature: 0.1,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return data.choices[0].message.content;
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
