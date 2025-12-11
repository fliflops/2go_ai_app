import * as common from "oci-common";
import * as generativeaiagentruntime from "oci-generativeaiagentruntime";
import { ChatResponse } from "oci-generativeaiagentruntime/lib/response";

import {OCI_CONFIG} from '@/api-config';

/**
 * Initialize the OCI Authentication Provider
 */
function getAuthProvider(): common.ConfigFileAuthenticationDetailsProvider {
  return new common.ConfigFileAuthenticationDetailsProvider(
    OCI_CONFIG.configFilePath,
    OCI_CONFIG.configProfile
  );
}

/**
 * Create a Generative AI Agent Runtime Client
 */
export function createClient(): generativeaiagentruntime.GenerativeAiAgentRuntimeClient {
  const provider = getAuthProvider();
  return new generativeaiagentruntime.GenerativeAiAgentRuntimeClient({
    authenticationDetailsProvider: provider
  });
}

/**
 * Example 1: Create a new chat session
 */
export async function createSession(
  client: generativeaiagentruntime.GenerativeAiAgentRuntimeClient
): Promise<string> {
  try {
    const createSessionRequest: generativeaiagentruntime.requests.CreateSessionRequest = {
        agentEndpointId: OCI_CONFIG.agentEndpointId,
        createSessionDetails: {
            displayName: "Invoice Validation",
            description: "Invoice Validation Chat Session",
            
        }
    };

    const response = await client.createSession(createSessionRequest);
    const sessionId = response.session.id;
    
    console.log("Session created successfully!");
    console.log("Session ID:", sessionId);
    
    return sessionId;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
}

/**
 * Example 2: Send a message to the agent (chat)
 */
export async function chatWithAgent(
  client: generativeaiagentruntime.GenerativeAiAgentRuntimeClient,
  sessionId: string,
  userMessage: string
) {
  try {
    const chatRequest: generativeaiagentruntime.requests.ChatRequest = {
      agentEndpointId: OCI_CONFIG.agentEndpointId,
      chatDetails: {
        sessionId: sessionId,
        userMessage: userMessage,
        
        shouldStream: false // Set to true for streaming responses
      }
    };
    
    const response = await client.chat(chatRequest) as ChatResponse

    return response;

  } catch (error) {
    console.error("Error chatting with agent:", error);
    throw error;
  }
}

/**
 * Example 4: Get session details
 */
export async function getSession(
  client: generativeaiagentruntime.GenerativeAiAgentRuntimeClient,
  sessionId: string
) {
  try {
    const getSessionRequest: generativeaiagentruntime.requests.GetSessionRequest = {
      agentEndpointId: OCI_CONFIG.agentEndpointId,
      sessionId: sessionId
    };

    const response = await client.getSession(getSessionRequest);

    return {
        id: response.session.id,
        displayName: response.session.displayName,
        description: response.session.description,
        timeCreated: response.session.timeCreated
    }   
  
  } catch (error) {
    console.error("Error getting session:", error);
    throw error;
  }
}

/**
 * Example 5: Update session metadata
 */
export async function updateSession(
  client: generativeaiagentruntime.GenerativeAiAgentRuntimeClient,
  sessionId: string
): Promise<void> {
  try {
    const updateSessionRequest: generativeaiagentruntime.requests.UpdateSessionRequest = {
      agentEndpointId: OCI_CONFIG.agentEndpointId,
      sessionId: sessionId,
      updateSessionDetails: {
        displayName: "Updated Session Name",
        description: "Updated description"
      }
    };

    await client.updateSession(updateSessionRequest);
    console.log("Session updated successfully!");
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
}

/**
 * Example 6: Delete a session
 */
export async function deleteSession(
  client: generativeaiagentruntime.GenerativeAiAgentRuntimeClient,
  sessionId: string
): Promise<void> {
  try {
    const deleteSessionRequest: generativeaiagentruntime.requests.DeleteSessionRequest = {
      agentEndpointId: OCI_CONFIG.agentEndpointId,
      sessionId: sessionId
    };

    await client.deleteSession(deleteSessionRequest);
    console.log("Session deleted successfully!");
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}
