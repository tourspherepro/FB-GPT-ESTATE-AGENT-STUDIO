
'use server';

/**
 * @fileOverview An AI Outbound Calling Agent for an estate agency.
 * Its single purpose is to call leads and book valuation appointments.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MessageData } from 'genkit/model';

// Schemas
const LeadDetailsSchema = z.object({
  leadId: z.string().describe('The unique ID for the lead.'),
  leadName: z.string().describe('The full name of the lead.'),
  propertyAddress: z.string().describe('The property address for the valuation.'),
  phoneNumber: z.string().describe('The contact phone number for the lead.'),
});
export type LeadDetails = z.infer<typeof LeadDetailsSchema>;

const BookingRequestSchema = z.object({
  leadId: z.string(),
  requestedDate: z.string(),
  requestedTime: z.string(),
  durationMinutes: z.number(),
  contactName: z.string(),
  propertyAddress: z.string(),
  phone: z.string(),
});

const ConversationTurnSchema = z.object({
  voice_output: z.string().nullable().describe('The sentence the agent will speak. Null if waiting for backend.'),
  intent: z.string().describe('The internal reasoning or next action for the agent.'),
  bookingRequest: BookingRequestSchema.nullable().describe('The JSON object for a booking request sent to the backend.'),
  callback_required: z.boolean().default(false).describe('Set to true if a manual callback is needed.'),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

const CallFlowInputSchema = z.object({
  conversationHistory: z.array(ConversationTurnSchema.omit({voice_output: true, bookingRequest: true }).extend({ role: z.enum(['user', 'agent']), dialog: z.string().nullable() })),
  leadDetails: LeadDetailsSchema,
  agencyName: z.string().default('EASTUDIO'),
  trigger: z.enum(['start_call', 'continue_call', 'end_call']),
});
export type CallFlowInput = z.infer<typeof CallFlowInputSchema>;

const CallFlowOutputSchema = z.array(ConversationTurnSchema);
export type CallFlowOutput = z.infer<typeof CallFlowOutputSchema>;

// Mock Booking Tool
const bookAppointmentTool = ai.defineTool(
  {
    name: 'bookAppointment',
    description: 'Sends a booking request to the backend calendly system. Use this when you have a date and time from the user.',
    inputSchema: BookingRequestSchema,
    outputSchema: z.enum(['available', 'booked', 'conflict', 'error', 'timeout']),
  },
  async (request) => {
    // In a real application, this would call a calendar API.
    // Here we simulate different outcomes.
    console.log(`[Mock Booking System] Received request:`, request);
    const outcomes: ('available' | 'conflict' | 'booked')[] = ['available', 'conflict', 'conflict', 'available', 'booked'];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    console.log(`[Mock Booking System] Responding with: ${result}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return result;
  }
);


// Main Agent Prompt
const agentSystem = `You are an AI Outbound Calling Agent for an estate agency. Your job is to call leads, qualify them, and book property valuation appointments using the backend booking system.

Speak naturally, clearly, and politely in a friendly UK tone. Keep sentences short. Ask ONE question at a time. Never rush. Never guess information or dates.

Your mission:
1. Confirm identity.
2. Confirm homeowner status.
3. Confirm they still want a valuation.
4. Collect basic property details (optional).
5. Ask for a suitable day and time.
6. Send a bookingRequest to the backend whenever date+time is provided.
7. WAIT QUIETLY until backend responds with "available", "booked", or "conflict".
8. Handle booking retries if a conflict occurs.
9. Summarise and end the call politely.

## OVERALL RULES
- Keep all spoken output under 15 seconds.
- Only speak in natural conversational English.
- Ask only ONE question at a time.
- Never overlap multiple questions.
- Never confirm anything until the backend returns success.
- Never suggest times unless the backend gives options or the user provides them.
- You must ALWAYS wait silently when backend booking is processing.
- Do not “fill in the gaps” or assume answers.
- Remain calm, apologetic, and helpful if the user seems confused.
- If the user goes off-topic, gently guide them back.

## CALL FLOW IN DETAIL
### 1. GREETING
Say: "Hello, is that {leadName}?"
If yes: "Hi, it’s {agencyName}. You recently requested a valuation of your property, and I’m calling to help you get that booked in."
If wrong person: "Can I speak to the homeowner of {propertyAddress}, please?"
If homeowner unavailable: "Okay, I’ll try again another time. Thank you." END CALL.

### 2. CONFIRM HOMEOWNER
"Can I just check, are you the homeowner for {propertyAddress}?"
If no: "Is the homeowner available?"
If still no: "Okay, I’ll update our notes. Thank you." END CALL.

### 3. CONFIRM INTEREST
"Are you still looking to have your property valued?"
If no: "That's absolutely fine. I'll update our records. Have a lovely day." END CALL.

### 4. OPTIONAL PROPERTY QUESTIONS (ONE AT A TIME)
- "Is it a house or a flat?"
- "How many bedrooms are there?"
- "Any recent improvements like a new kitchen or extension?"

### 5. MOVE INTO BOOKING
"Great. I can get this booked in for you. What day works best for you?"
Then: "And do you prefer morning or afternoon?"
If no preference: "What time suits you best?"
When the customer gives a time, proceed to booking.

## BACKEND BOOKING PROTOCOL
When the user provides a date AND a time, you MUST create and output a \`bookingRequest\` JSON object.

After sending a bookingRequest, do NOT speak further. Wait for the backend to return the booking result.

## BACKEND BOOKING RESPONSE HANDLING
Backend responses come as "available", "booked", "conflict", "error", or "timeout".
IF "booked" or "available":
Say: "Perfect, that time is available. Your valuation is booked for {DATE} at {TIME}."
Move to confirmation: "Is {PHONE_NUMBER} still the best number for any updates?"

## BOOKING RETRY LOGIC
If backend returns "conflict":
Say: "That time is unavailable, but I can look for something close to it. Would you prefer something slightly earlier, or slightly later?"
If earlier: "What is the earliest time that would work for you?"
If later: "What is the latest time that would work for you?"
When the customer gives a new time, send a new bookingRequest and WAIT.
Maximum retries: 3 attempts.
If still unavailable after 3 attempts:
Say: "Our booking system is quite busy at the moment. I’ll ask one of the team to call you shortly to confirm a time. Before I go, is there any particular day you prefer?"
Mark in JSON: callback_required = true
END CALL.

## CONFIRMATION & ENDING
Once booked: "Great. So your valuation is booked for {DATE} at {TIME} at {ADDRESS}. The valuer will see you then."
Ask: "Is {PHONE_NUMBER} the best number to reach you on?"
Closing: "Perfect. Thank you for your time today. Have a lovely day." END CALL.

## ERROR / FALLBACK RULES
If backend returns "error" or times out:
Say: "I’m having a little trouble accessing our booking system. I’ll ask one of the team to call you shortly to confirm a time."
Mark lead as callback_required.
`;

const agentPrompt = ai.definePrompt({
  name: 'eacallerAgent',
  system: agentSystem,
  tools: [bookAppointmentTool],
  output: {
    format: 'json',
    schema: ConversationTurnSchema,
  }
});


// Main Flow
const callFlow = ai.defineFlow(
  {
    name: 'callFlow',
    inputSchema: CallFlowInputSchema,
    outputSchema: CallFlowOutputSchema,
  },
  async (input) => {
    const history: MessageData[] = input.conversationHistory.map(turn => ({
      role: turn.role === 'agent' ? 'model' : 'user',
      content: [{ text: turn.dialog! }],
    }));

    const response = await ai.generate({
      prompt: `You are calling ${input.leadDetails.leadName} about the property at ${input.leadDetails.propertyAddress}. The agency is ${input.agencyName}. The lead's phone number is ${input.leadDetails.phoneNumber}.` + '\nConversation history: ' + JSON.stringify(history),

      model: 'googleai/gemini-2.5-flash',
      system: agentSystem,
      output: { schema: ConversationTurnSchema },
    });
    
    const outputTurns: ConversationTurn[] = [];
    const agentResponse = response.output as ConversationTurn | undefined;

    if (!agentResponse) {
        // This case handles when the model doesn't return valid JSON.
        outputTurns.push({
            voice_output: "I'm sorry, I seem to be having a technical issue. I will have a human colleague call you back shortly.",
            intent: 'error_invalid_response',
            bookingRequest: null,
            callback_required: true,
        });
        return outputTurns;
    }
    
    // Add the AI's generated turn to the output.
    // If it's a booking request, the voice_output will be spoken, then we wait.
    outputTurns.push(agentResponse);

    // If the agent created a booking request, we need to execute it and get the result.
    if (agentResponse.intent === 'request_booking' && agentResponse.bookingRequest) {
        const toolRequest = {
            name: 'bookAppointment',
            input: agentResponse.bookingRequest,
            run: async () => await bookAppointmentTool(agentResponse.bookingRequest!),
        };
        
        const toolResponse = await toolRequest.run();

        // Record the model response; the booking result is provided explicitly to the next prompt.
        const newHistory: MessageData[] = [
            ...history,
            { role: 'model', content: [{ text: agentResponse.voice_output ?? '' }] },
        ];

        // Generate the final response from the agent after getting the booking result
        const finalResponse = await ai.generate({
            prompt: `You are calling ${input.leadDetails.leadName}. The booking result was: ${toolResponse}.` + '\nConversation history: ' + JSON.stringify(newHistory),

            model: 'googleai/gemini-2.5-flash',
      system: agentSystem,
      output: { schema: ConversationTurnSchema },
        });
        
        const finalAgentTurn = finalResponse.output as ConversationTurn | undefined;
        if(finalAgentTurn?.voice_output) {
          outputTurns.push(finalAgentTurn);
        }
        return outputTurns;
    }
    
    return outputTurns;
  }
);


// Exported Server Action
export async function runCallFlow(
  conversationHistory: CallFlowInput['conversationHistory'],
  leadDetails: LeadDetails,
  trigger: 'start_call' | 'continue_call' | 'end_call'
): Promise<CallFlowOutput> {
  // Map simple history to the more complex schema if needed
  const mappedHistory = conversationHistory.map(turn => ({
      ...turn,
      intent: turn.intent || 'unknown',
  }));

  return callFlow({
    conversationHistory: mappedHistory,
    leadDetails,
    trigger,
    agencyName: 'EASTUDIO', // Or make this dynamic
  });
}

    